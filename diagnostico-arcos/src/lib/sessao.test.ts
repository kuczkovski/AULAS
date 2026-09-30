import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErroNegocio, ErroRede, type Backend } from "./tipos";

const armazem = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (k: string) => armazem.get(k) ?? null,
  setItem: (k: string, v: string) => void armazem.set(k, v),
  removeItem: (k: string) => void armazem.delete(k),
});

let backend: Partial<Backend>;
vi.mock("./backend", () => ({ getBackend: async () => backend }));

const { gravarDados, lerDados, mesclar, registrarAuto, registrarResposta, sincronizar } = await import("./sessao");

const ID = "t1";
const dadosVazios = () => gravarDados(ID, { respostas: {}, auto: {}, pendResp: [], pendAuto: false, nome: "Ana Souza", turma: "1º A", prazo: "2026-01-01T00:00:00Z", deslocamento: 0 });

describe("persistência e sincronização", () => {
  beforeEach(() => { armazem.clear(); dadosVazios(); });

  it("guarda a resposta e reenvia quando a conexão volta", async () => {
    const enviadas: string[] = [];
    backend = { salvarResposta: async () => { throw new ErroRede("off"); } };
    const r1 = await registrarResposta(ID, "Q1", "Raio");
    expect(r1).toMatchObject({ ok: false, falhaRede: true });
    expect(lerDados(ID)).toMatchObject({ respostas: { Q1: "Raio" }, pendResp: ["Q1"] });

    backend = { salvarResposta: async (_i, q, r) => { enviadas.push(`${q}=${r}`); return { ok: true }; } };
    await registrarResposta(ID, "Q2", "12 cm");
    expect(enviadas).toEqual(["Q1=Raio", "Q2=12 cm"]); // em ordem
    expect(lerDados(ID)!.pendResp).toEqual([]);
  });

  it("uma resposta trocada durante o envio continua pendente", async () => {
    const enviadas: string[] = [];
    backend = {
      salvarResposta: async (_i, q, r) => {
        enviadas.push(r);
        if (r === "Raio") { // o aluno troca a resposta enquanto a primeira ainda está a caminho
          const d = lerDados(ID)!;
          d.respostas.Q1 = "Corda";
          gravarDados(ID, d);
        }
        return { ok: true };
      },
    };
    const r = await registrarResposta(ID, "Q1", "Raio");
    expect(r.ok).toBe(false);
    expect(lerDados(ID)).toMatchObject({ respostas: { Q1: "Corda" }, pendResp: ["Q1"] });
    expect((await sincronizar(ID)).ok).toBe(true);
    expect(enviadas).toEqual(["Raio", "Corda"]);
  });

  it("resposta recusada pelo banco não trava a fila", async () => {
    backend = { salvarResposta: async (_i, q) => { if (q === "Q6") throw new ErroNegocio("resposta-invalida"); return { ok: true }; } };
    await registrarResposta(ID, "Q6", "x");
    const r = await registrarResposta(ID, "Q7", "90");
    expect(r.ok).toBe(true);
    expect(lerDados(ID)!.pendResp).toEqual([]);
  });

  it("avisa quando o servidor já encerrou a tentativa", async () => {
    backend = { salvarResposta: async () => ({ ok: false, status: "encerrada_por_tempo" as const }) };
    const r = await registrarResposta(ID, "Q1", "Raio");
    expect(r).toMatchObject({ ok: false, encerrada: "encerrada_por_tempo" });
  });

  it("autoavaliação pendente é reenviada", async () => {
    backend = { salvarAutoavaliacao: async () => { throw new ErroRede("off"); } };
    await registrarAuto(ID, "A1", 3);
    expect(lerDados(ID)).toMatchObject({ auto: { A1: 3 }, pendAuto: true });
    const vistos: unknown[] = [];
    backend = { salvarAutoavaliacao: async (_i, itens) => { vistos.push(itens); return { ok: true }; } };
    expect((await sincronizar(ID)).ok).toBe(true);
    expect(vistos).toEqual([{ A1: 3 }]);
    expect(lerDados(ID)!.pendAuto).toBe(false);
  });

  it("ao recarregar, o pendente vale mais que o servidor", () => {
    const antes = { ...lerDados(ID)!, respostas: { Q1: "Corda" }, pendResp: ["Q1"] };
    const m = mesclar({
      id: ID, nome: "Ana Souza", turma: "1º A", status: "em_andamento", inicio: "", prazo: "p", agora: new Date(Date.now() + 5000).toISOString(),
      respostas: { Q1: "Raio", Q2: "12 cm" }, autoavaliacao: {}, resumo: null,
    }, antes);
    expect(m.respostas).toEqual({ Q1: "Corda", Q2: "12 cm" });
    expect(m.pendResp).toEqual(["Q1"]);
    expect(Math.abs(m.deslocamento - 5000)).toBeLessThan(200);
  });
});
