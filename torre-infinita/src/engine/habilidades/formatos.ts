import type { Habilidade } from "../tipos";
import { naReta, numerica, ordenar } from "../construtor";
import { frac, num } from "../texto";

/* Habilidades que usam formatos com toque (ordenar, reta) ou leitura crítica
   (encontre o erro) e problemas do dia a dia. Ficam fora do nivelamento, que
   é só de respostas digitadas: entram na prática quando os requisitos abrem. */

const distintos = (r: { int(a: number, b: number): number }, n: number, lo: number, hi: number) => {
  const s = new Set<number>();
  while (s.size < n) s.add(r.int(lo, hi));
  return [...s];
};

export const ordenarRacionais: Habilidade = {
  id: "ordenar-racionais",
  nome: "Ordenar frações e decimais",
  ano: 6,
  zona: "Frações",
  requisitos: ["fracao-comparar", "decimais"],
  categorias: ["mesmo-denominador", "mesmo-numerador", "decimais"],
  nivelamento: false,
  gerar(c) {
    const base = { enunciado: "Coloque em ordem crescente (do menor para o maior)", expr: "", esperadoMs: 15000 };
    if (c.cat === "mesmo-denominador") {
      const d = c.r.int(5, 12), ns = distintos(c.r, 4, 1, d - 1).sort((a, b) => a - b);
      return ordenar(c, { ...base, crescente: ns.map((n) => frac(n, d)),
        dica: "Com o mesmo denominador, a maior fração é a de maior numerador.",
        explicacao: `Denominador igual (${d}): compare só os numeradores. Ordem: ${ns.map((n) => frac(n, d)).join(" < ")}.` });
    }
    if (c.cat === "mesmo-numerador") {
      const n = c.r.int(1, 5), ds = distintos(c.r, 4, n + 1, 12).sort((a, b) => b - a);
      return ordenar(c, { ...base, crescente: ds.map((d) => frac(n, d)),
        dica: "Com o mesmo numerador, quanto maior o denominador, menores são as partes.",
        explicacao: `Numerador igual (${n}): denominador maior significa fração menor. Ordem: ${ds.map((d) => frac(n, d)).join(" < ")}.` });
    }
    const vals = [...new Set([c.r.int(1, 19), c.r.int(21, 99), c.r.int(101, 199), c.r.int(201, 999)])].map((v) => (c.r.chance(0.5) ? v / 100 : v / 1000));
    const unicos = [...new Set(vals)].sort((a, b) => a - b);
    return ordenar(c, { ...base, crescente: unicos.map(num),
      dica: "Compare décimo com décimo, depois centésimo. Acrescentar zeros à direita ajuda: 0,5 = 0,500.",
      explicacao: `Igualando as casas: ${unicos.map(num).join(" < ")}.` });
  },
};

export const fracaoNaReta: Habilidade = {
  id: "fracao-na-reta",
  nome: "Frações na reta numérica",
  ano: 6,
  zona: "Frações",
  requisitos: ["fracao-comparar"],
  categorias: ["de-0-a-1", "de-0-a-2"],
  nivelamento: false,
  gerar(c) {
    const ate2 = c.cat === "de-0-a-2";
    const d = c.r.pick(ate2 ? [2, 3, 4, 5] : [2, 3, 4, 5, 8, 10]);
    const n = ate2 ? c.r.int(1, 2 * d - 1) : c.r.int(1, d - 1);
    return naReta({
      enunciado: `Toque na reta onde está ${frac(n, d)}`, expr: "",
      alvo: n / d, min: 0, max: ate2 ? 2 : 1, passo: 1 / d, tolerancia: 0.5 / d,
      dica: `Cada pedaço da reta vale ${frac(1, d)}. Conte ${n} pedaços a partir do zero.`,
      explicacao: `${frac(n, d)} fica depois de ${n} pedaços de tamanho ${frac(1, d)} contados a partir do 0.`,
      esperadoMs: 12000,
    });
  },
};

export const inteirosNaReta: Habilidade = {
  id: "inteiros-na-reta",
  nome: "Números na reta numérica",
  ano: 7,
  zona: "Inteiros",
  requisitos: ["inteiros-soma"],
  categorias: ["inteiro", "oposto", "decimal"],
  nivelamento: false,
  gerar(c) {
    if (c.cat === "decimal") {
      const v = c.r.int(-9, 9) + c.r.pick([-0.5, 0.5]);
      return naReta({
        enunciado: `Toque na reta onde está ${num(v)}`, expr: "", alvo: v, min: -10, max: 10, passo: 0.5, tolerancia: 0.25,
        dica: "Entre dois inteiros, o meio é o ,5. Cuidado: −2,5 fica entre −3 e −2.",
        explicacao: `${num(v)} fica exatamente no meio entre ${Math.floor(v)} e ${Math.ceil(v)}.`, esperadoMs: 12000,
      });
    }
    const v = c.r.int(-9, 9) || 4;
    if (c.cat === "oposto") {
      return naReta({
        enunciado: `Toque no oposto de ${v}`, expr: "", alvo: -v, min: -10, max: 10, passo: 1, tolerancia: 0.4,
        dica: "O oposto está à mesma distância do zero, do outro lado.",
        explicacao: `O oposto de ${v} é ${-v}: mesma distância do zero, do lado contrário.`, esperadoMs: 10000,
      });
    }
    return naReta({
      enunciado: `Toque na reta onde está ${v}`, expr: "", alvo: v, min: -10, max: 10, passo: 1, tolerancia: 0.4,
      dica: "Negativos ficam à esquerda do zero; quanto mais à esquerda, menor o número.",
      explicacao: `${v} fica ${v < 0 ? `${-v} casa(s) à esquerda` : `${v} casa(s) à direita`} do zero.`, esperadoMs: 9000,
    });
  },
};

const NENHUMA = "Nenhuma: está tudo certo";

export const encontreErroEquacao: Habilidade = {
  id: "erro-equacao",
  nome: "Encontre o erro na equação",
  ano: 7,
  zona: "Álgebra",
  requisitos: ["equacao-1grau"],
  categorias: ["erro-sinal", "erro-divisao", "erro-conta", "sem-erro"],
  nivelamento: false,
  gerar(c) {
    const a = c.r.int(2, 9), x = c.r.int(2, 9), b = c.r.int(1, 15), cc = a * x + b;
    const certo = cc - b;
    let rhs = certo, op = "÷", valor = x, quem = "";
    if (c.cat === "erro-sinal") { rhs = cc + b; valor = rhs / a; quem = "Linha 2"; }
    else if (c.cat === "erro-divisao") { op = "×"; valor = rhs * a; quem = "Linha 3"; }
    else if (c.cat === "erro-conta") { valor = x + c.r.pick([-1, 1, 2]); quem = "Linha 4"; }
    else quem = NENHUMA;
    const linhas = [`${a}x + ${b} = ${cc}`, `${a}x = ${num(rhs)}`, `x = ${num(rhs)} ${op} ${a}`, `x = ${num(valor)}`];
    const explicacoes: Record<string, string> = {
      "Linha 2": `Para passar +${b} para o outro lado, subtraia: ${cc} − ${b} = ${certo}, e não ${cc} + ${b}.`,
      "Linha 3": `${a}x = ${certo} pede divisão: x = ${certo} ÷ ${a}. Multiplicar não desfaz o ${a} que multiplica x.`,
      "Linha 4": `${certo} ÷ ${a} = ${x}, e não ${num(valor)}.`,
      [NENHUMA]: `Está certo: ${cc} − ${b} = ${certo} e ${certo} ÷ ${a} = ${x}. Vale conferir: ${a} × ${x} + ${b} = ${cc}.`,
    };
    return {
      formato: "escolha", enunciado: "Confira a resolução. Onde aparece o primeiro erro?", expr: "", linhas,
      resposta: quem, opcoes: ["Linha 2", "Linha 3", "Linha 4", NENHUMA],
      dica: "Refaça cada linha a partir da anterior e confira se a operação usada desfaz a que estava na equação.",
      explicacao: explicacoes[quem]!, esperadoMs: 20000,
    };
  },
};

export const encontreErroOrdem: Habilidade = {
  id: "erro-ordem",
  nome: "Encontre o erro na conta",
  ano: 6,
  zona: "Fundação",
  requisitos: ["ordem-ops"],
  categorias: ["erro", "sem-erro"],
  nivelamento: false,
  gerar(c) {
    const a = c.r.int(2, 9), b = c.r.int(2, 9), d = c.r.int(2, 9);
    const certo = a + b * d, errado = (a + b) * d;
    const erra = c.cat === "erro";
    const linhas = [`${a} + ${b} × ${d}`, erra ? `= ${a + b} × ${d}` : `= ${a} + ${b * d}`, `= ${erra ? errado : certo}`];
    return {
      formato: "escolha", enunciado: "Confira a resolução. Onde aparece o primeiro erro?", expr: "", linhas,
      resposta: erra ? "Linha 2" : NENHUMA, opcoes: ["Linha 1", "Linha 2", "Linha 3", NENHUMA],
      dica: "Multiplicação vem antes da soma. Veja qual operação foi feita primeiro.",
      explicacao: erra
        ? `Na linha 2 somou-se ${a} + ${b} antes de multiplicar. O certo é ${b} × ${d} = ${b * d} primeiro: ${a} + ${b * d} = ${certo}.`
        : `Está certo: primeiro ${b} × ${d} = ${b * d}, depois ${a} + ${b * d} = ${certo}.`,
      esperadoMs: 15000,
    };
  },
};

export const problemas6: Habilidade = {
  id: "problemas-6",
  nome: "Problemas do dia a dia",
  ano: 6,
  zona: "Problemas",
  requisitos: ["tabuada", "divisao"],
  categorias: ["multiplicacao", "divisao", "dois-passos"],
  nivelamento: false,
  gerar(c) {
    if (c.cat === "multiplicacao") {
      const [q, u] = c.r.pick([["lápis", "caixa"], ["figurinhas", "pacote"], ["bolinhas", "saco"], ["livros", "prateleira"]] as const);
      const a = c.r.int(4, 12), b = c.r.int(3, 9);
      return numerica(c, {
        enunciado: `Cada ${u} tem ${a} ${q}. Quantos ${q} há em ${b} ${u === "prateleira" ? "prateleiras" : u + "s"}?`, expr: "",
        resposta: a * b, distratores: [a + b, a * b + a, a * (b - 1), a * b - b],
        dica: `Quantidades iguais repetidas: use a multiplicação ${a} × ${b}.`, explicacao: `${a} × ${b} = ${a * b} ${q}.`, esperadoMs: 12000,
      });
    }
    if (c.cat === "divisao") {
      const g = c.r.int(3, 9), k = c.r.int(3, 9), n = g * k;
      return numerica(c, {
        enunciado: `${n} alunos serão divididos em grupos de ${g}. Quantos grupos serão formados?`, expr: "",
        resposta: k, distratores: [n - g, k + 1, k - 1, g],
        dica: `Quantos grupos de ${g} cabem em ${n}? Pense na divisão.`, explicacao: `${n} ÷ ${g} = ${k} grupos.`, esperadoMs: 12000,
      });
    }
    const a = c.r.int(3, 8), p = c.r.int(3, 9), total = c.r.pick([50, 100]), gasto = a * p;
    return numerica(c, {
      enunciado: `Ana comprou ${a} cadernos de R$ ${p} cada e pagou com uma nota de R$ ${total}. Quanto recebeu de troco?`, expr: "",
      resposta: total - gasto, distratores: [total - p, total + gasto, gasto, total - a],
      dica: `Primeiro calcule quanto ela gastou (${a} × ${p}); depois tire do valor pago.`,
      explicacao: `Gastou ${a} × ${p} = R$ ${gasto}. Troco: ${total} − ${gasto} = R$ ${total - gasto}.`, esperadoMs: 20000,
    });
  },
};
