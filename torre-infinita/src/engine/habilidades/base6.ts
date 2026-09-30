import type { Habilidade } from "../tipos";
import { numerica, textual, verdadeiroFalso } from "../construtor";
import { mdc, mmc, num, par, sup } from "../texto";

const cats = (a: number, b: number) => {
  const out: string[] = [];
  for (let i = a; i <= b; i++) for (let j = i; j <= b; j++) out.push(`${i}x${j}`);
  return out;
};

const temReserva = (a: number, b: number, op: "+" | "-") => {
  let x = a, y = b;
  while (x > 0 || y > 0) {
    const dx = x % 10, dy = y % 10;
    if (op === "+" ? dx + dy >= 10 : dx < dy) return true;
    x = Math.floor(x / 10);
    y = Math.floor(y / 10);
  }
  return false;
};

export const somaSub: Habilidade = {
  id: "soma-sub",
  nome: "Somar e subtrair",
  ano: 6,
  zona: "Fundação",
  requisitos: [],
  categorias: ["soma-sr", "soma-cr", "sub-sr", "sub-cr"],
  gerar(c) {
    const soma = c.cat.startsWith("soma");
    const comReserva = c.cat.endsWith("cr");
    for (let t = 0; t < 400; t++) {
      const a = c.r.int(30, c.r.chance(0.5) ? 899 : 199);
      const b = c.r.int(11, soma ? 499 : a - 1);
      if (!soma && b >= a) continue;
      if (temReserva(a, b, soma ? "+" : "-") !== comReserva) continue;
      const res = soma ? a + b : a - b;
      const cent = Math.floor(b / 100) * 100, dez = Math.floor((b % 100) / 10) * 10, uni = b % 10;
      const passos = [cent, dez, uni].filter(Boolean);
      const sinal = soma ? "+" : "−";
      let acc = a;
      const cadeia = passos.map((p) => { const ant = acc; acc = soma ? acc + p : acc - p; return `${ant} ${sinal} ${p} = ${acc}`; });
      return numerica(c, {
        enunciado: "Quanto é",
        expr: `${a} ${sinal} ${b}`,
        resposta: res,
        distratores: soma
          ? [res + 10, res - 10, res + 100, res - 100, res + 1, res - 1]
          : [res + 10, res - 10, Math.abs(a - b) + 20, res + 1, res - 1, a + b],
        dica: soma
          ? "Some por partes: primeiro as centenas, depois as dezenas, por fim as unidades."
          : "Tire por partes e devolva o que passar, ou conte a distância entre os dois números.",
        explicacao: `Passo a passo: ${cadeia.join(" → ")}. Resultado: ${res}.`,
        esperadoMs: comReserva ? 9000 : 6500,
      });
    }
    return numerica(c, { enunciado: "Quanto é", expr: "48 + 37", resposta: 85, distratores: [75, 95, 84], dica: "Some por partes.", explicacao: "48 + 30 = 78 e 78 + 7 = 85.", esperadoMs: 7000 });
  },
};

export const tabuada: Habilidade = {
  id: "tabuada",
  nome: "Tabuada",
  ano: 6,
  zona: "Fundação",
  requisitos: ["soma-sub"],
  categorias: cats(2, 10),
  gerar(c) {
    const [x, y] = c.cat.split("x").map(Number) as [number, number];
    const [a, b] = c.r.chance(0.5) ? [x, y] : [y, x];
    const res = a * b;
    const dica = b === 9 || a === 9
      ? `Para multiplicar por 9: multiplique por 10 e tire uma vez o número (${a === 9 ? b : a} × 10 − ${a === 9 ? b : a}).`
      : b > 5
        ? `Quebre a tabuada: ${a} × 5 = ${a * 5} e some ${a} × ${b - 5}.`
        : b % 2 === 0
          ? `Use o dobro: ${a} × ${b / 2} e depois dobre.`
          : `Some ${a} três vezes, ou faça ${a} × ${b - 1} e some mais ${a}.`;
    return numerica(c, {
      enunciado: "Quanto é",
      expr: `${a} × ${b}`,
      resposta: res,
      distratores: [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, res + 10, res - 10, res + 1, res - 1, a + b],
      dica,
      explicacao: `${a} × ${b} = ${res}. Confira: ${res} ÷ ${a} = ${b}.`,
      visual: { tipo: "area", a, b },
      esperadoMs: 3800,
    });
  },
};

export const divisao: Habilidade = {
  id: "divisao",
  nome: "Divisão",
  ano: 6,
  zona: "Fundação",
  requisitos: ["tabuada"],
  categorias: [...Array.from({ length: 9 }, (_, i) => `por${i + 2}`), "resto"],
  gerar(c) {
    if (c.cat === "resto") {
      const d = c.r.int(3, 9), q = c.r.int(2, 9), r = c.r.int(1, d - 1), n = d * q + r;
      return numerica(c, {
        enunciado: "Qual é o resto da divisão",
        expr: `${n} ÷ ${d}`,
        resposta: r,
        distratores: [q, d - r, r + 1, r - 1, d],
        dica: `Ache o maior número da tabuada do ${d} que cabe em ${n}. O que sobra é o resto.`,
        explicacao: `${d} × ${q} = ${d * q}, e ${n} − ${d * q} = ${r}. O resto é ${r}.`,
        esperadoMs: 7000,
      });
    }
    const d = Number(c.cat.slice(3)), q = c.r.int(2, 12), n = d * q;
    return numerica(c, {
      enunciado: "Quanto é",
      expr: `${n} ÷ ${d}`,
      resposta: q,
      distratores: [q + 1, q - 1, q + 2, q - 2, d, n - d],
      dica: `Pense ao contrário: ${d} vezes quanto dá ${n}?`,
      explicacao: `${d} × ${q} = ${n}, então ${n} ÷ ${d} = ${q}.`,
      esperadoMs: 5000,
    });
  },
};

export const ordemOperacoes: Habilidade = {
  id: "ordem-ops",
  nome: "Ordem das operações",
  ano: 6,
  zona: "Fundação",
  requisitos: ["tabuada"],
  categorias: ["sem-parenteses", "com-parenteses"],
  gerar(c) {
    const a = c.r.int(2, 12), b = c.r.int(2, 9), d = c.r.int(2, 9);
    let expr: string, res: number, errada: number, dica: string, exp: string;
    if (c.cat === "com-parenteses") {
      if (c.r.chance(0.5)) {
        expr = `(${a} + ${b}) × ${d}`; res = (a + b) * d; errada = a + b * d;
        dica = "O que está entre parênteses vem primeiro.";
        exp = `Parênteses primeiro: ${a} + ${b} = ${a + b}. Depois ${a + b} × ${d} = ${res}.`;
      } else {
        const x = a + b;
        expr = `${x} × (${a} − ${Math.min(a - 1, b)})`;
        const s = a - Math.min(a - 1, b);
        res = x * s; errada = x * a - Math.min(a - 1, b);
        dica = "Resolva os parênteses antes de multiplicar.";
        exp = `Parênteses primeiro: ${a} − ${Math.min(a - 1, b)} = ${s}. Depois ${x} × ${s} = ${res}.`;
      }
    } else {
      const t = c.r.int(0, 3);
      if (t === 0) { expr = `${a} + ${b} × ${d}`; res = a + b * d; errada = (a + b) * d; }
      else if (t === 1 && a * b > d) { expr = `${a} × ${b} − ${d}`; res = a * b - d; errada = a * (b - d); }
      else if (t === 2) { expr = `${a} + ${b * d} ÷ ${d}`; res = a + b; errada = (a + b * d) / d; }
      else { expr = `${a * b} ÷ ${b} + ${d}`; res = a + d; errada = (a * b) / (b + d); }
      dica = "Multiplicação e divisão vêm antes de soma e subtração.";
      exp = `Primeiro a multiplicação/divisão, depois a soma/subtração. Resultado: ${res}.`;
    }
    return numerica(c, {
      enunciado: "Calcule",
      expr,
      resposta: res,
      distratores: [errada, res + 1, res - 1, res + 2, res - 2, res + 10],
      dica,
      explicacao: exp,
      esperadoMs: 9000,
    });
  },
};

export const potencias: Habilidade = {
  id: "potencias",
  nome: "Potências",
  ano: 6,
  zona: "Fundação",
  requisitos: ["tabuada"],
  categorias: ["quadrado", "cubo", "base10"],
  gerar(c) {
    let b: number, e: number;
    if (c.cat === "quadrado") { b = c.r.int(2, 15); e = 2; }
    else if (c.cat === "cubo") { b = c.r.pick([2, 3, 4, 5, 6, 10]); e = 3; }
    else { b = 10; e = c.r.int(2, 6); }
    const res = b ** e;
    return numerica(c, {
      enunciado: "Quanto é",
      expr: `${b}${sup(e)}`,
      resposta: res,
      distratores: [b * e, b + e, (b + 1) ** e, (b - 1) ** e, res * b, e === 2 ? b * 3 : b * b, b === 10 ? res * 10 : res + b],
      dica: b === 10 ? "Potência de 10: o expoente diz quantos zeros aparecem." : `O expoente diz quantas vezes ${b} é multiplicado por ele mesmo.`,
      explicacao: `${b}${sup(e)} = ${Array(e).fill(b).join(" × ")} = ${res}.`,
      esperadoMs: 6000,
    });
  },
};

export const divisibilidade: Habilidade = {
  id: "divisibilidade",
  nome: "Divisibilidade",
  ano: 6,
  zona: "Números",
  requisitos: ["divisao"],
  categorias: ["2-5-10", "3-9", "4-6"],
  gerar(c) {
    const d = c.cat === "2-5-10" ? c.r.pick([2, 5, 10]) : c.cat === "3-9" ? c.r.pick([3, 9]) : c.r.pick([4, 6]);
    const divide = (n: number) => n % d === 0;
    const regra: Record<number, string> = {
      2: "Termina em 0, 2, 4, 6 ou 8.",
      5: "Termina em 0 ou 5.",
      10: "Termina em 0.",
      3: "A soma dos algarismos é divisível por 3.",
      9: "A soma dos algarismos é divisível por 9.",
      4: "Os dois últimos algarismos formam um número divisível por 4.",
      6: "É par e a soma dos algarismos é divisível por 3.",
    };
    const explica = (n: number) =>
      d === 3 || d === 9 || d === 6
        ? `${String(n).split("").join(" + ")} = ${String(n).split("").reduce((s, x) => s + Number(x), 0)}. ${regra[d]}`
        : regra[d]!;
    if (c.r.chance(0.5)) {
      const verdadeiro = c.r.chance(0.5);
      let n = c.r.int(100, 999);
      if (verdadeiro) n = n - (n % d) + d; else if (divide(n)) n += 1;
      return verdadeiroFalso({
        enunciado: "Verdadeiro ou falso?",
        expr: `${n} é divisível por ${d}`,
        verdadeiro: divide(n),
        dica: regra[d]!,
        explicacao: `${n}: ${explica(n)} Portanto ${divide(n) ? "é" : "não é"} divisível por ${d}.`,
        esperadoMs: 6000,
      });
    }
    const certo = (() => { let n = c.r.int(100, 999); return n - (n % d) + d; })();
    const errados = new Set<number>();
    while (errados.size < 3) { const n = c.r.int(100, 999); if (!divide(n)) errados.add(n); }
    return textual(c, {
      enunciado: `Qual destes números é divisível por ${d}?`,
      expr: "",
      resposta: String(certo),
      distratores: [...errados].map(String),
      dica: regra[d]!,
      explicacao: `${certo}: ${explica(certo)}`,
      esperadoMs: 9000,
    });
  },
};

export const mmcMdc: Habilidade = {
  id: "mmc-mdc",
  nome: "MMC e MDC",
  ano: 6,
  zona: "Números",
  requisitos: ["divisao", "divisibilidade"],
  categorias: ["mdc", "mmc"],
  gerar(c) {
    let g: number, m: number, n: number;
    do { g = c.r.int(2, 6); m = c.r.int(2, 7); n = c.r.int(2, 7); } while (m === n || mdc(m, n) !== 1);
    const a = g * m, b = g * n;
    if (c.cat === "mdc") {
      return numerica(c, {
        enunciado: "Qual é o MDC (maior divisor comum) de",
        expr: `${a} e ${b}`,
        resposta: g,
        distratores: [g * 2, g + 1, Math.min(a, b), a - b > 0 ? a - b : b - a, 1, mmc(a, b)],
        dica: "Liste os divisores dos dois números e ache o maior que aparece nas duas listas.",
        explicacao: `${a} = ${g} × ${m} e ${b} = ${g} × ${n}. O maior divisor comum é ${g}.`,
        esperadoMs: 12000,
      });
    }
    const res = mmc(a, b);
    return numerica(c, {
      enunciado: "Qual é o MMC (menor múltiplo comum) de",
      expr: `${a} e ${b}`,
      resposta: res,
      distratores: [a * b, a + b, res * 2, Math.max(a, b), res / g > 0 ? res + g : res, res - g],
      dica: "Liste os múltiplos do maior número até achar um que também seja múltiplo do menor.",
      explicacao: `MMC = (${a} × ${b}) ÷ MDC = ${a * b} ÷ ${g} = ${res}.`,
      esperadoMs: 14000,
    });
  },
};

export const decimais: Habilidade = {
  id: "decimais",
  nome: "Números decimais",
  ano: 6,
  zona: "Números",
  requisitos: ["soma-sub"],
  categorias: ["soma", "sub", "mult10"],
  gerar(c) {
    if (c.cat === "mult10") {
      const a = c.r.int(11, 999) / 10 ** c.r.int(1, 2), p = c.r.pick([10, 100, 1000]);
      const res = Math.round(a * p * 1e6) / 1e6;
      return numerica(c, {
        enunciado: "Quanto é",
        expr: `${num(a)} × ${p}`,
        resposta: res,
        distratores: [a * p * 10, a * p / 10, a + p, a * (p / 10)],
        dica: `Multiplicar por ${p} desloca a vírgula ${String(p).length - 1} casa(s) para a direita.`,
        explicacao: `Vírgula ${String(p).length - 1} casa(s) para a direita: ${num(a)} × ${p} = ${num(res)}.`,
        esperadoMs: 6000,
      });
    }
    const A = c.r.int(105, 990), B = c.r.int(105, 990);
    const soma = c.cat === "soma";
    const [x, y] = soma || A >= B ? [A, B] : [B, A];
    const res = (soma ? x + y : x - y) / 100;
    return numerica(c, {
      enunciado: "Quanto é",
      expr: `${num(x / 100)} ${soma ? "+" : "−"} ${num(y / 100)}`,
      resposta: res,
      distratores: [res + 0.1, res - 0.1, res + 1, res - 1, res * 10],
      dica: "Alinhe as vírgulas: décimos com décimos, centésimos com centésimos.",
      explicacao: `Alinhando as vírgulas: ${num(x / 100)} ${soma ? "+" : "−"} ${num(y / 100)} = ${num(res)}.`,
      passo: 0.01,
      esperadoMs: 11000,
    });
  },
};
