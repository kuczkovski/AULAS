import type { EstadoAluno, Avatar } from "@/engine/tipos";
import { getSupabase } from "./supabase";
import { gravarFila, lerFila, type AlunoNuvem, type RodadaPendente } from "./armazenamento";

export type ErroEntrada = "sem-servidor" | "codigo-ou-pin-invalido" | "bloqueado" | "rede";

export interface DadosEntrada {
  aluno: AlunoNuvem;
  apelido: string | null;
  avatar: Partial<Avatar>;
}

/** Abre sessão anônima e vincula ao aluno pelo código + PIN. */
export async function entrarComCodigo(codigo: string, pin: string): Promise<DadosEntrada | { erro: ErroEntrada }> {
  const sb = getSupabase();
  if (!sb) return { erro: "sem-servidor" };
  try {
    const { data: sess } = await sb.auth.getSession();
    if (!sess.session) {
      const { error } = await sb.auth.signInAnonymously();
      if (error) return { erro: "rede" };
    }
    const { data, error } = await sb.rpc("entrar_aluno", { p_codigo: codigo, p_pin: pin });
    if (error) return { erro: "rede" };
    if (data?.erro) return { erro: data.erro as ErroEntrada };
    return {
      aluno: { alunoId: data.aluno_id, turmaId: data.turma_id, turma: data.turma, ano: data.ano },
      apelido: data.apelido ?? null,
      avatar: data.avatar ?? {},
    };
  } catch {
    return { erro: "rede" };
  }
}

/**
 * Sai do aluno sem encerrar a sessão anônima: o Supabase limita logins anônimos a
 * 30 por hora por IP, e uma turma inteira atrás do IP da escola estouraria isso se
 * cada troca de aluno criasse uma sessão nova. O servidor desvincula o aluno e a
 * sessão fica sem acesso a nada até o próximo login.
 */
export async function sairDaNuvem() {
  try {
    await getSupabase()?.rpc("aluno_sair");
  } catch {
    /* sem rede: o vínculo cai no próximo login de outro aluno */
  }
}

/**
 * Lê o progresso salvo. Devolve `null` só quando o aluno realmente não tem
 * progresso; falha de rede vira "erro", para nunca tratar um erro como aluno
 * novo (o próximo envio apagaria o progresso real).
 */
export async function carregarEstadoRemoto(alunoId: string): Promise<{ estado: EstadoAluno; em: number } | null | "erro"> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb.from("estado_aluno").select("estado, atualizado_em").eq("aluno_id", alunoId).maybeSingle();
    if (error) return "erro";
    if (!data) return null;
    return { estado: data.estado as EstadoAluno, em: Date.parse(data.atualizado_em) };
  } catch {
    return "erro";
  }
}

export type ResultadoPerfil = "ok" | "apelido-invalido" | "rede";

export async function salvarPerfil(apelido: string, avatar: Avatar): Promise<ResultadoPerfil> {
  const sb = getSupabase();
  if (!sb) return "ok";
  try {
    const { error } = await sb.rpc("aluno_atualizar_perfil", { p_apelido: apelido, p_avatar: avatar });
    if (!error) return "ok";
    // o banco recusa o apelido com uma exceção conhecida; qualquer outra falha é de conexão
    return String(error.message).includes("apelido-invalido") ? "apelido-invalido" : "rede";
  } catch {
    return "rede";
  }
}

/** Uma sincronização por vez: chamadas em paralelo (fim de rodada e volta da internet) não podem enviar a mesma rodada duas vezes. */
let emCurso: Promise<void> = Promise.resolve();

/** Enfileira a rodada e tenta enviar tudo. Falhas de rede não interrompem o jogo. */
export function sincronizar(alunoId: string, estado: EstadoAluno, rodada?: RodadaPendente): Promise<void> {
  if (rodada) gravarFila([...lerFila(), rodada]);
  const passo = emCurso.then(() => enviar(alunoId, estado));
  emCurso = passo.catch(() => {});
  return passo;
}

async function enviar(alunoId: string, estado: EstadoAluno) {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const enviadas = new Set<string>();
    for (const r of lerFila()) {
      // rodada de outro aluno neste computador: fica guardada até ele entrar de novo
      if (r.alunoId !== alunoId) continue;
      const { error } = await sb.from("rodadas").insert({
        id: r.id, aluno_id: r.alunoId, tipo: r.tipo, andar: r.andar, acertos: r.acertos, total: r.total,
        pontos: r.pontos, duracao_s: r.duracaoS, falhou: r.falhou,
      });
      // 23505 = o servidor já tem esta rodada (o envio anterior chegou, mas a resposta se perdeu)
      if (!error || error.code === "23505") enviadas.add(r.id);
    }
    // relê a fila: rodadas que entraram enquanto se enviava não podem ser apagadas
    gravarFila(lerFila().filter((r) => !enviadas.has(r.id)));
    await sb.from("estado_aluno").upsert({ aluno_id: alunoId, estado, atualizado_em: new Date().toISOString() });
  } catch {
    /* sem rede: a fila fica guardada e sai no próximo envio */
  }
}

export interface LinhaPlacar {
  apelido: string;
  avatar: Partial<Avatar>;
  pontos: number;
  nivel: number;
  eu: boolean;
}
export interface MetaTurma {
  meta: number;
  pontos: number;
  alunos: number;
  ativos: number;
}

export interface LinhaEvolucao {
  apelido: string;
  avatar: Partial<Avatar>;
  nivel: number;
  /** Nota de 0 a 100 da semana. */
  score: number;
  eu: boolean;
  /** Detalhe da nota: só vem preenchido na linha do próprio aluno. */
  esforco_pct: number | null;
  acerto_delta: number | null;
  dias: number | null;
}

export async function carregarPlacar(): Promise<{ placar: LinhaPlacar[]; meta: MetaTurma | null; evolucao: LinhaEvolucao[] }> {
  const sb = getSupabase();
  if (!sb) return { placar: [], meta: null, evolucao: [] };
  const [p, m, e] = await Promise.all([sb.rpc("placar_turma"), sb.rpc("meta_turma"), sb.rpc("placar_evolucao")]);
  return {
    placar: ((p.data ?? []) as LinhaPlacar[]).map((l) => ({ ...l, pontos: Number(l.pontos) })),
    meta: (m.data as MetaTurma | null) ?? null,
    evolucao: (e.data ?? []) as LinhaEvolucao[],
  };
}
