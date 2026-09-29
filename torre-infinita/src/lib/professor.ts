import type { EstadoAluno } from "@/engine/tipos";
import { inicioDaSemana } from "@/engine/estado";
import { getSupabase } from "./supabase";

export interface Turma {
  id: string;
  nome: string;
  ano: 6 | 7 | 8 | 9;
  meta_semanal: number;
}

export interface AlunoLinha {
  id: string;
  codigo: string;
  nome: string;
  apelido: string | null;
  estado: EstadoAluno | null;
  atualizadoEm: string | null;
  pontosSemana: number;
  minutosSemana: number;
  rodadasSemana: number;
  ultima: string | null;
}

export interface PinNovo {
  codigo: string;
  nome: string;
  pin: string;
}

const sb = () => {
  const c = getSupabase();
  if (!c) throw new Error("Supabase não configurado");
  return c;
};

export async function entrarProfessor(email: string, senha: string): Promise<string | null> {
  const { error } = await sb().auth.signInWithPassword({ email, password: senha });
  return error ? "E-mail ou senha incorretos." : null;
}

export const sairProfessor = () => sb().auth.signOut();

/** Retorna o professor logado; sessões anônimas (alunos) não valem. */
export async function professorAtual(): Promise<{ id: string; email: string } | null> {
  const { data } = await sb().auth.getSession();
  const u = data.session?.user;
  if (!u || u.is_anonymous) return null;
  return { id: u.id, email: u.email ?? "" };
}

export async function listarTurmas(): Promise<Turma[]> {
  const { data, error } = await sb().from("turmas").select("id, nome, ano, meta_semanal").order("nome");
  if (error) throw error;
  return (data ?? []) as Turma[];
}

export async function criarTurma(professorId: string, nome: string, ano: number, meta: number): Promise<Turma> {
  const { data, error } = await sb()
    .from("turmas")
    .insert({ professor_id: professorId, nome, ano, meta_semanal: meta })
    .select("id, nome, ano, meta_semanal")
    .single();
  if (error) throw error;
  return data as Turma;
}

export async function atualizarMeta(turmaId: string, meta: number) {
  const { error } = await sb().from("turmas").update({ meta_semanal: meta }).eq("id", turmaId);
  if (error) throw error;
}

/** Linhas "código;nome" ou "código,nome" (uma por linha). */
export function lerLista(texto: string): { codigo: string; nome: string }[] {
  return texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [codigo, ...resto] = l.split(/[;,\t]/);
      return { codigo: (codigo ?? "").trim().toLowerCase(), nome: resto.join(" ").trim() };
    })
    .filter((a) => /^[a-z0-9._-]{3,20}$/.test(a.codigo) && a.nome);
}

export async function importarAlunos(turmaId: string, alunos: { codigo: string; nome: string }[]): Promise<PinNovo[]> {
  const { data, error } = await sb().rpc("professor_importar_alunos", { p_turma: turmaId, p_alunos: alunos });
  if (error) throw error;
  return (data ?? []) as PinNovo[];
}

export async function resetarPin(alunoId: string): Promise<string> {
  const { data, error } = await sb().rpc("professor_resetar_pin", { p_aluno: alunoId });
  if (error) throw error;
  return data as string;
}

export async function carregarTurma(turmaId: string): Promise<AlunoLinha[]> {
  const c = sb();
  const semana = inicioDaSemana();
  const alunos = await c.from("alunos").select("id, codigo, nome, apelido").eq("turma_id", turmaId).order("nome");
  if (alunos.error) throw alunos.error;
  const ids = (alunos.data ?? []).map((a) => a.id as string);
  const [estados, resumo] = await Promise.all([
    ids.length ? c.from("estado_aluno").select("aluno_id, estado, atualizado_em").in("aluno_id", ids) : Promise.resolve({ data: [] }),
    c.from("resumo_semanal").select("aluno_id, pontos, minutos, rodadas, ultima").eq("turma_id", turmaId).eq("semana", semana),
  ]);
  const est = new Map((estados.data ?? []).map((e) => [e.aluno_id as string, e]));
  const res = new Map((resumo.data ?? []).map((r) => [r.aluno_id as string, r]));
  return (alunos.data ?? []).map((a) => {
    const e = est.get(a.id as string), r = res.get(a.id as string);
    return {
      id: a.id as string,
      codigo: a.codigo as string,
      nome: a.nome as string,
      apelido: (a.apelido as string | null) ?? null,
      estado: (e?.estado as EstadoAluno | undefined) ?? null,
      atualizadoEm: (e?.atualizado_em as string | undefined) ?? null,
      pontosSemana: Number(r?.pontos ?? 0),
      minutosSemana: Number(r?.minutos ?? 0),
      rodadasSemana: Number(r?.rodadas ?? 0),
      ultima: (r?.ultima as string | undefined) ?? null,
    };
  });
}
