import { describe, expect, it } from "vitest";
import { HABILIDADES, POR_ID } from "./habilidades";
import { criarRng } from "./rng";
import { gerarPergunta } from "./gerar";
import { verificar } from "./resposta";
import { canonico } from "./texto";
import type { Pergunta } from "./tipos";

const SEMENTES = 120;

function todas(h: (typeof HABILIDADES)[number], digitar: boolean) {
  const out: Pergunta[] = [];
  for (const cat of h.categorias) {
    for (let s = 1; s <= SEMENTES; s++) out.push(gerarPergunta(h, cat, criarRng(s * 7919 + cat.length), digitar));
  }
  return out;
}

/** Avalia expressões aritméticas simples escritas em português matemático. */
function avaliar(expr: string): number {
  const js = expr.replace(/×/g, "*").replace(/÷/g, "/").replace(/[−–]/g, "-").replace(/,/g, ".");
  if (!/^[\d\s+\-*/().]+$/.test(js)) throw new Error("expressão não avaliável: " + expr);
  return Function(`"use strict"; return (${js})`)() as number;
}
const paraNumero = (s: string) => Number(s.replace(",", "."));

describe("registro de habilidades", () => {
  it("vem em ordem topológica e só referencia habilidades existentes", () => {
    const vistas = new Set<string>();
    for (const h of HABILIDADES) {
      for (const r of h.requisitos) {
        expect(POR_ID.has(r), `${h.id} → ${r}`).toBe(true);
        expect(vistas.has(r), `${r} deve vir antes de ${h.id}`).toBe(true);
        expect(POR_ID.get(r)!.ano, `${h.id} não pode depender de ano maior`).toBeLessThanOrEqual(h.ano);
      }
      vistas.add(h.id);
    }
    expect(vistas.size).toBe(HABILIDADES.length);
  });

  it("tem categorias únicas e cobre os quatro anos", () => {
    for (const h of HABILIDADES) {
      expect(h.categorias.length).toBeGreaterThan(0);
      expect(new Set(h.categorias).size).toBe(h.categorias.length);
    }
    expect(new Set(HABILIDADES.map((h) => h.ano))).toEqual(new Set([6, 7, 8, 9]));
  });
});

describe.each(HABILIDADES.map((h) => [h.id, h] as const))("%s", (_id, h) => {
  for (const digitar of [false, true]) {
    it(`gera perguntas consistentes (digitar=${digitar})`, () => {
      for (const p of todas(h, digitar)) {
        const ctx = `${p.cat}: ${p.enunciado} ${p.expr}`;
        for (const t of [p.enunciado, p.expr, p.resposta, p.dica, p.explicacao, ...(p.opcoes ?? [])]) {
          expect(t, ctx).not.toMatch(/NaN|undefined|Infinity|null/);
        }
        expect(p.resposta, ctx).not.toBe("");
        expect(p.enunciado, ctx).not.toBe("");
        expect(p.dica.length, ctx).toBeGreaterThan(5);
        expect(p.explicacao.length, ctx).toBeGreaterThan(5);
        expect(p.esperadoMs).toBeGreaterThan(0);
        expect(verificar(p, p.resposta), ctx).toBe(true);
        for (const a of p.aceitar ?? []) expect(verificar(p, a), ctx).toBe(true);

        if (p.formato === "digitar") {
          expect(p.opcoes, ctx).toBeUndefined();
        } else {
          const o = p.opcoes!;
          expect(o, ctx).toContain(p.resposta);
          expect(new Set(o).size, `opções repetidas — ${ctx}: ${o}`).toBe(o.length);
          expect(o.length, ctx).toBeGreaterThanOrEqual(2);
          expect(o.length, ctx).toBeLessThanOrEqual(4);
          if (p.formato === "escolha" && h.id !== "fracao-comparar") expect(o.length, ctx).toBe(4);
          for (const a of p.aceitar ?? []) if (a !== p.resposta) expect(o, `outra resposta correta entre as opções — ${ctx}`).not.toContain(a);
        }
      }
    });
  }
});

describe("respostas conferidas por cálculo independente", () => {
  const gerar = (id: string, cat?: string) =>
    todas(POR_ID.get(id)!, true).filter((p) => !cat || p.cat === cat);

  it("soma-sub, tabuada e divisão", () => {
    for (const id of ["soma-sub", "tabuada"]) for (const p of gerar(id)) expect(avaliar(p.expr), p.expr).toBe(paraNumero(p.resposta));
    for (const p of gerar("divisao").filter((x) => x.cat !== "resto")) expect(avaliar(p.expr), p.expr).toBe(paraNumero(p.resposta));
    for (const p of gerar("divisao", "resto")) {
      const [n, d] = p.expr.split("÷").map(Number) as [number, number];
      expect(n % d, p.expr).toBe(paraNumero(p.resposta));
    }
  });

  it("ordem das operações", () => {
    for (const p of gerar("ordem-ops")) expect(avaliar(p.expr), p.expr).toBe(paraNumero(p.resposta));
  });

  it("decimais e inteiros", () => {
    for (const p of [...gerar("decimais"), ...gerar("inteiros-soma"), ...gerar("inteiros-mult", "mult")]) {
      expect(avaliar(p.expr), p.expr).toBeCloseTo(paraNumero(p.resposta), 6);
    }
    for (const p of gerar("inteiros-mult", "div")) expect(avaliar(p.expr), p.expr).toBeCloseTo(paraNumero(p.resposta), 6);
  });

  it("equação do 1º grau: a resposta satisfaz a equação", () => {
    for (const p of gerar("equacao-1grau")) {
      const x = paraNumero(p.resposta);
      const [esq, dir] = p.expr.replace(/\s/g, "").replace(/−/g, "-").split("=") as [string, string];
      const substituida = esq.replace(/(\d)x/g, `$1*(${x})`).replace(/x/g, `(${x})`);
      expect(avaliar(substituida), p.expr).toBe(Number(dir));
    }
  });

  it("equação do 2º grau: as raízes satisfazem a equação", () => {
    for (const p of gerar("equacao-2grau", "raizes")) {
      const [esq] = p.expr.replace(/\s/g, "").replace(/−/g, "-").split("=") as [string];
      for (const r of [p.resposta, ...(p.aceitar ?? [])]) {
        const x = paraNumero(r);
        const s = esq.replace(/x²/g, `((${x})**2)`).replace(/(\d)x/g, `$1*(${x})`).replace(/x/g, `(${x})`).replace(/\*\*/g, "**");
        expect(Function(`return (${s})`)(), `${p.expr} com x=${r}`).toBe(0);
      }
    }
  });

  it("MMC e MDC", () => {
    const mdc = (a: number, b: number): number => (b ? mdc(b, a % b) : a);
    for (const p of gerar("mmc-mdc")) {
      const [a, b] = p.expr.split(" e ").map(Number) as [number, number];
      expect(paraNumero(p.resposta), p.expr).toBe(p.cat === "mdc" ? mdc(a, b) : (a * b) / mdc(a, b));
    }
  });

  it("frações: equivalência e simplificação", () => {
    for (const p of gerar("fracao-simplificar")) {
      const [N, D] = p.expr.split("/").map(Number) as [number, number];
      const [n, d] = canonico(p.resposta).split("/").map(Number) as [number, number];
      expect(N * d, p.expr).toBe(n * D);
      const mdc = (a: number, b: number): number => (b ? mdc(b, a % b) : a);
      expect(mdc(n, d)).toBe(1);
    }
  });

  it("Pitágoras", () => {
    for (const p of gerar("pitagoras", "hipotenusa")) {
      const [a, b] = [...p.enunciado.matchAll(/\d+/g)].map((m) => Number(m[0]));
      expect(a! ** 2 + b! ** 2).toBe(paraNumero(p.resposta) ** 2);
    }
  });
});

describe("verificação de respostas digitadas", () => {
  const p = { formato: "digitar", resposta: "-3", aceitar: ["3/4"] } as Pergunta;
  it("aceita variações de escrita", () => {
    expect(verificar(p, " −3 ")).toBe(true);
    expect(verificar(p, "-3,0")).toBe(true);
    expect(verificar(p, "3/4")).toBe(true);
    expect(verificar(p, "3")).toBe(false);
    expect(verificar(p, "")).toBe(false);
  });
  it("fração não simplificada não vale como irredutível", () => {
    const q = { formato: "digitar", resposta: "2/3" } as Pergunta;
    expect(verificar(q, "2/3")).toBe(true);
    expect(verificar(q, "4/6")).toBe(false);
  });
});
