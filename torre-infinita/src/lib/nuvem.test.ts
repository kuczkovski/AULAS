import { beforeEach, describe, expect, it, vi } from "vitest";

/* Servidor de mentira: guarda as rodadas recebidas e permite simular falhas. */
const servidor = { linhas: new Map<string, unknown>(), inseridas: 0, falhaRede: false, estados: 0 };
vi.mock("./supabase", () => ({
  getSupabase: () => ({
    from: (tabela: string) => ({
      insert: async (r: { id: string }) => {
        if (tabela !== "rodadas") return { error: null };
        servidor.inseridas++;
        if (servidor.falhaRede) return { error: { code: "", message: "rede" } };
        if (servidor.linhas.has(r.id)) return { error: { code: "23505", message: "duplicada" } };
        servidor.linhas.set(r.id, r);
        return { error: null };
      },
      upsert: async () => { servidor.estados++; return { error: null }; },
    }),
  }),
}));

const memoria = new Map<string, string>();
vi.stubGlobal("localStorage", { getItem: (k: string) => memoria.get(k) ?? null, setItem: (k: string, v: string) => void memoria.set(k, v), removeItem: (k: string) => void memoria.delete(k) });

import { lerFila, type RodadaPendente } from "./armazenamento";
import { sincronizar } from "./nuvem";
import { novoEstado } from "@/engine/estado";

const rodada = (id: string, alunoId = "A"): RodadaPendente => ({ id, alunoId, tipo: "treino", andar: 1, acertos: 8, total: 10, pontos: 100, duracaoS: 60, falhou: false });
const estado = novoEstado(7);

beforeEach(() => { servidor.linhas.clear(); servidor.inseridas = 0; servidor.falhaRede = false; servidor.estados = 0; memoria.clear(); });

describe("fila de envio de rodadas", () => {
  it("envia e esvazia a fila", async () => {
    await sincronizar("A", estado, rodada("r1"));
    expect(servidor.linhas.size).toBe(1);
    expect(lerFila()).toEqual([]);
    expect(servidor.estados).toBe(1);
  });

  it("chamadas em paralelo não enviam a mesma rodada duas vezes", async () => {
    await Promise.all([sincronizar("A", estado, rodada("r1")), sincronizar("A", estado), sincronizar("A", estado)]);
    expect(servidor.inseridas).toBe(1);
    expect(servidor.linhas.size).toBe(1);
  });

  it("rodada que entra enquanto outra é enviada não se perde", async () => {
    const p1 = sincronizar("A", estado, rodada("r1"));
    const p2 = sincronizar("A", estado, rodada("r2"));
    await Promise.all([p1, p2]);
    expect([...servidor.linhas.keys()].sort()).toEqual(["r1", "r2"]);
    expect(lerFila()).toEqual([]);
  });

  it("falha de rede mantém a rodada na fila e o próximo envio a entrega", async () => {
    servidor.falhaRede = true;
    await sincronizar("A", estado, rodada("r1"));
    expect(lerFila().map((r) => r.id)).toEqual(["r1"]);
    servidor.falhaRede = false;
    await sincronizar("A", estado);
    expect(servidor.linhas.size).toBe(1);
    expect(lerFila()).toEqual([]);
  });

  it("rodada já gravada pelo servidor (resposta perdida) sai da fila sem duplicar", async () => {
    servidor.linhas.set("r1", {});
    await sincronizar("A", estado, rodada("r1"));
    expect(servidor.linhas.size).toBe(1);
    expect(lerFila()).toEqual([]);
  });

  it("rodadas de outro aluno ficam guardadas até ele entrar", async () => {
    await sincronizar("B", estado, rodada("rb", "B"));
    await sincronizar("A", estado, rodada("ra", "A"));
    expect([...servidor.linhas.keys()]).toEqual(["rb", "ra"]);
    memoria.set("torre-infinita-v2-fila", JSON.stringify([rodada("x", "C")]));
    await sincronizar("A", estado);
    expect(lerFila().map((r) => r.id)).toEqual(["x"]);
  });

  it("itens de versões antigas da fila (sem id) ganham um id", () => {
    const { id: _, ...velha } = rodada("qualquer");
    memoria.set("torre-infinita-v2-fila", JSON.stringify([velha]));
    const [r] = lerFila();
    expect(r!.id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
