import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { TrainingDB, setDB } from "./db";
import { ensureSeeded, saveDiscomfort, saveSession } from "./repo";
import { AccountMismatchError, claimLocalData, pull, push, type RemoteRow } from "./sync";
import { createSession } from "./session";
import { buildSeedExercises, buildSeedTemplates } from "@/data/catalog";
import type { DiscomfortLog } from "./types";

/** Supabase em memória com a mesma regra de "última gravação vence" do SQL. */
function fakeSupabase() {
  const tables = new Map<string, Map<string, RemoteRow>>();
  let clock = 0;
  const table = (name: string) => {
    if (!tables.has(name)) tables.set(name, new Map());
    return tables.get(name)!;
  };
  const client = {
    from(name: string) {
      const t = table(name);
      return {
        async upsert(rows: RemoteRow[]) {
          for (const r of rows) {
            const key = `${r.user_id}:${r.id}`;
            const old = t.get(key);
            if (old && r.updated_at < old.updated_at) continue;
            clock++;
            t.set(key, { ...r, server_updated_at: new Date(Date.UTC(2026, 0, 1) + clock * 60_000).toISOString() });
          }
          return { error: null };
        },
        select() {
          let cursor = "";
          const q = {
            gt(_c: string, v: string) {
              cursor = v;
              return q;
            },
            order() {
              return q;
            },
            async limit(n: number) {
              const rows = [...t.values()]
                .filter((r) => r.server_updated_at! > cursor)
                .sort((a, b) => a.server_updated_at!.localeCompare(b.server_updated_at!))
                .slice(0, n);
              return { data: rows, error: null };
            },
          };
          return q;
        },
      };
    },
  };
  return { client: client as unknown as SupabaseClient, tables };
}

let db: TrainingDB;
let n = 0;

beforeEach(async () => {
  db = new TrainingDB(`test-${n++}`);
  setDB(db);
  await ensureSeeded();
});

function discomfort(id: string, updatedAt: number): DiscomfortLog {
  return {
    id, updatedAt, deletedAt: null, sessionId: null, exerciseId: null, exerciseName: null,
    region: "Ombro", intensity: 3, characters: ["pontual"], action: "continuou", note: "", createdAt: updatedAt,
  };
}

describe("sincronização", () => {
  it("envia a fila e esvazia a outbox", async () => {
    const { client, tables } = fakeSupabase();
    const tpl = buildSeedTemplates()[0]!;
    const ex = new Map(buildSeedExercises().map((e) => [e.id, e]));
    await saveSession(createSession(tpl, ex));
    expect(await db.outbox.count()).toBe(1);
    await push(client, "user-1");
    expect(await db.outbox.count()).toBe(0);
    expect(tables.get("workout_sessions")!.size).toBe(1);
  });

  it("recebe dados de outro aparelho sem sobrescrever alterações locais mais novas", async () => {
    const { client } = fakeSupabase();
    const remoteNew = discomfort("d1", 2_000);
    const remoteOld = discomfort("d2", 1_000);
    await client.from("discomfort_logs").upsert([
      { user_id: "u", id: "d1", data: { ...remoteNew, region: "Joelho" }, updated_at: 2_000, deleted_at: null },
      { user_id: "u", id: "d2", data: remoteOld, updated_at: 1_000, deleted_at: null },
    ] as RemoteRow[]);
    await saveDiscomfort({ ...discomfort("d2", 1_000), region: "Local mais novo" });

    await pull(client);
    expect((await db.discomforts.get("d1"))!.region).toBe("Joelho");
    expect((await db.discomforts.get("d2"))!.region).toBe("Local mais novo");
  });

  it("não mistura dados de contas diferentes", async () => {
    await claimLocalData("a");
    await expect(claimLocalData("b")).rejects.toBeInstanceOf(AccountMismatchError);
  });
});
