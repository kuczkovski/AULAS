import { buildSeedExercises, buildSeedTemplates } from "@/data/catalog";
import { getDB, tableFor } from "./db";
import type {
  CollectionName,
  DiscomfortLog,
  Exercise,
  Profile,
  SyncMeta,
  WorkoutSession,
  WorkoutTemplate,
} from "./types";

type Listener = () => void;
const writeListeners = new Set<Listener>();

/** Notificado após cada gravação local (usado para agendar sincronização). */
export function onLocalWrite(fn: Listener): () => void {
  writeListeners.add(fn);
  return () => writeListeners.delete(fn);
}

export class StorageError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "StorageError";
  }
}

function describe(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === "QuotaExceededError") return "Espaço de armazenamento do navegador esgotado.";
    return err.message;
  }
  return String(err);
}

async function put<T extends SyncMeta>(collection: CollectionName, record: T, touch = true): Promise<T> {
  const db = getDB();
  const saved = touch ? { ...record, updatedAt: Math.max(Date.now(), record.updatedAt + 1) } : record;
  try {
    await db.transaction("rw", [tableFor(db, collection), db.outbox], async () => {
      await tableFor(db, collection).put(saved);
      await db.outbox.put({ key: `${collection}:${saved.id}`, collection, id: saved.id, updatedAt: saved.updatedAt });
    });
  } catch (err) {
    throw new StorageError(`Não foi possível salvar localmente: ${describe(err)}`, err);
  }
  writeListeners.forEach((fn) => fn());
  return saved;
}

export const saveSession = (s: WorkoutSession) => put("sessions", s);
export const saveExercise = (e: Exercise) => put("exercises", e);
export const saveTemplate = (t: WorkoutTemplate) => put("templates", t);
export const saveDiscomfort = (d: DiscomfortLog) => put("discomforts", d);
export const saveProfile = (p: Profile) => put("profile", p);

export async function softDelete(collection: CollectionName, id: string): Promise<void> {
  const db = getDB();
  const rec = await tableFor(db, collection).get(id);
  if (!rec) return;
  await put(collection, { ...rec, deletedAt: Date.now() });
}

export const DEFAULT_PROFILE: Profile = {
  id: "profile",
  displayName: "",
  loadUnit: "kg",
  loadStep: 2.5,
  soundOnRestEnd: true,
  vibrateOnRestEnd: true,
  acceptedNotice: false,
  updatedAt: 0,
  deletedAt: null,
};

/**
 * Popula o catálogo inicial (somente registros ausentes, para não
 * sobrescrever edições) e pede ao navegador armazenamento persistente.
 */
export async function ensureSeeded(): Promise<void> {
  const db = getDB();
  try {
    await db.transaction("rw", [db.exercises, db.templates, db.profile], async () => {
      const seedEx = buildSeedExercises();
      const existing = new Set(await db.exercises.toCollection().primaryKeys());
      const missing = seedEx.filter((e) => !existing.has(e.id));
      if (missing.length) await db.exercises.bulkAdd(missing);

      const tpl = buildSeedTemplates();
      const existingTpl = new Set(await db.templates.toCollection().primaryKeys());
      const missingTpl = tpl.filter((t) => !existingTpl.has(t.id));
      if (missingTpl.length) await db.templates.bulkAdd(missingTpl);

      if (!(await db.profile.get("profile"))) await db.profile.add(DEFAULT_PROFILE);
    });
  } catch (err) {
    throw new StorageError(`Falha ao abrir o banco local: ${describe(err)}`, err);
  }
  if (typeof navigator !== "undefined" && navigator.storage?.persist) {
    navigator.storage.persist().catch(() => undefined);
  }
}

export interface BackupFile {
  app: "treino-full-body";
  version: 1;
  exportedAt: string;
  exercises: Exercise[];
  templates: WorkoutTemplate[];
  sessions: WorkoutSession[];
  discomforts: DiscomfortLog[];
  profile: Profile[];
}

export async function exportBackup(): Promise<BackupFile> {
  const db = getDB();
  const [exercises, templates, sessions, discomforts, profile] = await Promise.all([
    db.exercises.toArray(),
    db.templates.toArray(),
    db.sessions.toArray(),
    db.discomforts.toArray(),
    db.profile.toArray(),
  ]);
  return { app: "treino-full-body", version: 1, exportedAt: new Date().toISOString(), exercises, templates, sessions, discomforts, profile };
}

/** Importa um backup mesclando por `updatedAt` (o registro mais recente prevalece). */
export async function importBackup(raw: unknown): Promise<number> {
  if (!raw || typeof raw !== "object" || (raw as BackupFile).app !== "treino-full-body") {
    throw new Error("Arquivo inválido: não é um backup deste aplicativo.");
  }
  const data = raw as BackupFile;
  const db = getDB();
  let count = 0;
  const collections: CollectionName[] = ["exercises", "templates", "sessions", "discomforts", "profile"];
  await db.transaction("rw", [db.exercises, db.templates, db.sessions, db.discomforts, db.profile, db.outbox], async () => {
    for (const c of collections) {
      const list = data[c];
      if (!Array.isArray(list)) continue;
      for (const rec of list as SyncMeta[]) {
        if (!rec || typeof rec.id !== "string" || typeof rec.updatedAt !== "number") continue;
        const local = await tableFor(db, c).get(rec.id);
        if (local && local.updatedAt >= rec.updatedAt) continue;
        await tableFor(db, c).put(rec);
        await db.outbox.put({ key: `${c}:${rec.id}`, collection: c, id: rec.id, updatedAt: rec.updatedAt });
        count++;
      }
    }
  });
  writeListeners.forEach((fn) => fn());
  return count;
}

export async function clearLocalData(): Promise<void> {
  const db = getDB();
  await db.transaction("rw", [db.exercises, db.templates, db.sessions, db.discomforts, db.profile, db.outbox, db.meta], async () => {
    await Promise.all([
      db.exercises.clear(),
      db.templates.clear(),
      db.sessions.clear(),
      db.discomforts.clear(),
      db.profile.clear(),
      db.outbox.clear(),
      db.meta.clear(),
    ]);
  });
  await ensureSeeded();
}
