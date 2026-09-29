import type { Habilidade } from "../tipos";
import { numerica, textual } from "../construtor";
import { num, par, sup } from "../texto";

export const potenciasRegras: Habilidade = {
  id: "potencias-regras",
  nome: "Propriedades das potências",
  ano: 8,
  zona: "Potências",
  requisitos: ["potencias", "inteiros-mult"],
  categorias: ["produto", "quociente", "potencia-de-potencia", "expoente-zero"],
  gerar(c) {
    const b = c.r.int(2, 9);
    if (c.cat === "expoente-zero") {
      const base = c.r.chance(0.5) ? b : -b;
      return numerica(c, {
        enunciado: "Quanto é", expr: `${par(base)}${sup(0)}`, resposta: 1,
        distratores: [0, base, -1, b],
        dica: "Todo número diferente de zero elevado a zero vale 1.",
        explicacao: `Regra: a⁰ = 1 para qualquer a ≠ 0. Logo ${par(base)}⁰ = 1.`,
        esperadoMs: 6000,
      });
    }
    const n = c.r.int(2, 6);
    const mm = c.cat === "quociente" ? n + c.r.int(1, 4) : c.r.int(2, 7);
    let expr: string, res: number, dist: number[], dica: string, exp: string;
    if (c.cat === "produto") {
      expr = `${b}${sup(mm)} × ${b}${sup(n)} = ${b}^?`; res = mm + n; dist = [mm * n, mm - n, mm + n + 1, mm + n - 1];
      dica = "Mesma base na multiplicação: some os expoentes."; exp = `${mm} + ${n} = ${res}.`;
    } else if (c.cat === "quociente") {
      expr = `${b}${sup(mm)} ÷ ${b}${sup(n)} = ${b}^?`; res = mm - n; dist = [mm + n, mm * n, mm - n + 1, mm - n - 1];
      dica = "Mesma base na divisão: subtraia os expoentes."; exp = `${mm} − ${n} = ${res}.`;
    } else {
      expr = `(${b}${sup(mm)})${sup(n)} = ${b}^?`; res = mm * n; dist = [mm + n, mm ** n, mm * n + 1, mm * n - 1];
      dica = "Potência de potência: multiplique os expoentes."; exp = `${mm} × ${n} = ${res}.`;
    }
    return numerica(c, { enunciado: "Qual é o expoente?", expr, resposta: res, distratores: dist, dica, explicacao: `${exp} O resultado é ${b}${sup(res)}.`, esperadoMs: 9000 });
  },
};

export const raizQuadrada: Habilidade = {
  id: "raiz-quadrada",
  nome: "Raiz quadrada",
  ano: 8,
  zona: "Potências",
  requisitos: ["potencias"],
  categorias: ["exata", "estimar"],
  gerar(c) {
    if (c.cat === "exata") {
      const n = c.r.int(2, 20);
      return numerica(c, {
        enunciado: "Quanto é", expr: `√${n * n}`, resposta: n,
        distratores: [n * n / 2, n + 1, n - 1, n * 2, n + 2],
        dica: `Qual número multiplicado por ele mesmo dá ${n * n}?`,
        explicacao: `${n} × ${n} = ${n * n}, então √${n * n} = ${n}.`,
        esperadoMs: 6500,
      });
    }
    let N: number;
    do { N = c.r.int(3, 200); } while (Number.isInteger(Math.sqrt(N)));
    const k = Math.floor(Math.sqrt(N));
    return textual(c, {
      enunciado: "Entre quais números inteiros está", expr: `√${N}`,
      resposta: `${k} e ${k + 1}`,
      distratores: [`${k - 1} e ${k}`, `${k + 1} e ${k + 2}`, `${k - 2} e ${k - 1}`, `${k + 2} e ${k + 3}`],
      dica: "Procure os quadrados perfeitos mais próximos, um menor e um maior que o número.",
      explicacao: `${k}² = ${k * k} e ${k + 1}² = ${(k + 1) ** 2}. Como ${k * k} < ${N} < ${(k + 1) ** 2}, √${N} está entre ${k} e ${k + 1}.`,
      esperadoMs: 12000,
    });
  },
};

export const valorNumerico: Habilidade = {
  id: "valor-numerico",
  nome: "Valor numérico de expressões",
  ano: 8,
  zona: "Álgebra",
  requisitos: ["equacao-1grau", "potencias"],
  categorias: ["linear", "quadratica", "duas-variaveis"],
  gerar(c) {
    if (c.cat === "linear") {
      const a = c.r.int(2, 9), b = c.r.int(1, 12) * (c.r.chance(0.5) ? 1 : -1), x = c.r.int(-6, 10);
      const res = a * x + b;
      return numerica(c, {
        enunciado: `Para x = ${x}, calcule`, expr: `${a}x ${b < 0 ? "−" : "+"} ${Math.abs(b)}`, resposta: res,
        distratores: [a + x + b, a * (x + b), -res, res + 2 * b, a * x - b],
        dica: "Troque x pelo valor dado, com parênteses se ele for negativo, e resolva.",
        explicacao: `${a} × ${par(x)} ${b < 0 ? "−" : "+"} ${Math.abs(b)} = ${a * x} ${b < 0 ? "−" : "+"} ${Math.abs(b)} = ${res}.`,
        esperadoMs: 11000,
      });
    }
    if (c.cat === "quadratica") {
      const x = c.r.int(-7, 7), b = c.r.int(1, 15);
      const res = x * x - b;
      return numerica(c, {
        enunciado: `Para x = ${x}, calcule`, expr: `x² − ${b}`, resposta: res,
        distratores: [-x * x - b, 2 * x - b, x * x + b, x * x - b + 2, x * -x - b === res ? res + 1 : x * -x - b],
        dica: "Eleve primeiro: o quadrado de um número negativo é positivo.",
        explicacao: `${par(x)}² = ${x * x}, e ${x * x} − ${b} = ${res}.`,
        esperadoMs: 12000,
      });
    }
    const x = c.r.int(1, 8), y = c.r.int(1, 8), a = c.r.int(2, 5), res = a * x - y;
    return numerica(c, {
      enunciado: `Para x = ${x} e y = ${y}, calcule`, expr: `${a}x − y`, resposta: res,
      distratores: [a * x + y, a + x - y, a * (x - y), y - a * x],
      dica: "Substitua cada letra pelo seu valor antes de calcular.",
      explicacao: `${a} × ${x} − ${y} = ${a * x} − ${y} = ${res}.`,
      esperadoMs: 12000,
    });
  },
};

export const notacaoCientifica: Habilidade = {
  id: "notacao-cientifica",
  nome: "Notação científica",
  ano: 8,
  zona: "Potências",
  requisitos: ["potencias-regras", "decimais"],
  categorias: ["expandir", "expoente"],
  gerar(c) {
    if (c.cat === "expandir") {
      const m = c.r.int(11, 99) / 10, e = c.r.pick([-3, -2, -1, 1, 2, 3, 4, 5]);
      const res = Math.round(m * 10 ** e * 1e9) / 1e9;
      return numerica(c, {
        enunciado: "Escreva por extenso", expr: `${num(m)} × 10${sup(e)}`, resposta: res,
        distratores: [res * 10, res / 10, Math.round(m * 10 ** (e + 2) * 1e9) / 1e9, Math.round(m * 10 ** (-e) * 1e9) / 1e9],
        dica: e >= 0 ? `Expoente positivo: a vírgula anda ${e} casa(s) para a direita.` : `Expoente negativo: a vírgula anda ${-e} casa(s) para a esquerda.`,
        explicacao: `10${sup(e)} ${e >= 0 ? "desloca a vírgula para a direita" : "desloca a vírgula para a esquerda"} em ${Math.abs(e)} casa(s): ${num(res)}.`,
        passo: Math.abs(res) < 1 ? 0.001 : 10,
        esperadoMs: 12000,
      });
    }
    const e = c.r.int(2, 7), m = c.r.int(11, 99) / 10, valor = Math.round(m * 10 ** e);
    return numerica(c, {
      enunciado: `Escreva ${valor.toLocaleString("pt-BR")} em notação científica: ${num(m)} × 10^?`, expr: "", resposta: e,
      distratores: [e + 1, e - 1, e + 2, String(valor).length],
      dica: "Conte quantas casas a vírgula precisa andar para ficar depois do primeiro algarismo.",
      explicacao: `${valor.toLocaleString("pt-BR")} = ${num(m)} × 10${sup(e)}: a vírgula andou ${e} casas.`,
      esperadoMs: 12000,
    });
  },
};

const sgn = (n: number) => (n < 0 ? "−" : "+");

export const equacao2grau: Habilidade = {
  id: "equacao-2grau",
  nome: "Equação do 2º grau",
  ano: 9,
  zona: "Álgebra",
  requisitos: ["equacao-1grau", "inteiros-mult"],
  categorias: ["raizes", "discriminante"],
  gerar(c) {
    if (c.cat === "raizes") {
      let r1: number, r2: number;
      do { r1 = c.r.int(-8, 8); r2 = c.r.int(-8, 8); } while (r1 === 0 || r2 === 0 || r1 === r2);
      const b = -(r1 + r2), cc = r1 * r2;
      const meio = b === 0 ? "" : ` ${sgn(b)} ${Math.abs(b) === 1 ? "" : Math.abs(b)}x`;
      return numerica(c, {
        enunciado: "Qual é uma das raízes de", expr: `x²${meio} ${sgn(cc)} ${Math.abs(cc)} = 0`, resposta: r1, tambemCorretas: [r2],
        distratores: [-r1, -r2, r1 + r2, cc, b],
        dica: "Procure dois números cuja soma é −b e cujo produto é c.",
        explicacao: `Soma das raízes = ${-b} e produto = ${cc}. Os números são ${r1} e ${r2}: (x ${sgn(-r1)} ${Math.abs(r1)})(x ${sgn(-r2)} ${Math.abs(r2)}) = 0.`,
        esperadoMs: 20000,
      });
    }
    const a = c.r.int(1, 3), b = c.r.pick([-8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8]), cc = c.r.pick([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8]), d = b * b - 4 * a * cc;
    return numerica(c, {
      enunciado: "Calcule o discriminante Δ = b² − 4ac de",
      expr: `${a === 1 ? "" : a}x² ${sgn(b)} ${Math.abs(b)}x ${sgn(cc)} ${Math.abs(cc)} = 0`, resposta: d,
      distratores: [b * b + 4 * a * cc, b * b - 4 * a * cc + 2 * a * cc, -b * b - 4 * a * cc, 2 * b - 4 * a * cc],
      dica: `Aqui a = ${a}, b = ${b} e c = ${cc}. Cuidado com o sinal de b ao elevar ao quadrado.`,
      explicacao: `Δ = (${b})² − 4 × ${a} × (${cc}) = ${b * b} ${cc * a * 4 > 0 ? "−" : "+"} ${Math.abs(4 * a * cc)} = ${d}.`,
      esperadoMs: 20000,
    });
  },
};

export const TERNOS: [number, number, number][] = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]];

export const pitagoras: Habilidade = {
  id: "pitagoras",
  nome: "Teorema de Pitágoras",
  ano: 9,
  zona: "Geometria",
  requisitos: ["raiz-quadrada"],
  categorias: ["hipotenusa", "cateto"],
  gerar(c) {
    const [a0, b0, h0] = c.r.pick(TERNOS);
    const k = a0 <= 5 ? c.r.int(1, 3) : 1;
    const [a, b, h] = [a0 * k, b0 * k, h0 * k];
    if (c.cat === "hipotenusa") {
      return numerica(c, {
        enunciado: `Um triângulo retângulo tem catetos ${a} e ${b}. Quanto mede a hipotenusa?`, expr: "", resposta: h,
        distratores: [a + b, a * a + b * b, b - a, h + 1, h - 1],
        dica: "Hipotenusa² = cateto² + cateto². Depois tire a raiz.",
        explicacao: `${a}² + ${b}² = ${a * a} + ${b * b} = ${a * a + b * b}, e √${a * a + b * b} = ${h}.`,
        esperadoMs: 20000,
      });
    }
    return numerica(c, {
      enunciado: `A hipotenusa mede ${h} e um cateto mede ${a}. Quanto mede o outro cateto?`, expr: "", resposta: b,
      distratores: [h - a, h + a, h * h - a * a, b + 1, b - 1],
      dica: "Cateto² = hipotenusa² − cateto². Depois tire a raiz.",
      explicacao: `${h}² − ${a}² = ${h * h} − ${a * a} = ${h * h - a * a}, e √${h * h - a * a} = ${b}.`,
      esperadoMs: 22000,
    });
  },
};

export const estatistica: Habilidade = {
  id: "estatistica",
  nome: "Média, mediana e moda",
  ano: 9,
  zona: "Dados",
  requisitos: ["decimais", "divisao"],
  categorias: ["media", "mediana", "moda"],
  gerar(c) {
    if (c.cat === "media") {
      for (;;) {
        const v = Array.from({ length: 5 }, () => c.r.int(2, 20));
        const soma = v.reduce((s, x) => s + x, 0);
        if (soma % 5) continue;
        return numerica(c, {
          enunciado: "Qual é a média de", expr: v.join(", "), resposta: soma / 5,
          distratores: [soma, soma / 5 + 1, soma / 5 - 1, [...v].sort((a, b) => a - b)[2]!],
          dica: "Some todos os valores e divida pela quantidade de valores.",
          explicacao: `${v.join(" + ")} = ${soma}, e ${soma} ÷ 5 = ${soma / 5}.`,
          esperadoMs: 14000,
        });
      }
    }
    if (c.cat === "mediana") {
      const v = Array.from({ length: c.r.pick([5, 7]) }, () => c.r.int(1, 30));
      const s = [...v].sort((a, b) => a - b), med = s[(s.length - 1) / 2]!;
      return numerica(c, {
        enunciado: "Qual é a mediana de", expr: v.join(", "), resposta: med,
        distratores: [Math.round(v.reduce((a, b) => a + b, 0) / v.length), v[(v.length - 1) / 2]!, s[0]!, s[s.length - 1]!, med + 1],
        dica: "Coloque em ordem crescente e pegue o valor do meio.",
        explicacao: `Em ordem: ${s.join(", ")}. O valor do meio é ${med}.`,
        esperadoMs: 15000,
      });
    }
    const moda = c.r.int(2, 20), outros: number[] = [];
    while (outros.length < 4) { const x = c.r.int(2, 20); if (x !== moda && !outros.includes(x)) outros.push(x); }
    const v = c.r.shuffle([moda, moda, moda, ...outros.slice(0, 3), outros[3]!]);
    return numerica(c, {
      enunciado: "Qual é a moda de", expr: v.join(", "), resposta: moda,
      distratores: [...outros, Math.max(...v), Math.min(...v)],
      dica: "A moda é o valor que aparece mais vezes.",
      explicacao: `O ${moda} aparece 3 vezes, mais do que qualquer outro.`,
      esperadoMs: 9000,
    });
  },
};
