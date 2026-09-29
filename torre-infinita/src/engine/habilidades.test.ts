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
        } else if (p.formato === "reta") {
          expect(p.opcoes, ctx).toBeUndefined();
          expect(p.reta, ctx).toBeDefined();
          const { min, max, tolerancia } = p.reta!;
          const alvo = Number(canonico(p.resposta));
          expect(alvo, ctx).toBeGreaterThanOrEqual(min);
          expect(alvo, ctx).toBeLessThanOrEqual(max);
          expect(verificar(p, String(alvo + tolerancia * 0.9)), ctx).toBe(true);
          expect(verificar(p, String(alvo + tolerancia * 1.5 + 0.01)), ctx).toBe(false);
        } else if (p.formato === "ordenar") {
          const o = p.opcoes!;
          expect(o.length, ctx).toBeGreaterThanOrEqual(3);
          expect(new Set(o).size, ctx).toBe(o.length);
          expect([...o].sort(), ctx).toEqual(p.resposta.split("|").sort());
          expect(o.join("|"), `já vem ordenada — ${ctx}`).not.toBe(p.resposta);
          expect(verificar(p, o.join("|")), ctx).toBe(false);
        } else {
          const o = p.opcoes!;
          expect(o, ctx).toContain(p.resposta);
          expect(new Set(o).size, `opções repetidas — ${ctx}: ${o}`).toBe(o.length);
          expect(o.length, ctx).toBeGreaterThanOrEqual(2);
          expect(o.length, ctx).toBeLessThanOrEqual(4);
          if (p.formato === "escolha" && h.id !== "fracao-comparar") expect(o.length, ctx).toBe(4);
          for (const a of p.aceitar ?? []) if (a !== p.resposta) expect(o, `outra resposta correta entre as opções — ${ctx}`).not.toContain(a);
        }
        if (p.linhas) {
          expect(p.linhas.length, ctx).toBeGreaterThanOrEqual(3);
          for (const l of p.linhas) expect(l, ctx).not.toMatch(/NaN|undefined|Infinity/);
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

describe("formatos novos", () => {
  const gerar = (id: string) => todas(POR_ID.get(id)!, false);

  it("ordenar: a resposta está em ordem crescente de fato", () => {
    for (const p of gerar("ordenar-racionais")) {
      const valor = (t: string) => (t.includes("/") ? Number(t.split("/")[0]) / Number(t.split("/")[1]) : Number(t.replace(",", ".")));
      const v = p.resposta.split("|").map(valor);
      expect(v, p.resposta).toEqual([...v].sort((a, b) => a - b));
      expect(new Set(v).size, "valores repetidos").toBe(v.length);
    }
  });

  it("encontre o erro: a linha indicada é mesmo a primeira errada", () => {
    for (const p of gerar("erro-equacao")) {
      const [l1, l2, l3, l4] = p.linhas!;
      const [, a, b, cc] = l1!.match(/^(\d+)x \+ (\d+) = (\d+)$/)!.map(Number) as [number, number, number, number];
      const rhs = Number(l2!.split("= ")[1]!.replace(",", "."));
      const op = l3!.includes("÷") ? "÷" : "×";
      const val = Number(l3!.match(/= ([\d,]+) [÷×]/)![1]!.replace(",", "."));
      const fim = Number(l4!.split("= ")[1]!.replace(",", "."));
      const primeiroErro = rhs !== cc - b ? "Linha 2" : op !== "÷" || val !== rhs ? "Linha 3" : fim !== rhs / a ? "Linha 4" : "Nenhuma: está tudo certo";
      expect(p.resposta, p.linhas!.join(" / ")).toBe(primeiroErro);
    }
  });

  it("todo formato novo aparece nas rodadas de um aluno avançado", async () => {
    const { novoEstado } = await import("./estado");
    const { montarRodada } = await import("./selecao");
    const e = novoEstado(7);
    e.colocadas = HABILIDADES.map((h) => h.id);
    const vistos = new Set<string>();
    const r = criarRng(3);
    for (let i = 0; i < 60; i++) for (const q of montarRodada(e, "treino", r)) vistos.add(q.formato);
    // "digitar" só aparece depois que o aluno domina a categoria; sem histórico, nunca
    for (const f of ["escolha", "vf", "ordenar", "reta"]) expect(vistos.has(f), f).toBe(true);
  });
});

describe("problemas contextualizados: a resposta confere com o enunciado", () => {
  const nums = (t: string) => (t.match(/[-−]?\d+/g) ?? []).map((n) => Number(n.replace("−", "-")));
  const val = (p: Pergunta) => Number(p.resposta.replace(",", "."));
  const gerar = (id: string, cat: string) =>
    Array.from({ length: SEMENTES }, (_, s) => gerarPergunta(POR_ID.get(id)!, cat, criarRng(s * 31 + 5), true));

  it("7º ano: desconto, aumento, temperatura, equação e escala", () => {
    for (const p of gerar("problemas-7", "desconto")) { const [P, pc] = nums(p.enunciado) as [number, number]; expect(val(p), p.enunciado).toBe(P - (P * pc) / 100); }
    for (const p of gerar("problemas-7", "aumento")) { const [P, pc] = nums(p.enunciado) as [number, number]; expect(val(p), p.enunciado).toBe(P + (P * pc) / 100); }
    for (const p of gerar("problemas-7", "temperatura")) {
      const n = nums(p.enunciado);
      const esperado = p.enunciado.includes("termômetro") ? (p.enunciado.includes("subiu") ? n[0]! + n[1]! : n[0]! - n[1]!)
        : p.enunciado.includes("devia") ? n[1]! - n[0]!
        : n[0]! + n[1]!; // mergulhador: −fundo (já com sinal) + subida
      expect(val(p), p.enunciado).toBe(esperado);
    }
    for (const p of gerar("problemas-7", "equacao")) {
      const n = nums(p.enunciado);
      expect(val(p), p.enunciado).toBe(p.enunciado.startsWith("Pensei") ? (n[2]! - n[1]!) / n[0]! : (n[0]! - n[1]!) / 2);
      expect(Number.isInteger(val(p))).toBe(true);
    }
    for (const p of gerar("problemas-7", "escala")) { const [, e, cm] = nums(p.enunciado) as [number, number, number]; expect(val(p), p.enunciado).toBe(e * cm); }
  });

  it("8º ano: juros, área e perímetro, notação científica e táxi", () => {
    for (const p of gerar("problemas-8", "juros")) {
      const [C, i, t] = nums(p.enunciado) as [number, number, number], J = (C * i * t) / 100;
      expect(val(p), p.enunciado).toBe(p.enunciado.includes("de juros") ? J : C + J);
    }
    for (const p of gerar("problemas-8", "area-perimetro")) {
      const [a, b] = nums(p.enunciado) as [number, number];
      expect(val(p), p.enunciado).toBe(p.enunciado.includes("quadrados") ? a * b : 2 * (a + b));
    }
    for (const p of gerar("problemas-8", "notacao")) {
      const n = nums(p.enunciado), ult = n[n.length - 1]!;
      expect(val(p), p.enunciado).toBeCloseTo(p.enunciado.includes("luz") ? 3e5 * ult : ult * 0.002, 9);
    }
    for (const p of gerar("problemas-8", "taxi")) {
      const [f, v, k] = nums(p.enunciado) as [number, number, number];
      expect(val(p), p.enunciado).toBe(p.enunciado.includes("Quanto custa") ? f + v * k : (k - f) / v);
    }
  });

  it("9º ano: Pitágoras, média, probabilidade e área com equação do 2º grau", () => {
    for (const p of gerar("problemas-9", "pitagoras")) {
      const [x, y] = nums(p.enunciado) as [number, number];
      expect(val(p), p.enunciado).toBeCloseTo(p.enunciado.includes("escada") ? Math.sqrt(x * x - y * y) : Math.sqrt(x * x + y * y), 9);
    }
    for (const p of gerar("problemas-9", "media-meta")) {
      const n = nums(p.enunciado), alvo = n.pop()!, soma = n.reduce((s, x) => s + x, 0);
      expect(n.length).toBe(4);
      expect(val(p), p.enunciado).toBe(5 * alvo - soma);
      expect(val(p)).toBeLessThanOrEqual(10);
    }
    for (const p of gerar("problemas-9", "probabilidade")) { const [v, a] = nums(p.enunciado) as [number, number]; expect(val(p), p.enunciado).toBeCloseTo((100 * v) / (v + a), 9); }
    for (const p of gerar("problemas-9", "area-2grau")) {
      const [A, k] = nums(p.enunciado) as [number, number], x = val(p);
      expect(x * (x + k), p.enunciado).toBe(A);
    }
  });

  it("os textos não vazam a resposta nem têm espaços e sinais estranhos", () => {
    for (const id of ["problemas-6", "problemas-7", "problemas-8", "problemas-9"]) {
      for (const p of todas(POR_ID.get(id)!, false)) {
        expect(p.enunciado, p.enunciado).not.toMatch(/\s{2,}|\?\?|\.\./);
        expect(p.enunciado.length, p.enunciado).toBeGreaterThan(30);
        const entrega = /^\d+$/.test(p.resposta) && Number(p.resposta) > 100 && new RegExp(`(?<![\\d.,])${p.resposta}(?![\\d.,])`).test(p.dica);
        expect(entrega, `dica entrega a resposta: ${p.dica}`).toBe(false);
      }
    }
  });
});

describe("números grandes nas alternativas", () => {
  it("usam ponto de milhar e o digitar continua sem separador", () => {
    const h = POR_ID.get("problemas-8")!;
    let visto = false;
    for (let s = 1; s <= 200; s++) {
      const p = gerarPergunta(h, "notacao", criarRng(s), false);
      if (!p.enunciado.includes("luz")) continue;
      visto = true;
      for (const o of p.opcoes!) expect(o, p.enunciado).toMatch(/^\d{1,3}(\.\d{3})*$|^\d{1,4}$/);
      expect(p.opcoes).toContain(p.resposta);
      const d = gerarPergunta(h, "notacao", criarRng(s), true);
      expect(d.resposta).toMatch(/^\d+$/);
    }
    expect(visto).toBe(true);
  });
});
