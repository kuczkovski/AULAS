import type { LoadDecision, SessionExercise, WorkoutSession } from "./types";

// Progressão dupla: a carga só é reavaliada quando TODAS as séries
// planejadas atingem o limite superior da faixa de repetições. O sistema
// nunca aumenta a carga sozinho; ele apenas sinaliza a possibilidade.

export type ProgressionStatus = "top_of_range" | "in_range" | "below_range" | "incomplete";

export interface ProgressionResult {
  status: ProgressionStatus;
  title: string;
  message: string;
}

export function evaluateDoubleProgression(e: SessionExercise): ProgressionResult {
  const done = e.sets.filter((s) => s.completedAt !== null && s.reps !== null);
  const unit = e.repUnit === "seconds" ? "s" : " reps";
  if (e.skipped || done.length < e.sets.length || done.length === 0) {
    return {
      status: "incomplete",
      title: "Registro incompleto",
      message: "Nem todas as séries planejadas foram concluídas. A progressão é avaliada apenas com todas as séries registradas.",
    };
  }
  const reps = done.map((s) => s.reps as number);
  if (reps.every((r) => r >= e.repMax)) {
    return {
      status: "top_of_range",
      title: "Limite superior atingido",
      message: `Todas as séries chegaram a ${e.repMax}${unit}. Você pode avaliar uma progressão gradual na próxima sessão, desde que mantenha a técnica e a recuperação. Manter a carga também é uma opção válida.`,
    };
  }
  if (reps.every((r) => r >= e.repMin)) {
    return {
      status: "in_range",
      title: "Dentro da faixa",
      message: `Mantenha a carga e busque mais repetições até ${e.repMax}${unit} em todas as séries.`,
    };
  }
  return {
    status: "below_range",
    title: "Abaixo da faixa",
    message: `Alguma série ficou abaixo de ${e.repMin}${unit}. Considere manter ou reduzir a carga e observar a recuperação.`,
  };
}

export interface PerformanceEntry {
  sessionId: string;
  date: number;
  entry: SessionExercise;
  topLoad: number | null;
  totalReps: number;
  volume: number;
  evaluation: ProgressionResult;
}

export function summarizeEntry(sessionId: string, date: number, entry: SessionExercise): PerformanceEntry {
  const done = entry.sets.filter((s) => s.completedAt !== null && s.reps !== null);
  let topLoad: number | null = null;
  let totalReps = 0;
  let volume = 0;
  for (const s of done) {
    totalReps += s.reps as number;
    if (s.load !== null) {
      topLoad = topLoad === null ? s.load : Math.max(topLoad, s.load);
      if (entry.repUnit === "reps") volume += s.load * (s.reps as number);
    }
  }
  return { sessionId, date, entry, topLoad, totalReps, volume, evaluation: evaluateDoubleProgression(entry) };
}

/** Histórico de desempenho de um exercício (mais antigo primeiro). */
export function exerciseHistory(exerciseId: string, sessions: WorkoutSession[], excludeSessionId?: string): PerformanceEntry[] {
  const out: PerformanceEntry[] = [];
  for (const s of sessions) {
    if (s.deletedAt || s.id === excludeSessionId) continue;
    for (const e of s.exercises) {
      if (e.exerciseId !== exerciseId) continue;
      if (!e.sets.some((x) => x.completedAt !== null)) continue;
      out.push(summarizeEntry(s.id, s.startedAt, e));
    }
  }
  return out.sort((a, b) => a.date - b.date);
}

export function lastPerformance(exerciseId: string, sessions: WorkoutSession[], excludeSessionId?: string): PerformanceEntry | null {
  const h = exerciseHistory(exerciseId, sessions, excludeSessionId);
  return h[h.length - 1] ?? null;
}

export const LOAD_DECISION_LABELS: Record<LoadDecision, string> = {
  manter: "Manter a carga",
  avaliar_aumento: "Avaliar progressão gradual",
  reduzir: "Reduzir a carga",
};
