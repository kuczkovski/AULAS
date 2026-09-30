import { describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { QUESTOES } from "@/dominio/questoes";
import { GABARITO } from "@/dominio/gabarito";

/**
 * Roda a migração num Postgres em memória (PGlite), com um `auth` simulado, e confere por papéis
 * o que aluno (anon), professor e outro usuário logado podem ou não fazer.
 */
async function novoBanco() {
  const db = new PGlite();
  await db.exec(`
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.sub', true),'')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true),''),'{}')::jsonb $$;
    create role authenticated; create role anon;
    grant usage on schema public, auth to authenticated, anon;
  `);
  for (const arq of ["0001_diagnostico.sql", "0002_search_path.sql", "0003_banco_20_questoes.sql"])
    await db.exec(readFileSync(fileURLToPath(new URL("../../supabase/migrations/" + arq, import.meta.url)), "utf8"));
  await db.exec(`insert into professores (email) values ('prof@escola.test')`);
  return db;
}

type Papel = "anon" | { email: string };
async function como<T>(db: PGlite, papel: Papel, fn: () => Promise<T>): Promise<T> {
  const claims = papel === "anon" ? "{}" : JSON.stringify({ email: papel.email });
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [claims]);
  await db.exec(`set role ${papel === "anon" ? "anon" : "authenticated"};`);
  try { return await fn(); } finally { await db.exec("reset role;"); }
}

const rpc = async (db: PGlite, fn: string, ...args: unknown[]) => {
  const ph = args.map((_, i) => `$${i + 1}`).join(", ");
  const r = await db.query<{ r: any }>(`select public.${fn}(${ph}) as r`, args);
  return r.rows[0]!.r;
};
const falha = async (p: Promise<unknown>) => {
  try { await p; } catch (e) { return String((e as Error).message); }
  return null;
};

const respostaCerta = (id: string) => GABARITO[id]!;

describe("migração do diagnóstico", () => {
  it("o gabarito do banco e o do app concordam", async () => {
    const db = await novoBanco();
    const { rows } = await db.query<any>(`select question_id, skill, tipo, opcoes, correta from gabarito order by length(question_id), question_id`);
    expect(rows).toHaveLength(QUESTOES.length);
    for (const q of QUESTOES) {
      const linha = rows.find(r => r.question_id === q.id);
      expect(linha, q.id).toBeTruthy();
      expect(linha.skill, q.id).toBe(q.dim);
      expect(linha.tipo, q.id).toBe(q.tipo);
      expect(linha.correta, q.id).toBe(GABARITO[q.id]);
      if (q.tipo === "multipla") {
        expect(linha.opcoes, q.id).toEqual(q.opcoes);
        expect(q.opcoes, q.id).toContain(GABARITO[q.id]);
      }
    }
  });

  it("aplica as regras de acesso e de correção", async () => {
    const db = await novoBanco();
    const aluno = <T,>(fn: () => Promise<T>) => como(db, "anon", fn);

    // anon não lê nada diretamente
    for (const t of ["attempts", "answers", "self_assessment", "gabarito", "professores"])
      expect(await aluno(() => falha(db.query(`select * from ${t}`))), `anon lê ${t}`).toContain("permission denied");
    expect(await aluno(() => falha(db.query(`update attempts set status = 'concluida'`)))).toContain("permission denied");
    expect(await aluno(() => falha(rpc(db, "_encerrar", "00000000-0000-0000-0000-000000000000", "concluida")))).toContain("permission denied");

    // validações de entrada
    expect(await aluno(() => falha(rpc(db, "iniciar_tentativa", "Ana", "1º A")))).toContain("nome-invalido");
    expect(await aluno(() => falha(rpc(db, "iniciar_tentativa", "Ana Souza", "2º A")))).toContain("turma-invalida");
    expect(await aluno(() => falha(rpc(db, "iniciar_tentativa", "Ana Souza", "1º F")))).toContain("turma-invalida");

    // início, conflito e continuação
    const ana = await aluno(() => rpc(db, "iniciar_tentativa", "  Ana   Souza ", "1º A"));
    expect(ana.status).toBe("em_andamento");
    expect(ana.nome).toBe("Ana Souza");
    const dup = await aluno(() => rpc(db, "iniciar_tentativa", "ANA SOUZA", "1º A"));
    expect(dup.conflito).toBe(true);
    const outraTurma = await aluno(() => rpc(db, "iniciar_tentativa", "Ana Souza", "1º B"));
    expect(outraTurma.id).not.toBe(ana.id);
    const cont = await aluno(() => rpc(db, "iniciar_tentativa", "Ana Souza", "1º A", true));
    expect(cont.id).toBe(ana.id);
    const acento = await aluno(() => rpc(db, "iniciar_tentativa", "João Lima", "1º C"));
    expect((await aluno(() => rpc(db, "iniciar_tentativa", "joao lima", "1º C"))).conflito).toBe(true);

    // respostas: validação e correção no servidor
    const salvar = (id: string, q: string, r: string) => aluno(() => rpc(db, "salvar_resposta", id, q, r));
    expect(await aluno(() => falha(salvar(ana.id, "Q1", "Centauro")))).toContain("resposta-invalida");
    expect(await aluno(() => falha(salvar(ana.id, "Q14", "")))).toContain("resposta-invalida");
    expect(await aluno(() => falha(salvar(ana.id, "Q14", "abc")))).toContain("resposta-invalida");
    expect(await aluno(() => falha(salvar(ana.id, "Q14", "-90")))).toContain("resposta-invalida");
    expect(await aluno(() => falha(salvar(ana.id, "Q99", "1")))).toContain("questao-invalida");
    expect(await aluno(() => falha(salvar("11111111-1111-1111-1111-111111111111", "Q1", "Reta")))).toContain("tentativa-inexistente");

    expect((await salvar(ana.id, "Q14", " 180° ")).ok).toBe(true);
    expect((await salvar(ana.id, "Q15", "90,0 graus")).ok).toBe(true);
    await salvar(ana.id, "Q1", "Reta");
    await salvar(ana.id, "Q1", "Segmento de reta"); // trocar a resposta regrava
    const estado = await aluno(() => rpc(db, "obter_tentativa", ana.id));
    expect(estado.respostas).toMatchObject({ Q1: "Segmento de reta", Q14: "180", Q15: "90" });
    expect(estado.resumo).toBeNull(); // nada de resultado durante a prova
    expect(JSON.stringify(estado)).not.toContain("is_correct");

    // não finaliza incompleta
    expect(await aluno(() => falha(rpc(db, "finalizar_tentativa", ana.id)))).toContain("incompleta");
    expect(await aluno(() => falha(rpc(db, "finalizar_tentativa", ana.id, true)))).toContain("tempo-nao-esgotado");

    // autoavaliação
    expect(await aluno(() => falha(rpc(db, "salvar_autoavaliacao", ana.id, JSON.stringify({ A1: 5 }))))).toContain("autoavaliacao-invalida");
    expect(await aluno(() => falha(rpc(db, "salvar_autoavaliacao", ana.id, JSON.stringify({ A9: 2 }))))).toContain("autoavaliacao-invalida");
    expect(await aluno(() => falha(rpc(db, "salvar_autoavaliacao", ana.id, JSON.stringify({ A1: "3" }))))).toContain("autoavaliacao-invalida");
    await aluno(() => rpc(db, "salvar_autoavaliacao", ana.id, JSON.stringify({ A1: 3, A2: 4 })));
    await aluno(() => rpc(db, "salvar_autoavaliacao", ana.id, JSON.stringify({ A1: 2 })));

    // responde todas com o gabarito, errando Q2, Q3, Q11, Q17, Q18 e Q19
    const erradas: Record<string, string> = { Q2: "Corda", Q3: "18 cm", Q11: "Reto", Q17: "30", Q18: "300", Q19: "1/2" };
    for (const q of QUESTOES) await salvar(ana.id, q.id, erradas[q.id] ?? respostaCerta(q.id));
    const fim = await aluno(() => rpc(db, "finalizar_tentativa", ana.id));
    expect(fim.status).toBe("concluida");
    expect(fim.resumo.total_correct).toBe(14);
    expect(fim.resumo.dimensoes.D1).toMatchObject({ acertos: 3, total: 5, pct: 60, nivel: "funcional" });
    expect(fim.resumo.dimensoes.D2).toMatchObject({ acertos: 5, total: 5, pct: 100, nivel: "consolidado" });
    expect(fim.resumo.dimensoes.D3).toMatchObject({ acertos: 4, total: 5, pct: 80, nivel: "consolidado" });
    expect(fim.resumo.dimensoes.D4).toMatchObject({ acertos: 2, total: 5, pct: 40, nivel: "fragil" });
    expect(fim.autoavaliacao).toEqual({ A1: 2, A2: 4 });

    // depois de concluída, ninguém altera nada
    expect((await salvar(ana.id, "Q1", "Corda")).ok).toBe(false);
    expect((await aluno(() => rpc(db, "salvar_autoavaliacao", ana.id, JSON.stringify({ A1: 4 })))).ok).toBe(false);
    expect((await aluno(() => rpc(db, "finalizar_tentativa", ana.id))).resumo.total_correct).toBe(14);
    const { rows: [t] } = await db.query<any>(`select status, total_correct, total_questions, percentage, finished_at, duration_seconds from attempts where id = $1`, [ana.id]);
    expect(t).toMatchObject({ status: "concluida", total_correct: 14, total_questions: 20 });
    expect(Number(t.percentage)).toBe(70);
    expect(t.finished_at).toBeTruthy();
    expect(t.duration_seconds).toBeGreaterThanOrEqual(0);
    expect((await db.query<any>(`select student_answer from answers where attempt_id=$1 and question_id='Q1'`, [ana.id])).rows[0].student_answer).toBe("Segmento de reta");

    // depois de concluída, o mesmo nome pode começar outra tentativa (fica registrada, não é apagada)
    const de_novo = await aluno(() => rpc(db, "iniciar_tentativa", "Ana Souza", "1º A"));
    expect(de_novo.id).not.toBe(ana.id);
    expect((await db.query<any>(`select count(*)::int as n from attempts where student_key = 'ana souza' and class_name = '1º A'`)).rows[0].n).toBe(2);

    // tempo esgotado: a tentativa é fechada com o que foi respondido
    await salvar(acento.id, "Q1", "Segmento de reta");
    await salvar(acento.id, "Q2", "Raio");
    await db.query(`update attempts set started_at = now() - interval '59 minutes 55 seconds' where id = $1`, [acento.id]);
    expect(await aluno(() => rpc(db, "finalizar_tentativa", acento.id, true)).then(r => r.status)).toBe("encerrada_por_tempo");
    const { rows: [te] } = await db.query<any>(`select status, total_correct, duration_seconds from attempts where id = $1`, [acento.id]);
    expect(te).toMatchObject({ status: "encerrada_por_tempo", total_correct: 2, duration_seconds: 3600 });
    expect((await salvar(acento.id, "Q3", "36 cm")).ok).toBe(false);

    // tentativa abandonada é fechada sozinha quando o prazo passa
    const abandonada = await aluno(() => rpc(db, "iniciar_tentativa", "Caio Dias", "1º D"));
    await db.query(`update attempts set started_at = now() - interval '2 hours' where id = $1`, [abandonada.id]);
    const apos = await aluno(() => rpc(db, "obter_tentativa", abandonada.id));
    expect(apos.status).toBe("encerrada_por_tempo");
    expect(apos.resumo.total_correct).toBe(0);
    // e com isso o nome pode iniciar de novo sem conflito
    expect((await aluno(() => rpc(db, "iniciar_tentativa", "Caio Dias", "1º D"))).conflito).toBeUndefined();

    // professor: só e-mail cadastrado lê
    const prof = { email: "prof@escola.test" };
    const n = async (t: string) => (await db.query<any>(`select count(*)::int as n from ${t}`)).rows[0].n;
    expect(await como(db, prof, () => n("attempts"))).toBeGreaterThanOrEqual(5);
    expect(await como(db, prof, () => n("answers"))).toBeGreaterThan(20);
    expect(await como(db, prof, () => n("gabarito"))).toBe(20);
    expect(await como(db, prof, () => n("self_assessment"))).toBe(2);
    const intruso = { email: "outro@escola.test" };
    for (const t of ["attempts", "answers", "self_assessment", "gabarito"])
      expect(await como(db, intruso, () => n(t)), `intruso lê ${t}`).toBe(0);
    expect(await como(db, intruso, () => falha(rpc(db, "professor_atualizar")))).toContain("sem-permissao");
    await como(db, prof, () => rpc(db, "professor_atualizar"));
    expect(await como(db, prof, () => falha(db.query(`update attempts set status = 'concluida'`)))).toContain("permission denied");

    // apagar tentativa de teste: só o professor, e leva as respostas junto
    await como(db, intruso, () => db.query(`delete from attempts where id = $1`, [ana.id]));
    expect(await como(db, prof, () => n("attempts"))).toBeGreaterThanOrEqual(5);
    const antes = await como(db, prof, () => n("attempts"));
    await como(db, prof, () => db.query(`delete from attempts where id = $1`, [ana.id]));
    expect(await como(db, prof, () => n("attempts"))).toBe(antes - 1);
    expect((await db.query<any>(`select count(*)::int as n from answers where attempt_id = $1`, [ana.id])).rows[0].n).toBe(0);
  }, 60_000);
});
