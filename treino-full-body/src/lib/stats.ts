import type { DiscomfortLog, MuscleGroup, WorkoutSession } from "./types";
import { MUSCLE_GROUPS } from "./types";

const DAY = 86_400_000;

/** Início (segunda-feira, 00:00 local) da semana que contém `t`. */
export function startOfWeek(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  const diff = (d.getDay() + 6) % 7; // segunda = 0
  d.setDate(d.getDate() - diff);
  return d.getTime();
}

export function finishedSessions(sessions: WorkoutSession[]): WorkoutSession[] {
  return sessions
    .filter((s) => !s.deletedAt && s.status !== "in_progress")
    .filter((s) => s.exercises.some((e) => e.sets.some((x) => x.completedAt !== null)))
    .sort((a, b) => a.startedAt - b.startedAt);
}

export interface WeekBucket {
  weekStart: number;
  count: number;
}

export function weeklyFrequency(sessions: WorkoutSession[], weeks: number, now: number = Date.now()): WeekBucket[] {
  const current = startOfWeek(now);
  const buckets: WeekBucket[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(current);
    d.setDate(d.getDate() - i * 7);
    buckets.push({ weekStart: d.getTime(), count: 0 });
  }
  for (const s of finishedSessions(sessions)) {
    const w = startOfWeek(s.startedAt);
    const b = buckets.find((x) => x.weekStart === w);
    if (b) b.count++;
  }
  return buckets;
}

export interface GroupVolume {
  group: MuscleGroup;
  sets: number;
  tonnage: number;
}

/** Séries concluídas e tonelagem por grupo muscular principal no período. */
export function volumeByGroup(sessions: WorkoutSession[], sinceMs: number): GroupVolume[] {
  const map = new Map<MuscleGroup, GroupVolume>(MUSCLE_GROUPS.map((g) => [g, { group: g, sets: 0, tonnage: 0 }]));
  for (const s of finishedSessions(sessions)) {
    if (s.startedAt < sinceMs) continue;
    for (const e of s.exercises) {
      const v = map.get(e.muscleGroup);
      if (!v) continue;
      for (const set of e.sets) {
        if (set.completedAt === null) continue;
        v.sets++;
        if (set.load !== null && set.reps !== null && e.repUnit === "reps") v.tonnage += set.load * set.reps;
      }
    }
  }
  return [...map.values()].filter((v) => v.sets > 0).sort((a, b) => b.sets - a.sets);
}

export function averageDurationMs(sessions: WorkoutSession[]): number | null {
  const d = finishedSessions(sessions)
    .filter((s) => s.endedAt !== null)
    .map((s) => (s.endedAt as number) - s.startedAt)
    .filter((ms) => ms > 60_000 && ms < 6 * 3_600_000);
  if (d.length === 0) return null;
  return d.reduce((a, b) => a + b, 0) / d.length;
}

export function daysAgo(n: number, now: number = Date.now()): number {
  return now - n * DAY;
}

export function discomfortSummary(logs: DiscomfortLog[]): { total: number; last30: number; warningCount: number } {
  const since = daysAgo(30);
  const active = logs.filter((l) => !l.deletedAt);
  return {
    total: active.length,
    last30: active.filter((l) => l.createdAt >= since).length,
    warningCount: active.filter((l) => needsProfessionalNotice(l)).length,
  };
}

/** Dor persistente, irradiada ou em piora sempre gera o aviso de avaliação profissional. */
export function needsProfessionalNotice(l: Pick<DiscomfortLog, "characters" | "intensity">): boolean {
  return l.characters.some((c) => c === "persistente" || c === "irradiada" || c === "piora") || l.intensity >= 7;
}

export function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m.toString().padStart(2, "0")}min` : `${m} min`;
}

export function formatDate(t: number, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" }): string {
  return new Intl.DateTimeFormat("pt-BR", opts).format(new Date(t));
}

export function formatNumber(n: number, maxFrac = 2): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: maxFrac }).format(n);
}
