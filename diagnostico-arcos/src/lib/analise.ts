import { DIMS, ITENS_AUTO, QUESTOES, TURMAS, type Dim } from "@/dominio/questoes";
import { pct, resultadoPorDimensao, type Nivel, type ResultadoDim } from "@/dominio/pontuacao";
import type { Status } from "./tipos";

/** Linhas como vêm das tabelas do banco. */
export interface LinhaTentativa {
  id: string;
  student_name: string;
  class_name: string;
  started_at: string;
  finished_at: string | null;
  duration_seconds: number | null;
  status: Status;
  total_correct: number | null;
  total_questions: number | null;
  percentage: number | string | null;
}
export interface LinhaResposta { attempt_id: string; question_id: string; student_answer: string; is_correct: boolean; skill: string }
export interface LinhaAuto { attempt_id: string; item: string; score: number }

export interface DadosBrutos { tentativas: LinhaTentativa[]; respostas: LinhaResposta[]; autos: LinhaAuto[] }

export const chaveNome = (nome: string) =>
  nome.trim().replace(/\s+/g, " ").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export type PerfilAuto = "superestima" | "subestima" | "coerente";

/** Diferença (em pontos percentuais) a partir da qual a autoavaliação é considerada descolada do desempenho. */
export const LIMITE_AUTO = 25;

export interface AlunoAnalise {
  id: string;
  nome: string;
  turma: string;
  status: Status;
  inicio: string;
  duracao: number | null;
  /** Tentativas do mesmo nome e turma (a mais recente é a analisada). */
  nTentativas: number;
  /** true/false por questão; null = sem resposta */
  acertou: Record<string, boolean | null>;
  respostas: Record<string, string>;
  dim: Record<Dim, ResultadoDim>;
  pctGeral: number;
  acertosGeral: number;
  auto: Record<string, number>;
  /** Média da autoavaliação, de 0 (tudo "não sei ainda") a 100 (tudo "sei e explico"); null se não respondeu. */
  autoPct: number | null;
  /** Acerto nas questões ligadas aos itens que ele mesmo avaliou. */
  realPct: number | null;
  perfilAuto: PerfilAuto | null;
}

export interface Base {
  /** Uma entrada por aluno (nome + turma): a tentativa finalizada mais recente. */
  alunos: AlunoAnalise[];
  iniciaram: number;
  concluiram: number;
  emAndamento: number;
  /** Nome + turma com mais de uma tentativa (sinalizado, nunca apagado). */
  repetidos: { nome: string; turma: string; n: number }[];
  /** iniciaram / concluíram por turma */
  porTurma: Record<string, { iniciaram: number; concluiram: number }>;
}

/** Contagens do filtro de turma ("todas" soma tudo). */
export function contagemTurma(base: Base, turma: string) {
  const ts = turma === "todas" ? Object.values(base.porTurma) : [base.porTurma[turma] ?? { iniciaram: 0, concluiram: 0 }];
  const iniciaram = ts.reduce((s, x) => s + x.iniciaram, 0);
  const concluiram = ts.reduce((s, x) => s + x.concluiram, 0);
  return { iniciaram, concluiram, emAndamento: iniciaram - concluiram };
}

const escalaPct = (media: number) => ((media - 1) / 3) * 100;

export function construirBase(d: DadosBrutos): Base {
  const respPor = new Map<string, LinhaResposta[]>();
  for (const r of d.respostas) (respPor.get(r.attempt_id) ?? respPor.set(r.attempt_id, []).get(r.attempt_id)!).push(r);
  const autoPor = new Map<string, LinhaAuto[]>();
  for (const a of d.autos) (autoPor.get(a.attempt_id) ?? autoPor.set(a.attempt_id, []).get(a.attempt_id)!).push(a);

  const grupos = new Map<string, LinhaTentativa[]>();
  for (const t of d.tentativas) {
    const k = chaveNome(t.student_name) + "|" + t.class_name;
    (grupos.get(k) ?? grupos.set(k, []).get(k)!).push(t);
  }

  const alunos: AlunoAnalise[] = [];
  const repetidos: Base["repetidos"] = [];
  const porTurma: Base["porTurma"] = Object.fromEntries(TURMAS.map(t => [t, { iniciaram: 0, concluiram: 0 }]));
  for (const ts of grupos.values()) {
    const cont = (porTurma[ts[0]!.class_name] ??= { iniciaram: 0, concluiram: 0 });
    cont.iniciaram++;
    if (ts.length > 1) repetidos.push({ nome: ts[0]!.student_name, turma: ts[0]!.class_name, n: ts.length });
    const finalizadas = ts.filter(t => t.status !== "em_andamento").sort((a, b) => b.started_at.localeCompare(a.started_at));
    const t = finalizadas[0];
    if (!t) continue;
    cont.concluiram++;

    const respostas: Record<string, string> = {};
    const acertou: Record<string, boolean | null> = {};
    for (const q of QUESTOES) acertou[q.id] = null;
    for (const r of respPor.get(t.id) ?? []) { respostas[r.question_id] = r.student_answer; acertou[r.question_id] = r.is_correct; }
    const dim = resultadoPorDimensao(acertou);
    const acertosGeral = QUESTOES.filter(q => acertou[q.id] === true).length;

    const auto: Record<string, number> = {};
    for (const a of autoPor.get(t.id) ?? []) auto[a.item] = a.score;
    const notas = Object.values(auto);
    const autoPct = notas.length ? escalaPct(notas.reduce((s, n) => s + n, 0) / notas.length) : null;
    let realPct: number | null = null;
    let perfilAuto: PerfilAuto | null = null;
    if (autoPct !== null) {
      const ids = new Set(ITENS_AUTO.filter(i => i.id in auto).flatMap(i => i.questoes));
      realPct = pct([...ids].filter(id => acertou[id] === true).length, ids.size);
      perfilAuto = autoPct - realPct >= LIMITE_AUTO ? "superestima" : realPct - autoPct >= LIMITE_AUTO ? "subestima" : "coerente";
    }

    alunos.push({
      id: t.id, nome: t.student_name, turma: t.class_name, status: t.status, inicio: t.started_at,
      duracao: t.duration_seconds, nTentativas: ts.length, acertou, respostas, dim,
      pctGeral: pct(acertosGeral, QUESTOES.length), acertosGeral, auto, autoPct, realPct, perfilAuto,
    });
  }
  alunos.sort((a, b) => a.turma.localeCompare(b.turma) || a.nome.localeCompare(b.nome, "pt-BR"));

  const iniciaram = grupos.size;
  const concluiram = alunos.length;
  return { alunos, iniciaram, concluiram, emAndamento: iniciaram - concluiram, repetidos, porTurma };
}

export function filtrarTurma(alunos: AlunoAnalise[], turma: string): AlunoAnalise[] {
  return turma === "todas" ? alunos : alunos.filter(a => a.turma === turma);
}

const media = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);

export function mediaGeral(alunos: AlunoAnalise[]): number | null {
  return media(alunos.map(a => a.pctGeral));
}

export function tempoMedioSegundos(alunos: AlunoAnalise[]): number | null {
  return media(alunos.filter(a => a.duracao !== null).map(a => a.duracao as number));
}

export function mediaPorDimensao(alunos: AlunoAnalise[]): Record<Dim, number | null> {
  const out = {} as Record<Dim, number | null>;
  for (const d of DIMS) out[d] = media(alunos.map(a => a.dim[d].pct));
  return out;
}

export function distribuicaoNiveis(alunos: AlunoAnalise[], d: Dim): Record<Nivel, number> {
  const out: Record<Nivel, number> = { consolidado: 0, funcional: 0, fragil: 0, recomposicao: 0 };
  for (const a of alunos) out[a.dim[d].nivel]++;
  return out;
}

export interface LinhaTurma { turma: string; n: number; dim: Record<Dim, number | null>; geral: number | null; tempo: number | null }
export function resumoPorTurma(alunos: AlunoAnalise[]): LinhaTurma[] {
  return TURMAS.map(turma => {
    const as = alunos.filter(a => a.turma === turma);
    return { turma, n: as.length, dim: mediaPorDimensao(as), geral: mediaGeral(as), tempo: tempoMedioSegundos(as) };
  });
}

export interface LinhaQuestao {
  id: string;
  dim: Dim;
  /** % de acerto, sobre os alunos que finalizaram (sem resposta conta como erro) */
  acerto: number | null;
  porTurma: Record<string, number | null>;
  semResposta: number;
  /** Resposta errada mais frequente, útil para separar erro de cálculo, de vocabulário ou de interpretação. */
  erroComum: { resposta: string; n: number } | null;
}
export function analisePorQuestao(alunos: AlunoAnalise[]): LinhaQuestao[] {
  return QUESTOES.map(q => {
    const taxa = (as: AlunoAnalise[]) => (as.length ? pct(as.filter(a => a.acertou[q.id] === true).length, as.length) : null);
    const porTurma: Record<string, number | null> = {};
    for (const t of TURMAS) porTurma[t] = taxa(alunos.filter(a => a.turma === t));
    const erros = new Map<string, number>();
    for (const a of alunos) if (a.acertou[q.id] === false) erros.set(a.respostas[q.id]!, (erros.get(a.respostas[q.id]!) ?? 0) + 1);
    const top = [...erros.entries()].sort((x, y) => y[1] - x[1])[0];
    return {
      id: q.id, dim: q.dim, acerto: taxa(alunos), porTurma,
      semResposta: alunos.filter(a => a.acertou[q.id] === null).length,
      erroComum: top ? { resposta: top[0], n: top[1] } : null,
    };
  });
}

export interface LinhaAutoItem { id: string; texto: string; autoPct: number | null; realPct: number | null; n: number }
/** Por afirmação: o que a turma acha que sabe × quanto acertou das questões ligadas a ela. */
export function autoVsRealPorItem(alunos: AlunoAnalise[]): LinhaAutoItem[] {
  return ITENS_AUTO.map(item => {
    const quem = alunos.filter(a => item.id in a.auto);
    const real = quem.map(a => pct(item.questoes.filter(q => a.acertou[q] === true).length, item.questoes.length));
    return {
      id: item.id, texto: item.texto, n: quem.length,
      autoPct: media(quem.map(a => escalaPct(a.auto[item.id]!))),
      realPct: media(real),
    };
  });
}

export function contagemPerfilAuto(alunos: AlunoAnalise[]): Record<PerfilAuto, number> {
  const out: Record<PerfilAuto, number> = { superestima: 0, subestima: 0, coerente: 0 };
  for (const a of alunos) if (a.perfilAuto) out[a.perfilAuto]++;
  return out;
}

/** Limites da leitura pedagógica (roteiro, seção 17). */
export const LIMITE_ALTO = 70;
export const LIMITE_MUITO_BAIXO = 40;

export interface Leitura { titulo: string; texto: string; tom: "ok" | "atencao" | "alerta" }

/** Orientação de uso dos resultados, a partir das médias D1–D4 do grupo. */
export function leituraPedagogica(m: Record<Dim, number | null>): Leitura | null {
  const { D1, D2, D3, D4 } = m;
  if (D1 === null || D2 === null || D3 === null || D4 === null) return null;
  if (D1 < LIMITE_MUITO_BAIXO || D2 < LIMITE_MUITO_BAIXO)
    return { tom: "alerta", titulo: "Priorizar ângulos, 360° e leitura geométrica", texto: "D1 ou D2 estão muito baixos: antes de avançar para arcos, retome vocabulário da circunferência, medida de ângulos e a volta de 360°." };
  if (Math.min(D1, D2, D3) >= LIMITE_ALTO)
    return { tom: "ok", titulo: "Pronto para iniciar arcos e ângulos", texto: D4 < LIMITE_ALTO ? "D1, D2 e D3 estão altos e D4 está baixo, o esperado: D4 antecipa o que ainda será formalizado e indica o ponto de partida." : "D1 a D4 estão altos: dá para começar com um ritmo um pouco mais rápido." };
  return { tom: "atencao", titulo: "Fazer uma recomposição breve", texto: "D1 a D3 estão medianos: reserve um momento de recomposição antes ou durante a primeira aula, focando na dimensão mais baixa." };
}

export const formatarPct = (v: number | null) => (v === null ? "—" : `${Math.round(v)}%`);

export function formatarDuracao(s: number | null): string {
  if (s === null) return "—";
  const m = Math.floor(s / 60);
  return m >= 60 ? "60 min" : m === 0 ? `${Math.round(s)} s` : `${m} min ${String(Math.round(s % 60)).padStart(2, "0")} s`;
}
