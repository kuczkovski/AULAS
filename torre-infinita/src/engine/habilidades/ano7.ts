import type { Habilidade } from "../tipos";
import { numerica } from "../construtor";
import { par } from "../texto";

export const inteirosSoma: Habilidade = {
  id: "inteiros-soma",
  nome: "Soma e subtração de inteiros",
  ano: 7,
  zona: "Inteiros",
  requisitos: ["soma-sub"],
  categorias: ["mesmo-sinal", "sinais-diferentes", "subtracao"],
  gerar(c) {
    let a: number, b: number, op: "+" | "-";
    if (c.cat === "mesmo-sinal") {
      const s = c.r.chance(0.5) ? 1 : -1;
      a = s * c.r.int(1, 15); b = s * c.r.int(1, 15); op = "+";
    } else if (c.cat === "sinais-diferentes") {
      a = c.r.int(2, 15) * (c.r.chance(0.5) ? 1 : -1);
      b = -Math.sign(a) * c.r.int(1, 15);
      if (Math.abs(a) === Math.abs(b)) b += -Math.sign(a);
      op = "+";
    } else {
      a = c.r.int(-12, 12); b = c.r.int(-12, 12); op = "-";
    }
    const res = op === "+" ? a + b : a - b;
    const expr = `${par(a)} ${op === "+" ? "+" : "−"} ${par(b)}`;
    return numerica(c, {
      enunciado: "Quanto é",
      expr,
      resposta: res,
      distratores: [-res, Math.abs(a) + Math.abs(b), a - b === res ? a + b : a - b, res + 2, res - 2, Math.abs(res)],
      dica: op === "-" ? "Subtrair um número é somar o seu oposto: a − b = a + (−b)." : "Mesmo sinal: some e mantenha o sinal. Sinais diferentes: subtraia e fique com o sinal do maior.",
      explicacao: `${expr} = ${op === "-" ? `${par(a)} + ${par(-b)} = ` : ""}${res}. Na reta numérica, ande ${Math.abs(b)} casa(s) para ${(op === "+" ? b : -b) >= 0 ? "a direita" : "a esquerda"} a partir de ${a}.`,
      visual: { tipo: "reta", min: Math.min(-12, res - 2), max: Math.max(12, res + 2), marca: res },
      esperadoMs: 9000,
    });
  },
};

export const inteirosMult: Habilidade = {
  id: "inteiros-mult",
  nome: "Multiplicação e divisão de inteiros",
  ano: 7,
  zona: "Inteiros",
  requisitos: ["inteiros-soma", "tabuada"],
  categorias: ["mult", "div"],
  gerar(c) {
    const s1 = c.r.chance(0.5) ? 1 : -1, s2 = c.r.chance(0.5) ? 1 : -1;
    const x = s1 * c.r.int(2, 10), y = s2 * c.r.int(2, 10);
    const mult = c.cat === "mult";
    const dividendo = x * y;
    const expr = mult ? `${par(x)} × ${par(y)}` : `${par(dividendo)} ÷ ${par(x)}`;
    const res = mult ? dividendo : y;
    return numerica(c, {
      enunciado: "Quanto é",
      expr,
      resposta: res,
      distratores: [-res, Math.abs(res), res + 10, res - 10, mult ? x + y : dividendo + x],
      dica: "Sinais iguais dão resultado positivo; sinais diferentes dão negativo. Calcule primeiro sem os sinais.",
      explicacao: `Sem os sinais: ${Math.abs(mult ? x : dividendo)} ${mult ? "×" : "÷"} ${Math.abs(mult ? y : x)} = ${Math.abs(res)}. Sinais ${(mult ? Math.sign(x) === Math.sign(y) : Math.sign(dividendo) === Math.sign(x)) ? "iguais → positivo" : "diferentes → negativo"}: ${res}.`,
      esperadoMs: 7000,
    });
  },
};

export const porcentagem: Habilidade = {
  id: "porcentagem",
  nome: "Porcentagem",
  ano: 7,
  zona: "Proporção",
  requisitos: ["fracao-qtd", "decimais"],
  categorias: ["10-50", "25-75", "outras"],
  gerar(c) {
    const p = c.cat === "10-50" ? c.r.pick([10, 50]) : c.cat === "25-75" ? c.r.pick([25, 75]) : c.r.pick([5, 20, 30, 40, 60, 80]);
    const base = 20 * c.r.int(1, 20);
    const res = (base * p) / 100;
    const dicas: Record<number, string> = {
      10: "10% é a décima parte: divida por 10.",
      50: "50% é a metade.",
      25: "25% é a quarta parte: divida por 4.",
      75: "75% é três quartos: ache 25% e multiplique por 3.",
    };
    return numerica(c, {
      enunciado: `Quanto é ${p}% de`,
      expr: String(base),
      resposta: res,
      distratores: [(base * p) / 10, base - res, p + base, res * 2, res / 2, base / 10],
      dica: dicas[p] ?? `Ache 10% (divida por 10) e monte o ${p}% a partir dele.`,
      explicacao: `${p}% de ${base} = ${p}/100 × ${base} = ${res}.`,
      esperadoMs: 10000,
    });
  },
};

export const razaoProporcao: Habilidade = {
  id: "razao-proporcao",
  nome: "Razão e proporção",
  ano: 7,
  zona: "Proporção",
  requisitos: ["fracao-equiv", "tabuada"],
  categorias: ["completar", "regra-de-tres"],
  gerar(c) {
    if (c.cat === "completar") {
      const a = c.r.int(2, 9), b = c.r.int(2, 9), k = c.r.int(2, 8);
      return numerica(c, {
        enunciado: "Encontre x na proporção",
        expr: `${a}/${b} = x/${b * k}`,
        resposta: a * k,
        distratores: [a + k, a * (k + 1), a * (k - 1), b * k - b + a],
        dica: `Por quanto o ${b} foi multiplicado para virar ${b * k}?`,
        explicacao: `${b} × ${k} = ${b * k}, então x = ${a} × ${k} = ${a * k}.`,
        esperadoMs: 11000,
      });
    }
    const [item, unid, preco] = c.r.pick([["cadernos", "caderno", 6], ["pães", "pão", 2], ["canetas", "caneta", 3], ["ingressos", "ingresso", 15]] as const);
    const n1 = c.r.int(2, 6), n2 = c.r.int(7, 12), total1 = n1 * preco, res = n2 * preco;
    return numerica(c, {
      enunciado: `${n1} ${item} custam R$ ${total1}. Quanto custam ${n2} ${item}?`,
      expr: "",
      resposta: res,
      distratores: [total1 + (n2 - n1), total1 * 2, res + preco, res - preco, n2 * n1],
      dica: `Descubra quanto custa 1 ${unid}: divida ${total1} por ${n1}.`,
      explicacao: `1 ${unid} custa ${total1} ÷ ${n1} = R$ ${preco}. Então ${n2} ${item} custam ${n2} × ${preco} = R$ ${res}.`,
      esperadoMs: 15000,
    });
  },
};

export const equacao1grau: Habilidade = {
  id: "equacao-1grau",
  nome: "Equação do 1º grau",
  ano: 7,
  zona: "Álgebra",
  requisitos: ["inteiros-soma", "ordem-ops"],
  categorias: ["x+a=b", "ax=b", "ax+b=c"],
  gerar(c) {
    const x = c.r.int(-9, 12);
    const sinal = (n: number) => (n < 0 ? `− ${-n}` : `+ ${n}`);
    let expr: string, dica: string, exp: string, dist: number[];
    if (c.cat === "x+a=b") {
      const a = c.r.int(2, 15) * (c.r.chance(0.7) ? 1 : -1), b = x + a;
      expr = `x ${sinal(a)} = ${b}`;
      dica = "Faça a operação inversa dos dois lados.";
      exp = `x ${sinal(a)} = ${b} → x = ${b} ${sinal(-a)} = ${x}.`;
      dist = [b + a, -x, x + 2 * a, x + 1, x - 1];
    } else if (c.cat === "ax=b") {
      const a = c.r.int(2, 9), b = a * x;
      expr = `${a}x = ${b}`;
      dica = `${a}x significa ${a} vezes x. Divida os dois lados por ${a}.`;
      exp = `${a}x = ${b} → x = ${b} ÷ ${a} = ${x}.`;
      dist = [b - a, b + a, -x, a + b, x + 1];
    } else {
      const a = c.r.int(2, 6), b = c.r.int(1, 12) * (c.r.chance(0.6) ? 1 : -1), cc = a * x + b;
      expr = `${a}x ${sinal(b)} = ${cc}`;
      dica = `Primeiro desfaça a soma/subtração, depois divida por ${a}.`;
      exp = `${a}x = ${cc} ${sinal(-b)} = ${cc - b}. Então x = ${cc - b} ÷ ${a} = ${x}.`;
      dist = [(cc + b) / a, cc - b, -x, cc / a - b, x + 1, x - 1];
    }
    return numerica(c, { enunciado: "Encontre x", expr, resposta: x, distratores: dist, dica, explicacao: exp, esperadoMs: 14000 });
  },
};
