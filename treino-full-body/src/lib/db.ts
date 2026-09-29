import Dexie, { type Table } from "dexie";
import type { CollectionName, DiscomfortLog, Exercise, Profile, WorkoutSession, WorkoutTemplate } from "./types";

export interface OutboxEntry {
  /** `${collection}:${id}` */
  key: string;
  collection: CollectionName;
  id: string;
  updatedAt: number;
}

export interface MetaEntry {
  key: string;
  value: unknown;
}

/**
 * Banco local (IndexedDB). É a fonte de verdade do aplicativo: toda
 * alteração é gravada aqui primeiro e depois enviada ao Supabase pela
 * fila `outbox`, o que garante funcionamento offline e preserva os
 * registros ao atualizar ou fechar a página.
 */
export class TrainingDB extends Dexie {
  exercises!: Table<Exercise, string>;
  templates!: Table<WorkoutTemplate, string>;
  sessions!: Table<WorkoutSession, string>;
  discomforts!: Table<DiscomfortLog, string>;
  profile!: Table<Profile, string>;
  outbox!: Table<OutboxEntry, string>;
  meta!: Table<MetaEntry, string>;

  constructor(name = "treino-full-body") {
    super(name);
    this.version(1).stores({
      exercises: "id, muscleGroup, name, updatedAt",
      templates: "id, weekday, updatedAt",
      sessions: "id, templateId, status, startedAt, updatedAt",
      discomforts: "id, sessionId, exerciseId, createdAt, updatedAt",
      profile: "id",
      outbox: "key, collection",
      meta: "key",
    });
  }
}

let instance: TrainingDB | null = null;

export function getDB(): TrainingDB {
  if (!instance) instance = new TrainingDB();
  return instance;
}

/** Usado em testes para trocar o banco. */
export function setDB(db: TrainingDB): void {
  instance = db;
}

export function tableFor(db: TrainingDB, c: CollectionName): Table<{ id: string; updatedAt: number; deletedAt: number | null }, string> {
  return db[c] as unknown as Table<{ id: string; updatedAt: number; deletedAt: number | null }, string>;
}
