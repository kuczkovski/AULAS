import type { Habilidade, Rng } from "../tipos";
import { classificar } from "../construtor";
import { frac, par } from "../texto";

/* Habilidades de classificar: arrastar cada item para o grupo certo. Ficam fora
   do nivelamento (formato de toque) e sempre trazem pelo menos dois itens de
   cada grupo, para o aluno não "adivinhar" pondo tudo no mesmo lado. */

const escolher = <T>(r: Rng, lista: readonly T[], n: number) => r.shuffle(lista).slice(0, n);
const lista = (xs: readonly string[]) => xs.join(", ");

const PRIMOS = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
const COMPOSTOS = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 24, 25, 26, 27, 28, 30, 33, 35, 39, 42, 45, 49];

export const classificarNumeros: Habilidade = {
  id: "classificar-numeros",
  nome: "Classificar números",
  ano: 6,
  zona: "Números",
  requisitos: ["divisibilidade"],
  categorias: ["multiplo-de-3", "multiplo-de-4", "primo-composto"],
  nivelamento: false,
  gerar(c) {
    const r = c.r;
    const enunciado = "Arraste cada número para o grupo certo";
    const esperadoMs = 25000;
    if (c.cat === "primo-composto") {
      const p = escolher(r, PRIMOS, 3), q = escolher(r, COMPOSTOS, 3);
      return classificar(c, {
        enunciado, expr: "", grupos: ["Primo", "Composto"], esperadoMs,
        itens: [...p.map((n) => ({ texto: String(n), grupo: 0 as const })), ...q.map((n) => ({ texto: String(n), grupo: 1 as const }))],
        dica: "Primo só tem dois divisores: 1 e ele mesmo. Composto tem mais de dois.",
        explicacao: `Primos: ${lista(p.map(String))}. Compostos: ${lista(q.map(String))}, pois têm outros divisores além de 1 e deles mesmos.`,
      });
    }
    const d = c.cat === "multiplo-de-3" ? 3 : 4;
    const mult = escolher(r, Array.from({ length: 15 }, (_, i) => d * (i + 2)), 3);
    const nao = escolher(r, Array.from({ length: 60 }, (_, i) => i + 5).filter((n) => n % d !== 0), 3);
    return classificar(c, {
      enunciado, expr: "", grupos: [`Múltiplo de ${d}`, `Não é múltiplo de ${d}`], esperadoMs,
      itens: [...mult.map((n) => ({ texto: String(n), grupo: 0 as const })), ...nao.map((n) => ({ texto: String(n), grupo: 1 as const }))],
      dica: d === 3 ? "Some os algarismos: se der um múltiplo de 3, o número também é." : "Veja os dois últimos algarismos: se formarem um múltiplo de 4, o número também é.",
      explicacao: `Múltiplos de ${d}: ${lista(mult.map(String))}. Os outros (${lista(nao.map(String))}) deixam resto ao dividir por ${d}.`,
    });
  },
};

export const classificarFracoes: Habilidade = {
  id: "classificar-fracoes",
  nome: "Classificar frações",
  ano: 6,
  zona: "Frações",
  requisitos: ["fracao-comparar"],
  categorias: ["comparar-com-1", "comparar-com-meio"],
  nivelamento: false,
  gerar(c) {
    const r = c.r;
    const comUm = c.cat === "comparar-com-1";
    for (;;) {
      const vistos = new Set<string>(), itens: { n: number; d: number; g: 0 | 1 }[] = [];
      while (itens.length < 6) {
        const d = r.int(3, 10), n = comUm ? r.int(1, 2 * d - 1) : r.int(1, d - 1);
        const chave = `${n}/${d}`;
        if (vistos.has(chave) || (comUm ? n === d : 2 * n === d)) continue;
        // frações equivalentes seriam confusas na lista: evita repetir o valor
        if (itens.some((x) => x.n * d === n * x.d)) continue;
        vistos.add(chave);
        itens.push({ n, d, g: (comUm ? n > d : 2 * n > d) ? 1 : 0 });
      }
      const g1 = itens.filter((x) => x.g === 1).length;
      if (g1 < 2 || g1 > 4) continue;
      const grupos: [string, string] = comUm ? ["Menor que 1", "Maior que 1"] : ["Menor que 1/2", "Maior que 1/2"];
      return classificar(c, {
        enunciado: "Arraste cada fração para o grupo certo", expr: "", grupos, esperadoMs: 25000,
        itens: itens.map((x) => ({ texto: frac(x.n, x.d), grupo: x.g })),
        dica: comUm ? "Se o numerador é menor que o denominador, a fração é menor que 1." : "Compare o dobro do numerador com o denominador: se 2 × numerador passa do denominador, é maior que 1/2.",
        explicacao: `${grupos[0]}: ${lista(itens.filter((x) => x.g === 0).map((x) => frac(x.n, x.d)))}. ${grupos[1]}: ${lista(itens.filter((x) => x.g === 1).map((x) => frac(x.n, x.d)))}.`,
      });
    }
  },
};

export const classificarInteiros: Habilidade = {
  id: "classificar-inteiros",
  nome: "Classificar pelo sinal",
  ano: 7,
  zona: "Inteiros",
  requisitos: ["inteiros-mult"],
  categorias: ["sinal-do-produto", "sinal-da-soma"],
  nivelamento: false,
  gerar(c) {
    const r = c.r;
    const produto = c.cat === "sinal-do-produto";
    for (;;) {
      const vistos = new Set<string>(), itens: { texto: string; g: 0 | 1 }[] = [];
      let guarda = 0;
      while (itens.length < 6 && guarda++ < 200) {
        const a = r.int(-9, 9), b = r.int(-9, 9);
        const valor = produto ? a * b : a + b;
        const texto = produto ? `${par(a)} × ${par(b)}` : `${par(a)} + ${par(b)}`;
        if (a === 0 || b === 0 || valor === 0 || vistos.has(texto)) continue;
        vistos.add(texto);
        itens.push({ texto, g: valor > 0 ? 0 : 1 });
      }
      const neg = itens.filter((x) => x.g === 1).length;
      if (itens.length < 6 || neg < 2 || neg > 4) continue;
      return classificar(c, {
        enunciado: produto ? "O resultado de cada multiplicação é positivo ou negativo? Arraste." : "O resultado de cada soma é positivo ou negativo? Arraste.",
        expr: "", grupos: ["Positivo", "Negativo"], esperadoMs: 30000,
        itens: itens.map((x) => ({ texto: x.texto, grupo: x.g })),
        dica: produto ? "Sinais iguais dão positivo; sinais diferentes dão negativo. Não precisa calcular." : "Na soma, vence o número de maior distância até o zero: o resultado fica com o sinal dele.",
        explicacao: `Positivos: ${lista(itens.filter((x) => x.g === 0).map((x) => x.texto))}. Negativos: ${lista(itens.filter((x) => x.g === 1).map((x) => x.texto))}.`,
      });
    }
  },
};
