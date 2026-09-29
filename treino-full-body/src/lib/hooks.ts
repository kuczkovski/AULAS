"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useSyncExternalStore } from "react";
import { getDB } from "./db";
import { DEFAULT_PROFILE } from "./repo";
import { getSyncStatus, subscribeSync } from "./sync";
import type { DiscomfortLog, Exercise, Profile, WorkoutSession, WorkoutTemplate } from "./types";

// Consultas reativas ao IndexedDB: os componentes são atualizados
// automaticamente a cada gravação local ou recebida da sincronização.

export function useExercises(): Exercise[] | undefined {
  return useLiveQuery(async () => (await getDB().exercises.toArray()).filter((e) => !e.deletedAt).sort((a, b) => a.name.localeCompare(b.name, "pt-BR")), []);
}

export function useExerciseMap(): Map<string, Exercise> | undefined {
  // Inclui excluídos para que o histórico continue exibindo nomes.
  const all = useLiveQuery(() => getDB().exercises.toArray(), []);
  return useMemo(() => (all ? new Map(all.map((e) => [e.id, e])) : undefined), [all]);
}

export function useTemplates(): WorkoutTemplate[] | undefined {
  return useLiveQuery(async () => (await getDB().templates.toArray()).sort((a, b) => a.id.localeCompare(b.id)), []);
}

export function useSessions(): WorkoutSession[] | undefined {
  return useLiveQuery(async () => (await getDB().sessions.orderBy("startedAt").toArray()).filter((s) => !s.deletedAt), []);
}

export function useSession(id: string | null): WorkoutSession | null | undefined {
  return useLiveQuery(async () => (id ? ((await getDB().sessions.get(id)) ?? null) : null), [id]);
}

export function useActiveSession(): WorkoutSession | null | undefined {
  return useLiveQuery(async () => {
    const list = await getDB().sessions.where("status").equals("in_progress").toArray();
    return list.filter((s) => !s.deletedAt).sort((a, b) => b.startedAt - a.startedAt)[0] ?? null;
  }, []);
}

export function useDiscomforts(): DiscomfortLog[] | undefined {
  return useLiveQuery(async () => (await getDB().discomforts.orderBy("createdAt").reverse().toArray()).filter((d) => !d.deletedAt), []);
}

export function useProfile(): Profile {
  return useLiveQuery(async () => (await getDB().profile.get("profile")) ?? DEFAULT_PROFILE, []) ?? DEFAULT_PROFILE;
}

export function useSyncStatus() {
  return useSyncExternalStore(subscribeSync, getSyncStatus, getSyncStatus);
}
