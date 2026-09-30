import { describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Executa a migração num Postgres em memória (PGlite) com um `auth` simulado
 * e confere, por papéis, o que professor e alunos podem ou não fazer:
 * RLS, PIN individual, bloqueio por tentativas, apelidos, teto de pontos e
 * placar sem dados pessoais.
 */
describe("migração do Supabase", () => {
  it("aplica as regras de acesso esperadas", async () => {
  const db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(`
    create schema auth; create schema extensions;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.sub', true),'')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true),''),'{}')::jsonb $$;
    create role authenticated; create role anon;
    grant usage on schema public, auth to authenticated;
  `);
  for (const arq of ["0001_init.sql", "0002_endurecer_funcoes.sql", "0003_placar_evolucao.sql", "0004_seguranca.sql", "0005_aluno_sair.sql"])
      await db.exec(readFileSync(fileURLToPath(new URL("../../supabase/migrations/" + arq, import.meta.url)), "utf8"));
  await db.exec(`grant select, insert, update, delete on all tables in schema public to authenticated;`);
    await db.exec(`insert into professores (email) values ('prof@escola.test')`);

  const PROF = "11111111-1111-1111-1111-111111111111";
  const S1 = "22222222-2222-2222-2222-222222222222";
  const S2 = "33333333-3333-3333-3333-333333333333";
  const S3 = "44444444-4444-4444-4444-444444444444";
  await db.exec(`insert into auth.users values ('${PROF}'),('${S1}'),('${S2}'),('${S3}')`);

  async function como<T>(uid: string, anon: boolean, fn: () => Promise<T>): Promise<T> {
    await db.exec(`select set_config('request.jwt.sub','${uid}',false), set_config('request.jwt.claims','{"is_anonymous":${anon}${anon ? "" : ',"email":"prof@escola.test"'}}',false); set role authenticated;`);
    try { return await fn(); } finally { await db.exec("reset role;"); }
  }
  let ok = 0;
    const falhas: string[] = [];
  const esperar = (nome: string, cond: boolean) => { cond ? ok++ : falhas.push(nome); };
  const erra = async (nome: string, fn: () => Promise<unknown>, trecho?: string) => {
    try { await fn(); falhas.push(nome + " (deveria falhar)"); }
    catch (e) { const msg = String((e as Error).message); if (trecho && !msg.includes(trecho)) falhas.push(`${nome}: erro inesperado "${msg}"`); else ok++; }
  };

  // professor cria turma e importa alunos
  const turma = await como(PROF, false, async () => {
    const t = await db.query<any>(`insert into turmas (professor_id, nome, ano) values ('${PROF}','7º A',7) returning id`);
    return t.rows[0].id;
  });
  const importados = await como(PROF, false, async () =>
    (await db.query<any>(`select * from professor_importar_alunos('${turma}', '[{"codigo":"E100","nome":"Ana"},{"codigo":"e200","nome":"Bruno"},{"codigo":"e300","nome":"Carla"}]')`)).rows);
  esperar("importa 3 alunos com PIN de 4 dígitos", importados.length === 3 && importados.every(r => /^\d{4}$/.test(r.pin)));
  const pin = Object.fromEntries(importados.map(r => [r.codigo, r.pin]));
  esperar("código normalizado em minúsculas", "e100" in pin);

  // reimportar não gera novo PIN
  const reimp = await como(PROF, false, async () =>
    (await db.query<any>(`select * from professor_importar_alunos('${turma}', '[{"codigo":"e100","nome":"Ana Maria"}]')`)).rows);
  esperar("reimportar atualiza sem novo PIN", reimp.length === 0);

  // anônimo não cria turma
  await erra("anônimo não cria turma", () => como(S1, true, () => db.query<any>(`insert into turmas (professor_id, nome, ano) values ('${S1}','x',6)`)), "row-level security");

  // login
  const errado = await como(S1, true, async () => (await db.query<any>(`select entrar_aluno('e100','0000x') as r`)).rows[0].r);
  esperar("PIN errado devolve erro", errado.erro === "codigo-ou-pin-invalido");
  const login = await como(S1, true, async () => (await db.query<any>(`select entrar_aluno('E100','${pin.e100}') as r`)).rows[0].r);
  esperar("login retorna turma e ano", login.ano === 7 && login.turma === "7º A");
  await como(S2, true, () => db.query<any>(`select entrar_aluno('e200','${pin.e200}')`));
  await como(S3, true, () => db.query<any>(`select entrar_aluno('e300','${pin.e300}')`));

  // bloqueio após 5 falhas
  for (let i = 0; i < 5; i++) await como(S1, true, () => db.query<any>(`select entrar_aluno('e200','9999${i}')`));
  const bloq = await como(S1, true, async () => (await db.query<any>(`select entrar_aluno('e200','${pin.e200}') as r`)).rows[0].r);
  esperar("bloqueia após 5 falhas, mesmo com o PIN certo", bloq.erro === "bloqueado");

  // perfil e apelidos
  await como(S1, true, () => db.query<any>(`select aluno_atualizar_perfil('Ana M.', '{"cor":2,"forma":1,"acessorio":0}')`));
  await como(S2, true, () => db.query<any>(`select aluno_atualizar_perfil('Bruno', '{"cor":1,"forma":0,"acessorio":4}')`));
  for (const ruim of ["porra doida", "P.U.T.A", "x", "1abc", "<script>"])
    await erra(`apelido recusado: ${ruim}`, () => como(S3, true, () => db.query<any>(`select aluno_atualizar_perfil($1,'{}')`, [ruim])), "apelido-invalido");

  // rodadas
  const ins = (uid: string, aluno: string, pontos: number, total = 10) => como(uid, true, () => db.query<any>(
    `insert into rodadas (aluno_id, turma_id, tipo, andar, acertos, total, pontos) values ('${aluno}', '${turma}', 'treino', 1, ${Math.min(total, 9)}, ${total}, ${pontos})`));
  const ids = Object.fromEntries((await db.query<any>(`select codigo, id from alunos`)).rows.map(r => [r.codigo, r.id]));
  await ins(S1, ids.e100, 120); await ins(S1, ids.e100, 90); await ins(S2, ids.e200, 150);
  await erra("pontos absurdos barrados", () => ins(S1, ids.e100, 999999), "check");
  await erra("rodada em nome de outro aluno barrada", () => ins(S1, ids.e200, 10), "row-level security");
  const r = await db.query<any>(`select turma_id, semana from rodadas limit 1`);
  esperar("servidor preenche turma e semana", r.rows[0].turma_id === turma && !!r.rows[0].semana);

  // isolamento
  const vistos = await como(S1, true, async () => (await db.query<any>(`select codigo from alunos`)).rows);
  esperar("aluno só vê a própria linha em alunos", vistos.length === 1 && vistos[0].codigo === "e100");
  const turmasVistas = await como(S1, true, async () => (await db.query<any>(`select * from turmas`)).rows);
  esperar("aluno não lê turmas", turmasVistas.length === 0);
  const minhasRodadas = await como(S2, true, async () => (await db.query<any>(`select * from rodadas`)).rows);
  esperar("aluno só vê as próprias rodadas", minhasRodadas.length === 1);

  // placar e meta
  const placar = await como(S1, true, async () => (await db.query<any>(`select * from placar_turma()`)).rows);
  esperar("placar ordenado e sem dados pessoais", placar.length === 2 && Number(placar[0].pontos) === 210 && !("codigo" in placar[0]) && placar[0].apelido === "Ana M." && placar[0].eu === true);
  esperar("carla (sem apelido) fica fora do placar", !placar.some(p => p.apelido == null));
  const meta = await como(S1, true, async () => (await db.query<any>(`select meta_turma() as m`)).rows[0].m);
  esperar("meta da turma", meta.pontos === 360 && meta.alunos === 3 && meta.ativos === 2 && meta.meta === 5000);

  // estado
  await como(S1, true, () => db.query<any>(`insert into estado_aluno (aluno_id, estado) values ('${ids.e100}', '{"nivel":4}')`));
  await erra("estado de outro aluno barrado", () => como(S1, true, () => db.query<any>(`insert into estado_aluno (aluno_id, estado) values ('${ids.e200}', '{}')`)), "row-level security");

  // professor
  const prof = await como(PROF, false, async () => ({
    alunos: (await db.query<any>(`select nome from alunos`)).rows.length,
    estados: (await db.query<any>(`select * from estado_aluno`)).rows.length,
    rodadas: (await db.query<any>(`select * from rodadas`)).rows.length,
    resumo: (await db.query<any>(`select * from resumo_semanal order by pontos desc`)).rows,
  }));
  esperar("professor vê alunos, estado e rodadas", prof.alunos === 3 && prof.estados === 1 && prof.rodadas === 3);
  esperar("resumo semanal soma por aluno", prof.resumo.length === 2 && Number(prof.resumo[0].pontos) === 210);
  const novoPin = await como(PROF, false, async () => (await db.query<any>(`select professor_resetar_pin('${ids.e300}') as p`)).rows[0].p);
  esperar("professor reseta PIN", /^\d{4}$/.test(novoPin));
  await erra("aluno não reseta PIN", () => como(S1, true, () => db.query<any>(`select professor_resetar_pin('${ids.e300}')`)), "sem-permissao");
  const velho = await como(S3, true, async () => (await db.query<any>(`select entrar_aluno('e300','${pin.e300}') as r`)).rows[0].r);
  esperar("PIN antigo deixa de valer", velho.erro === "codigo-ou-pin-invalido");

  expect(falhas).toEqual([]);
  expect(ok).toBeGreaterThanOrEqual(27);

  }, 60_000);
});

describe("placar por evolução pessoal", () => {
  it("compara cada aluno com o próprio histórico e esconde o detalhe dos outros", async () => {
    const db = new PGlite({ extensions: { pgcrypto } });
    await db.exec(`
      create schema auth; create schema extensions;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.sub', true),'')::uuid $$;
      create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true),''),'{}')::jsonb $$;
      create role authenticated; create role anon;
      grant usage on schema public, auth to authenticated;
    `);
    for (const arq of ["0001_init.sql", "0002_endurecer_funcoes.sql", "0003_placar_evolucao.sql", "0004_seguranca.sql", "0005_aluno_sair.sql"])
      await db.exec(readFileSync(fileURLToPath(new URL("../../supabase/migrations/" + arq, import.meta.url)), "utf8"));
    await db.exec(`grant select, insert, update, delete on all tables in schema public to authenticated;`);

    const PROF = "11111111-1111-1111-1111-111111111111", SA = "22222222-2222-2222-2222-222222222222", SB = "33333333-3333-3333-3333-333333333333";
    await db.exec(`insert into auth.users values ('${PROF}'),('${SA}'),('${SB}')`);
    const [{ id: turma }] = (await db.query<any>(`insert into turmas (professor_id, nome, ano) values ('${PROF}','7A',7) returning id`)).rows;
    await db.exec(`
      insert into alunos (turma_id, codigo, nome, pin_hash, apelido, auth_uid) values
        ('${turma}', 'aaa', 'Ana', 'x', 'Ana', '${SA}'),
        ('${turma}', 'bbb', 'Bia', 'x', 'Bia', '${SB}');
    `);
    const ids = Object.fromEntries((await db.query<any>(`select codigo, id from alunos`)).rows.map((r) => [r.codigo, r.id]));

    // O gatilho fixa semana e data; para simular o passado ele é desligado só nesta carga.
    await db.exec(`alter table rodadas disable trigger rodadas_preencher`);
    const w = (dias: number) => `(date_trunc('week', now() at time zone 'America/Cuiaba') - interval '${dias} days')::date`;
    const ins = (aluno: string, semana: string, dia: string, pontos: number, acertos: number, total: number) =>
      `insert into rodadas (aluno_id, turma_id, tipo, acertos, total, pontos, semana, criada_em) values ('${aluno}', '${turma}', 'treino', ${acertos}, ${total}, ${pontos}, ${semana}, ${dia})`;
    const sql: string[] = [];
    // Ana: 4 semanas anteriores com 1000 pontos e 60% de acerto
    for (let k = 1; k <= 4; k++) sql.push(ins(ids.aaa, w(7 * k), `now() - interval '${7 * k + 1} days'`, 1000, 6, 10));
    // esta semana: 4 dias, 300 pontos por dia, 75% de acerto  => 1200 pontos
    for (let d = 0; d < 4; d++) sql.push(ins(ids.aaa, w(0), `now() - interval '${d} minutes' - interval '${d} days'`, 300, 3, 4));
    // Bia: sem histórico; um dia só com 3000 pontos (teto de 2000) e 90% de acerto
    sql.push(ins(ids.bbb, w(0), `now()`, 1500, 18, 20), ins(ids.bbb, w(0), `now()`, 1500, 18, 20));
    await db.exec(sql.join(";\n"));
    await db.exec(`alter table rodadas enable trigger rodadas_preencher`);

    const como = async <T,>(uid: string, fn: () => Promise<T>): Promise<T> => {
      await db.exec(`select set_config('request.jwt.sub','${uid}',false), set_config('request.jwt.claims','{"is_anonymous":${uid !== PROF}}',false); set role authenticated;`);
      try { return await fn(); } finally { await db.exec("reset role;"); }
    };

    const doAna = await como(SA, async () => (await db.query<any>(`select * from placar_evolucao()`)).rows);
    const ana = doAna.find((l) => l.eu)!;
    // esforço: 1200/1000 = 120% => 1,2/1,5*50 = 40; precisão: (0,75-0,60)*2+0,5 = 0,8 => 16; constância: 4 dias => 24
    expect(ana).toMatchObject({ apelido: "Ana", score: 80, esforco_pct: 120, acerto_delta: 15, dias: 4 });
    const bia = doAna.find((l) => !l.eu)!;
    // detalhe da colega não aparece para a Ana
    expect(bia).toMatchObject({ apelido: "Bia", esforco_pct: null, acerto_delta: null, dias: null });
    // Bia: 2000 (teto do dia) / 300 (referência) limitado a 150% => 50; sem histórico: 0,9*20 = 18; 1 dia => 6
    expect(bia.score).toBe(74);
    expect(doAna.map((l) => l.apelido)).toEqual(["Ana", "Bia"]);
    expect(Object.keys(bia)).not.toContain("codigo");

    const doProf = await como(PROF, async () => (await db.query<any>(`select * from professor_evolucao('${turma}')`)).rows);
    expect(doProf.find((r) => r.aluno_id === ids.bbb)).toMatchObject({ score: 74, dias: 1 });
    // aluno não pode chamar a função do professor, nem a interna
    await expect(como(SA, () => db.query(`select * from professor_evolucao('${turma}')`))).rejects.toThrow();
    await expect(como(SA, () => db.query(`select * from evolucao_calc('${turma}')`))).rejects.toThrow();
  }, 60_000);
});
