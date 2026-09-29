import type { SupabaseClient } from "@supabase/supabase-js";
import { getDB, tableFor, type TrainingDB } from "./db";
import type { CollectionName, SyncMeta } from "./types";

// Sincronização "offline-first":
//  1. push: envia os registros da fila `outbox` (upsert por usuário + id);
//  2. pull: busca registros alterados no servidor desde o último cursor.
// Conflitos são resolvidos por "última gravação vence" usando `updated_at`
// (o servidor também protege contra sobrescrita por dados mais antigos —
// ver supabase/migrations).

export const TABLES: Record<CollectionName, string> = {
  exercises: "exercises",
  templates: "workout_templates",
  sessions: "workout_sessions",
  discomforts: "discomfort_logs",
  profile: "profiles",
};

const COLLECTIONS = Object.keys(TABLES) as CollectionName[];
const BATCH = 200;

export interface RemoteRow {
  user_id: string;
  id: string;
  data: Record<string, unknown>;
  updated_at: number;
  deleted_at: number | null;
  server_updated_at?: string;
}

export type SyncState = "disabled" | "signed_out" | "idle" | "syncing" | "offline" | "error" | "conflict";

export interface SyncStatus {
  state: SyncState;
  pending: number;
  lastSyncAt: number | null;
  error: string | null;
}

let status: SyncStatus = { state: "disabled", pending: 0, lastSyncAt: null, error: null };
const listeners = new Set<() => void>();

export function getSyncStatus(): SyncStatus {
  return status;
}

export function subscribeSync(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setSyncStatus(patch: Partial<SyncStatus>): void {
  status = { ...status, ...patch };
  listeners.forEach((fn) => fn());
}

export async function refreshPending(db: TrainingDB = getDB()): Promise<void> {
  setSyncStatus({ pending: await db.outbox.count() });
}

export function toRow(userId: string, rec: SyncMeta): RemoteRow {
  return { user_id: userId, id: rec.id, data: rec as unknown as Record<string, unknown>, updated_at: rec.updatedAt, deleted_at: rec.deletedAt };
}

export function fromRow(row: RemoteRow): SyncMeta {
  return { ...(row.data as unknown as SyncMeta), id: row.id, updatedAt: Number(row.updated_at), deletedAt: row.deleted_at === null ? null : Number(row.deleted_at) };
}

async function getMeta<T>(db: TrainingDB, key: string): Promise<T | undefined> {
  return (await db.meta.get(key))?.value as T | undefined;
}

async function setMeta(db: TrainingDB, key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value });
}

export class AccountMismatchError extends Error {
  constructor() {
    super("Os dados deste aparelho pertencem a outra conta. Exporte-os ou apague-os no Perfil antes de sincronizar.");
    this.name = "AccountMismatchError";
  }
}

/** Vincula os dados locais à conta autenticada. */
export async function claimLocalData(userId: string, db: TrainingDB = getDB()): Promise<void> {
  const owner = await getMeta<string>(db, "ownerUserId");
  if (owner && owner !== userId) throw new AccountMismatchError();
  if (!owner) await setMeta(db, "ownerUserId", userId);
}

export async function push(client: SupabaseClient, userId: string, db: TrainingDB = getDB()): Promise<number> {
  const entries = await db.outbox.toArray();
  let sent = 0;
  for (const collection of COLLECTIONS) {
    const pending = entries.filter((e) => e.collection === collection);
    for (let i = 0; i < pending.length; i += BATCH) {
      const chunk = pending.slice(i, i + BATCH);
      const records = (await tableFor(db, collection).bulkGet(chunk.map((c) => c.id))).filter(Boolean) as SyncMeta[];
      if (records.length) {
        const { error } = await client.from(TABLES[collection]).upsert(records.map((r) => toRow(userId, r)), { onConflict: "user_id,id" });
        if (error) throw new Error(`Falha ao enviar ${collection}: ${error.message}`);
      }
      // Remove da fila apenas o que não foi alterado durante o envio.
      await db.transaction("rw", db.outbox, async () => {
        for (const c of chunk) {
          const current = await db.outbox.get(c.key);
          if (current && current.updatedAt === c.updatedAt) await db.outbox.delete(c.key);
        }
      });
      sent += records.length;
    }
  }
  return sent;
}

/** Aplica um registro remoto se ele for mais recente que o local. */
export async function applyRemote(db: TrainingDB, collection: CollectionName, remote: SyncMeta): Promise<boolean> {
  const table = tableFor(db, collection);
  return db.transaction("rw", [table, db.outbox], async () => {
    const local = await table.get(remote.id);
    if (local && local.updatedAt >= remote.updatedAt) return false;
    await table.put(remote);
    const queued = await db.outbox.get(`${collection}:${remote.id}`);
    if (queued && queued.updatedAt <= remote.updatedAt) await db.outbox.delete(queued.key);
    return true;
  });
}

export async function pull(client: SupabaseClient, db: TrainingDB = getDB()): Promise<number> {
  let applied = 0;
  for (const collection of COLLECTIONS) {
    const cursorKey = `pull:${collection}`;
    const stored = await getMeta<string>(db, cursorKey);
    // Pequena sobreposição cobre transações concluídas fora de ordem no
    // servidor; reaplicar um registro é inofensivo (comparação por updatedAt).
    let cursor = stored ? new Date(new Date(stored).getTime() - 10_000).toISOString() : "1970-01-01T00:00:00Z";
    for (;;) {
      const { data, error } = await client
        .from(TABLES[collection])
        .select("id, user_id, data, updated_at, deleted_at, server_updated_at")
        .gt("server_updated_at", cursor)
        .order("server_updated_at", { ascending: true })
        .limit(500);
      if (error) throw new Error(`Falha ao receber ${collection}: ${error.message}`);
      const rows = (data ?? []) as RemoteRow[];
      for (const row of rows) {
        if (await applyRemote(db, collection, fromRow(row))) applied++;
      }
      const last = rows[rows.length - 1];
      if (last?.server_updated_at) {
        cursor = last.server_updated_at;
        await setMeta(db, cursorKey, cursor);
      }
      if (rows.length < 500) break;
    }
  }
  return applied;
}

let running: Promise<void> | null = null;

export async function syncNow(client: SupabaseClient | null, userId: string | null): Promise<void> {
  if (!client) return setSyncStatus({ state: "disabled" });
  if (!userId) {
    await refreshPending();
    return setSyncStatus({ state: "signed_out" });
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    await refreshPending();
    return setSyncStatus({ state: "offline" });
  }
  if (running) return running;
  running = (async () => {
    setSyncStatus({ state: "syncing", error: null });
    try {
      await claimLocalData(userId);
      await push(client, userId);
      await pull(client);
      setSyncStatus({ state: "idle", lastSyncAt: Date.now(), error: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSyncStatus({ state: err instanceof AccountMismatchError ? "conflict" : "error", error: msg });
    } finally {
      await refreshPending().catch(() => undefined);
      running = null;
    }
  })();
  return running;
}
