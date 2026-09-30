import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase, supabaseConfigurado } from "./supabase";
import type { DadosBrutos, LinhaAuto, LinhaResposta, LinhaTentativa } from "./analise";

/** Modo local (sem Supabase configurado): sem login, dados no navegador. */
export const modoLocal = !supabaseConfigurado;

const sb = (): SupabaseClient => {
  const c = getSupabase();
  if (!c) throw new Error("Supabase não configurado");
  return c;
};

export type SituacaoProfessor = "carregando" | "sem-login" | "nao-autorizado" | "ok";

export async function situacaoProfessor(): Promise<{ situacao: SituacaoProfessor; email?: string }> {
  if (modoLocal) return { situacao: "ok" };
  const { data } = await sb().auth.getSession();
  const user = data.session?.user;
  if (!user) return { situacao: "sem-login" };
  const { data: ok, error } = await sb().rpc("professor_cadastrado");
  if (error) throw error;
  return { situacao: ok === true ? "ok" : "nao-autorizado", email: user.email ?? undefined };
}

export async function entrarProfessor(email: string, senha: string): Promise<string | null> {
  const { error } = await sb().auth.signInWithPassword({ email: email.trim(), password: senha });
  return error ? "E-mail ou senha incorretos." : null;
}

export const sairProfessor = () => (modoLocal ? Promise.resolve() : sb().auth.signOut());

const PAGINA = 1000;

/** O Supabase devolve no máximo 1000 linhas por consulta; lê em páginas. */
async function lerTudo<T>(tabela: string, colunas: string, ordem: string): Promise<T[]> {
  const out: T[] = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await sb().from(tabela).select(colunas).order(ordem).range(de, de + PAGINA - 1);
    if (error) throw error;
    out.push(...((data ?? []) as T[]));
    if ((data?.length ?? 0) < PAGINA) return out;
  }
}

export async function carregarDados(): Promise<DadosBrutos> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const { error } = await sb().rpc("professor_atualizar"); // fecha tentativas com o tempo vencido
    if (error) throw error;
    const [tentativas, respostas, autos] = await Promise.all([
      lerTudo<LinhaTentativa>("attempts", "id, student_name, class_name, started_at, finished_at, duration_seconds, status, total_correct, total_questions, percentage", "id"),
      lerTudo<LinhaResposta>("answers", "attempt_id, question_id, student_answer, is_correct, skill", "id"),
      lerTudo<LinhaAuto>("self_assessment", "attempt_id, item, score", "id"),
    ]);
    return { tentativas, respostas, autos };
  }
  const { lerLocal } = await import("./backendLocal");
  return lerLocal();
}

/** Resposta certa de cada questão (para o professor ver a correção de um aluno). */
export async function carregarGabarito(): Promise<Record<string, string>> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const { data, error } = await sb().from("gabarito").select("question_id, correta");
    if (error) throw error;
    return Object.fromEntries((data ?? []).map((l: { question_id: string; correta: string }) => [l.question_id, l.correta]));
  }
  return (await import("@/dominio/gabarito")).GABARITO;
}

/** Apaga tentativas (por exemplo, as de teste do piloto). As respostas saem junto. */
export async function apagarTentativas(ids: string[]): Promise<void> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const { error } = await sb().from("attempts").delete().in("id", ids);
    if (error) throw error;
    return;
  }
  const { lerLocal, gravarLocal } = await import("./backendLocal");
  const d = lerLocal();
  const fora = new Set(ids);
  gravarLocal({
    tentativas: d.tentativas.filter(t => !fora.has(t.id)),
    respostas: d.respostas.filter(r => !fora.has(r.attempt_id)),
    autos: d.autos.filter(a => !fora.has(a.attempt_id)),
  });
}

/** Só no modo local: preenche o painel com uma turma fictícia para conhecer a interface. */
export async function gerarDemonstracao(): Promise<void> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;
  const { gerarDadosDemo } = await import("./demo");
  const { gravarLocal } = await import("./backendLocal");
  gravarLocal(gerarDadosDemo());
}
