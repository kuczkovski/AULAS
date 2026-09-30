import type { Habilidade } from "../tipos";
import { numerica, textual } from "../construtor";
import { frac, mdc } from "../texto";

/** Fração própria irredutível n/d com d em [2, dMax]. */
function fracaoBase(r: { int(a: number, b: number): number }, dMax: number): [number, number] {
  for (;;) {
    const d = r.int(2, dMax), n = r.int(1, d - 1);
    if (mdc(n, d) === 1) return [n, d];
  }
}

export const fracaoEquivalente: Habilidade = {
  id: "fracao-equiv",
  nome: "Frações equivalentes",
  ano: 6,
  zona: "Frações",
  requisitos: ["tabuada"],
  categorias: ["completar-num", "completar-den", "reconhecer"],
  gerar(c) {
    const [n, d] = fracaoBase(c.r, 9), k = c.r.int(2, 6);
    const visual = { tipo: "barra", num: n, den: d } as const;
    if (c.cat === "reconhecer") {
      return textual(c, {
        enunciado: `Qual fração é equivalente a`,
        expr: frac(n, d),
        resposta: frac(n * k, d * k),
        distratores: [frac(n + k, d + k), frac(n * k, d * (k + 1)), frac(n * (k + 1), d * k), frac(n + 1, d + 1), frac(d * k, n * k)],
        dica: "Multiplique o numerador e o denominador pelo mesmo número.",
        explicacao: `${frac(n, d)} = ${frac(n * k, d * k)}, porque multiplicamos em cima e embaixo por ${k}.`,
        visual, verVisualAntes: true, esperadoMs: 9000,
      });
    }
    const num = c.cat === "completar-num";
    return numerica(c, {
      enunciado: "Complete para as frações serem equivalentes",
      expr: num ? `${frac(n, d)} = ?/${d * k}` : `${frac(n, d)} = ${n * k}/?`,
      resposta: num ? n * k : d * k,
      distratores: num ? [n + k, n * (k + 1), n * (k - 1), d * k] : [d + k, d * (k + 1), d * (k - 1), n * k],
      dica: num ? `Por quanto ${d} foi multiplicado para chegar em ${d * k}? Faça o mesmo com o ${n}.` : `Por quanto ${n} foi multiplicado para chegar em ${n * k}? Faça o mesmo com o ${d}.`,
      explicacao: `Multiplicamos em cima e embaixo por ${k}: ${frac(n, d)} = ${frac(n * k, d * k)}.`,
      visual, verVisualAntes: true, esperadoMs: 8000,
    });
  },
};

export const fracaoSimplificar: Habilidade = {
  id: "fracao-simplificar",
  nome: "Simplificar frações",
  ano: 6,
  zona: "Frações",
  requisitos: ["fracao-equiv", "divisao"],
  categorias: ["mdc-pequeno", "mdc-grande"],
  gerar(c) {
    const [n, d] = fracaoBase(c.r, 9);
    const g = c.cat === "mdc-pequeno" ? c.r.int(2, 3) : c.r.int(4, 9);
    const N = n * g, D = d * g;
    const parcial = g % 2 === 0 ? g / 2 : g % 3 === 0 ? g / 3 : 0;
    return textual(c, {
      enunciado: "Simplifique até a fração irredutível",
      expr: frac(N, D),
      resposta: frac(n, d),
      distratores: [
        parcial > 1 ? frac(N / parcial, D / parcial) : frac(N + 1, D + 1),
        frac(d, n), frac(N - g, D - g), frac(n, d + 1), frac(n + 1, d),
      ],
      digitavel: true,
      dica: `Ache um número que divida o ${N} e o ${D} ao mesmo tempo (o MDC deles).`,
      explicacao: `MDC(${N}, ${D}) = ${g}. Dividindo em cima e embaixo por ${g}: ${frac(n, d)}.`,
      visual: { tipo: "barra", num: N, den: D },
      esperadoMs: 11000,
    });
  },
};

export const fracaoDeQuantidade: Habilidade = {
  id: "fracao-qtd",
  nome: "Fração de uma quantidade",
  ano: 6,
  zona: "Frações",
  requisitos: ["fracao-equiv", "divisao"],
  categorias: ["unitaria", "propria"],
  gerar(c) {
    const d = c.r.int(2, 10), n = c.cat === "unitaria" ? 1 : c.r.int(2, d - 1);
    const t = c.r.int(2, 12), q = d * t, res = n * t;
    return numerica(c, {
      enunciado: `Quanto é ${frac(n, d)} de`,
      expr: String(q),
      resposta: res,
      distratores: [q - res, t, res + t, res - t, q / d + d, n * q],
      dica: `Divida ${q} em ${d} partes iguais e pegue ${n} ${n === 1 ? "delas" : "delas"}.`,
      explicacao: `${q} ÷ ${d} = ${t} (cada parte). Pegando ${n}: ${n} × ${t} = ${res}.`,
      visual: { tipo: "barra", num: n, den: d }, verVisualAntes: true,
      esperadoMs: 9000,
    });
  },
};

export const fracaoComparar: Habilidade = {
  id: "fracao-comparar",
  nome: "Comparar frações",
  ano: 6,
  zona: "Frações",
  requisitos: ["fracao-equiv"],
  categorias: ["mesmo-den", "mesmo-num", "den-multiplo", "diferentes"],
  gerar(c) {
    let a: [number, number], b: [number, number];
    for (;;) {
      if (c.cat === "mesmo-den") { const d = c.r.int(4, 12), x = c.r.int(1, d - 1), y = c.r.int(1, d - 1); a = [x, d]; b = [y, d]; }
      else if (c.cat === "mesmo-num") { const n = c.r.int(1, 5), x = c.r.int(n + 1, 12), y = c.r.int(n + 1, 12); a = [n, x]; b = [n, y]; }
      else if (c.cat === "den-multiplo") { const d = c.r.int(2, 6), k = c.r.int(2, 4); a = [c.r.int(1, d - 1), d]; b = [c.r.int(1, d * k - 1), d * k]; }
      else { a = fracaoBase(c.r, 9); b = fracaoBase(c.r, 9); }
      if (a[0] * b[1] !== b[0] * a[1]) break;
    }
    const maior = c.r.chance(0.6);
    const va = a[0] / a[1], vb = b[0] / b[1];
    const certa = (maior ? va > vb : va < vb) ? a : b;
    const outra = certa === a ? b : a;
    const D = a[1] * b[1];
    return textual(c, {
      enunciado: maior ? "Qual fração é a maior?" : "Qual fração é a menor?",
      expr: `${frac(...a)}   ou   ${frac(...b)}`,
      resposta: frac(...certa),
      distratores: [frac(...outra)],
      dica: c.cat === "mesmo-den" ? "Mesmo denominador: compare os numeradores." : c.cat === "mesmo-num" ? "Mesmo numerador: quanto maior o denominador, menores as partes." : "Coloque as duas no mesmo denominador antes de comparar.",
      explicacao: `Com denominador ${D}: ${frac(a[0] * b[1], D)} e ${frac(b[0] * a[1], D)}. ${maior ? "A maior" : "A menor"} é ${frac(...certa)}.`,
      esperadoMs: 9000,
    });
  },
};
