import type {
  Exercise,
  SessionExercise,
  SetLog,
  WorkoutSession,
  WorkoutTemplate,
} from "./types";
import { newId } from "./id";

function emptySets(n: number): SetLog[] {
  return Array.from({ length: n }, (_, index) => ({ index, load: null, reps: null, rir: null, completedAt: null }));
}

/** Cria uma sessão a partir do modelo do dia. Cargas começam vazias. */
export function createSession(
  template: WorkoutTemplate,
  exercises: Map<string, Exercise>,
  now: number = Date.now(),
): WorkoutSession {
  const list: SessionExercise[] = template.items.map((item) => {
    const ex = exercises.get(item.exerciseId);
    if (!ex) throw new Error(`Exercício não encontrado no catálogo: ${item.exerciseId}`);
    return {
      slotId: item.slotId,
      plannedExerciseId: item.exerciseId,
      exerciseId: ex.id,
      exerciseName: ex.name,
      muscleGroup: ex.muscleGroup,
      repUnit: ex.repUnit,
      substitution: null,
      sets: emptySets(item.sets),
      repMin: item.repMin,
      repMax: item.repMax,
      restSeconds: item.restSeconds,
      targetRir: item.targetRir,
      notes: "",
      skipped: false,
      loadDecision: null,
    };
  });
  return {
    id: newId(),
    templateId: template.id,
    templateName: template.name,
    startedAt: now,
    endedAt: null,
    status: "in_progress",
    interruptionReason: null,
    currentIndex: 0,
    exercises: list,
    notes: "",
    updatedAt: now,
    deletedAt: null,
  };
}

function mapExercise(
  session: WorkoutSession,
  index: number,
  fn: (e: SessionExercise) => SessionExercise,
): WorkoutSession {
  const target = session.exercises[index];
  if (!target) throw new Error("Exercício inválido na sessão");
  const exercises = session.exercises.slice();
  exercises[index] = fn(target);
  return { ...session, exercises, updatedAt: Date.now() };
}

export function completeSet(
  session: WorkoutSession,
  exIndex: number,
  setIndex: number,
  data: { load: number | null; reps: number; rir: number | null },
  now: number = Date.now(),
): WorkoutSession {
  return mapExercise(session, exIndex, (e) => {
    if (!e.sets[setIndex]) throw new Error("Série inválida");
    const sets = e.sets.map((s) => (s.index === setIndex ? { ...s, ...data, completedAt: now } : s));
    return { ...e, sets, skipped: false };
  });
}

export function reopenSet(session: WorkoutSession, exIndex: number, setIndex: number): WorkoutSession {
  return mapExercise(session, exIndex, (e) => ({
    ...e,
    sets: e.sets.map((s) => (s.index === setIndex ? { ...s, completedAt: null } : s)),
  }));
}

export function addSet(session: WorkoutSession, exIndex: number): WorkoutSession {
  return mapExercise(session, exIndex, (e) => {
    if (e.sets.length >= 10) return e;
    return { ...e, sets: [...e.sets, { index: e.sets.length, load: null, reps: null, rir: null, completedAt: null }] };
  });
}

export function removeLastSet(session: WorkoutSession, exIndex: number): WorkoutSession {
  return mapExercise(session, exIndex, (e) => {
    const last = e.sets[e.sets.length - 1];
    if (e.sets.length <= 1 || !last || last.completedAt !== null) return e;
    return { ...e, sets: e.sets.slice(0, -1) };
  });
}

/**
 * Substitui o exercício da posição por uma alternativa cadastrada.
 * Séries já concluídas impedem a troca, para não misturar registros de
 * exercícios diferentes no mesmo histórico.
 */
export function substituteExercise(
  session: WorkoutSession,
  exIndex: number,
  alt: Exercise,
  reason: string | null,
  now: number = Date.now(),
): WorkoutSession {
  return mapExercise(session, exIndex, (e) => {
    if (e.sets.some((s) => s.completedAt !== null)) {
      throw new Error("Há séries concluídas neste exercício. Reabra-as antes de substituir.");
    }
    const backToPlanned = alt.id === e.plannedExerciseId;
    return {
      ...e,
      exerciseId: alt.id,
      exerciseName: alt.name,
      muscleGroup: alt.muscleGroup,
      repUnit: alt.repUnit,
      substitution: backToPlanned ? null : { fromExerciseId: e.plannedExerciseId, reason, at: now },
      sets: emptySets(e.sets.length),
      loadDecision: null,
    };
  });
}

export function setExerciseField<K extends "notes" | "skipped" | "loadDecision">(
  session: WorkoutSession,
  exIndex: number,
  key: K,
  value: SessionExercise[K],
): WorkoutSession {
  return mapExercise(session, exIndex, (e) => ({ ...e, [key]: value }));
}

export function goTo(session: WorkoutSession, index: number): WorkoutSession {
  const clamped = Math.max(0, Math.min(session.exercises.length - 1, index));
  return { ...session, currentIndex: clamped, updatedAt: Date.now() };
}

export function finishSession(
  session: WorkoutSession,
  status: "completed" | "interrupted",
  reason: string | null = null,
  now: number = Date.now(),
): WorkoutSession {
  return { ...session, status, interruptionReason: reason, endedAt: now, updatedAt: now };
}

export function sessionProgress(session: WorkoutSession): { done: number; total: number; ratio: number } {
  let done = 0;
  let total = 0;
  for (const e of session.exercises) {
    if (e.skipped) continue;
    total += e.sets.length;
    done += e.sets.filter((s) => s.completedAt !== null).length;
  }
  return { done, total, ratio: total === 0 ? 0 : done / total };
}

export function isExerciseDone(e: SessionExercise): boolean {
  return e.skipped || e.sets.every((s) => s.completedAt !== null);
}

export function sessionDurationMs(s: WorkoutSession): number | null {
  if (!s.endedAt) return null;
  return Math.max(0, s.endedAt - s.startedAt);
}

/** Estimativa da duração: ~40 s por série somados ao descanso planejado. */
export function estimateMinutes(t: WorkoutTemplate): number {
  const sec = t.items.reduce((acc, i) => acc + i.sets * (40 + i.restSeconds), 0);
  return Math.round(sec / 60);
}
