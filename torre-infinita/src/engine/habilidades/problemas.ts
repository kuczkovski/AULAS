import type { Habilidade } from "../tipos";
import { numerica } from "../construtor";
import { num } from "../texto";
import { TERNOS } from "./ano89";

/* Problemas contextualizados do 7º ao 9º ano. Cada categoria é uma situação do
   dia a dia que exige montar a conta antes de calcular; a explicação mostra o
   modelo (o que a situação diz, em matemática) e não só o resultado.
   Todos os itens usam substantivos masculinos para o texto ficar natural. */

const ITENS = ["tênis", "livro", "jogo", "fone de ouvido", "boné", "relógio", "celular", "ingresso"];

/** Preço múltiplo de 20 e porcentagens múltiplas de 5: o desconto sempre dá um número inteiro. */
const preco = (r: { int(a: number, b: number): number }) => 20 * r.int(2, 15);
const percentual = (r: { pick<T>(a: readonly T[]): T }) => r.pick([10, 20, 25, 30, 40, 50] as const);

export const problemas7: Habilidade = {
  id: "problemas-7",
  nome: "Problemas: porcentagem, inteiros e equações",
  ano: 7,
  zona: "Problemas",
  requisitos: ["problemas-6", "porcentagem", "razao-proporcao", "equacao-1grau"],
  categorias: ["desconto", "aumento", "temperatura", "equacao", "escala"],
  nivelamento: false,
  gerar(c) {
    const r = c.r;
    if (c.cat === "desconto" || c.cat === "aumento") {
      const P = preco(r), p = percentual(r), v = (P * p) / 100;
      const desconto = c.cat === "desconto";
      const item = r.pick(ITENS);
      const res = desconto ? P - v : P + v;
      return numerica(c, {
        enunciado: desconto
          ? `O ${item} custava R$ ${P}. Na promoção, ganhou ${p}% de desconto. Quanto passou a custar, em reais?`
          : `O ${item} custava R$ ${P} e sofreu um aumento de ${p}%. Qual é o novo preço, em reais?`,
        expr: "", resposta: res,
        distratores: [v, desconto ? P + v : P - v, P - p, P * (100 - p) / 10, P + p],
        dica: desconto ? `Primeiro ache quanto vale o desconto (${p}% de ${P}); depois tire esse valor do preço.` : `Primeiro ache quanto vale o aumento (${p}% de ${P}); depois some ao preço.`,
        explicacao: `${p}% de ${P} = ${v}. ${desconto ? `Preço final: ${P} − ${v}` : `Novo preço: ${P} + ${v}`} = R$ ${res}.`,
        esperadoMs: 30000,
      });
    }
    if (c.cat === "temperatura") {
      const tipo = r.int(0, 2);
      if (tipo === 0) {
        const t0 = r.int(-8, 6), d = r.int(3, 12), sobe = r.chance(0.5), res = sobe ? t0 + d : t0 - d;
        return numerica(c, {
          enunciado: `De manhã, o termômetro marcava ${t0} °C. À tarde, a temperatura ${sobe ? "subiu" : "caiu"} ${d} °C. Qual foi a temperatura à tarde?`,
          expr: "", resposta: res, distratores: [-res, sobe ? t0 - d : t0 + d, Math.abs(t0) + d, res + 2, res - 2],
          dica: `${sobe ? "Subir" : "Cair"} significa ${sobe ? "somar" : "subtrair"}. Cuidado com o sinal de ${t0}.`,
          explicacao: `${t0} ${sobe ? "+" : "−"} ${d} = ${res} °C.`, esperadoMs: 25000,
        });
      }
      if (tipo === 1) {
        const dev = r.int(20, 90), dep = r.int(20, 90), res = dep - dev;
        return numerica(c, {
          enunciado: `Lia devia R$ ${dev} no banco e depositou R$ ${dep}. Qual é o saldo da conta? (Use o sinal de menos se ela ainda ficar devendo.)`,
          expr: "", resposta: res, distratores: [-res, dev + dep, dev - dep === res ? res + 10 : dev - dep, res + 10, res - 10],
          dica: "Dívida é número negativo. Some o depósito à dívida: −dívida + depósito.",
          explicacao: `Saldo = −${dev} + ${dep} = ${res}.`, esperadoMs: 25000,
        });
      }
      const fundo = r.int(6, 20), sobe = r.int(2, 9), res = -fundo + sobe;
      return numerica(c, {
        enunciado: `Um mergulhador estava na posição −${fundo} m (abaixo do nível do mar) e subiu ${sobe} m. Em que posição ficou?`,
        expr: "", resposta: res, distratores: [-res, -fundo - sobe, fundo + sobe, res + 1, res - 1],
        dica: "Subir aproxima do zero: some a subida à posição negativa.",
        explicacao: `−${fundo} + ${sobe} = ${res} m.`, esperadoMs: 25000,
      });
    }
    if (c.cat === "equacao") {
      if (r.chance(0.5)) {
        const a = r.int(2, 6), b = r.int(1, 12), x = r.int(2, 12), cc = a * x + b;
        return numerica(c, {
          enunciado: `Pensei em um número, multipliquei por ${a}, somei ${b} e obtive ${cc}. Qual é o número?`,
          expr: "", resposta: x, distratores: [(cc - b) * a, cc - b, cc / a - b, x + 1, x - 1, cc - a - b],
          dica: `Chame o número de x e escreva: ${a}x + ${b} = ${cc}. Depois desfaça as operações de trás para frente.`,
          explicacao: `${a}x + ${b} = ${cc} → ${a}x = ${cc - b} → x = ${x}.`, esperadoMs: 40000,
        });
      }
      const x = r.int(10, 60), D = r.pick([4, 6, 8, 10, 12, 20]), T = 2 * x + D;
      return numerica(c, {
        enunciado: `Ana e Bia têm juntas R$ ${T}. Ana tem R$ ${D} a mais que Bia. Quanto tem Bia?`,
        expr: "", resposta: x, distratores: [T / 2, x + D, T - D, x - D > 0 ? x - D : x + 1, T / 2 + D],
        dica: "Chame de x o que Bia tem. Então Ana tem x + " + D + ". Some as duas e iguale ao total.",
        explicacao: `x + (x + ${D}) = ${T} → 2x = ${T - D} → x = ${x}. Bia tem R$ ${x}.`, esperadoMs: 40000,
      });
    }
    const e = r.pick([10, 20, 25, 50, 100]), cm = r.int(2, 9), res = e * cm;
    return numerica(c, {
      enunciado: `Em um mapa, 1 cm representa ${e} km. Duas cidades estão a ${cm} cm uma da outra no mapa. Qual é a distância real, em km?`,
      expr: "", resposta: res, distratores: [e + cm, e / cm, res + e, res - e, res * 10],
      dica: "A escala diz quanto vale 1 cm. Multiplique pelo número de centímetros.",
      explicacao: `${cm} × ${e} = ${res} km.`, esperadoMs: 25000,
    });
  },
};

export const problemas8: Habilidade = {
  id: "problemas-8",
  nome: "Problemas: juros, áreas, notação e funções",
  ano: 8,
  zona: "Problemas",
  requisitos: ["problemas-7", "valor-numerico", "notacao-cientifica"],
  categorias: ["juros", "area-perimetro", "notacao", "taxi"],
  nivelamento: false,
  gerar(c) {
    const r = c.r;
    if (c.cat === "juros") {
      const C = 100 * r.int(2, 20), i = r.pick([1, 2, 3, 4, 5, 10]), t = r.int(2, 12), J = (C * i * t) / 100;
      const pedeJuros = r.chance(0.5);
      return numerica(c, {
        enunciado: `Maria aplicou R$ ${C} a juros simples de ${i}% ao mês, por ${t} meses. ${pedeJuros ? "Quanto ela recebeu de juros, em reais?" : "Qual foi o montante (capital + juros), em reais?"}`,
        expr: "", resposta: pedeJuros ? J : C + J,
        distratores: pedeJuros ? [C + J, (C * i) / 100, J * 10, J / t, C * i * t] : [J, C + (C * i) / 100, C * i * t, C + J * 10, C - J],
        dica: `Juros simples: J = capital × taxa × tempo. Aqui: ${C} × ${i}/100 × ${t}.`,
        explicacao: `Juros por mês: ${(C * i) / 100}. Em ${t} meses: ${J}. ${pedeJuros ? "" : `Montante: ${C} + ${J} = ${C + J}.`}`, esperadoMs: 40000,
      });
    }
    if (c.cat === "area-perimetro") {
      const a = r.int(4, 20), b = r.int(3, a - 1 || 4), area = r.chance(0.5);
      return numerica(c, {
        enunciado: area
          ? `Um terreno retangular mede ${a} m por ${b} m. Quantos metros quadrados de grama são necessários para cobri-lo?`
          : `Um terreno retangular mede ${a} m por ${b} m. Quantos metros de cerca são necessários para contorná-lo por completo?`,
        expr: "", resposta: area ? a * b : 2 * (a + b),
        distratores: area ? [2 * (a + b), a + b, a * b + a, a * b - b] : [a * b, a + b, 2 * a + b, 2 * (a + b) + 2],
        dica: area ? "Cobrir a superfície é medir a ÁREA: comprimento × largura." : "Contornar é medir o PERÍMETRO: a soma de todos os lados.",
        explicacao: area ? `Área = ${a} × ${b} = ${a * b} m².` : `Perímetro = ${a} + ${b} + ${a} + ${b} = ${2 * (a + b)} m.`, esperadoMs: 30000,
      });
    }
    if (c.cat === "notacao") {
      if (r.chance(0.5)) {
        const t = r.int(2, 6), res = 3 * 10 ** 5 * t;
        return numerica(c, {
          enunciado: `A luz percorre cerca de 3 × 10⁵ km em cada segundo. Quantos quilômetros ela percorre em ${t} segundos?`,
          expr: "", resposta: res, distratores: [res * 10, res / 10, 3 * 10 ** 5 + t, 3 * 10 ** 4 * t, 3 * t], milhar: true,
          dica: `Multiplique 3 × 10⁵ por ${t}: primeiro ${3} × ${t}, depois mantenha o 10⁵.`,
          explicacao: `3 × 10⁵ × ${t} = ${3 * t} × 10⁵ = ${res.toLocaleString("pt-BR")} km.`, esperadoMs: 40000,
        });
      }
      const n = r.pick([100, 200, 250, 500, 1000]), res = n * 2 * 10 ** -3;
      return numerica(c, {
        enunciado: `Uma bactéria mede 2 × 10⁻³ mm. Se ${n} delas forem colocadas em fila, quantos milímetros a fila terá?`,
        expr: "", resposta: res, distratores: [res * 10, res / 10, n * 2, n / 2, res * 100],
        dica: "2 × 10⁻³ = 0,002. Multiplique pelo número de bactérias.",
        explicacao: `0,002 × ${n} = ${num(res)} mm.`, passo: 0.1, esperadoMs: 40000,
      });
    }
    const f = r.pick([4, 5, 6, 8, 10]), v = r.pick([2, 3, 4, 5]), k = r.int(4, 15);
    if (r.chance(0.5)) {
      const res = f + v * k;
      return numerica(c, {
        enunciado: `Uma corrida de táxi custa R$ ${f} de taxa fixa mais R$ ${v} por quilômetro rodado. Quanto custa uma corrida de ${k} km?`,
        expr: "", resposta: res, distratores: [(f + v) * k, f * k + v, f + v + k, v * k, res + f],
        dica: `Custo = ${f} + ${v} × km. Troque km por ${k}.`, explicacao: `${f} + ${v} × ${k} = ${f} + ${v * k} = R$ ${res}.`, esperadoMs: 35000,
      });
    }
    const total = f + v * k;
    return numerica(c, {
      enunciado: `Uma corrida de táxi custa R$ ${f} de taxa fixa mais R$ ${v} por quilômetro rodado. Paguei R$ ${total}. Quantos quilômetros rodei?`,
      expr: "", resposta: k, distratores: [total / v, total - f, (total - f) / (v + 1), k + 1, k - 1],
      dica: `Escreva ${f} + ${v}x = ${total}. Tire a taxa fixa e depois divida por ${v}.`,
      explicacao: `${f} + ${v}x = ${total} → ${v}x = ${total - f} → x = ${k} km.`, esperadoMs: 40000,
    });
  },
};

export const problemas9: Habilidade = {
  id: "problemas-9",
  nome: "Problemas: Pitágoras, dados, chance e áreas",
  ano: 9,
  zona: "Problemas",
  requisitos: ["problemas-8", "pitagoras", "estatistica", "equacao-2grau"],
  categorias: ["pitagoras", "media-meta", "probabilidade", "area-2grau"],
  nivelamento: false,
  gerar(c) {
    const r = c.r;
    if (c.cat === "pitagoras") {
      const [a0, b0, h0] = r.pick(TERNOS), k = a0 <= 5 ? r.int(1, 3) : 1;
      const [a, b, h] = [a0 * k, b0 * k, h0 * k];
      if (r.chance(0.5)) {
        return numerica(c, {
          enunciado: `Uma escada de ${h} m está apoiada em uma parede, com o pé a ${a} m da base. A que altura da parede a escada chega?`,
          expr: "", resposta: b, distratores: [h - a, h + a, h * h - a * a, b + 1, b - 1],
          dica: "Parede, chão e escada formam um triângulo retângulo. A escada é a hipotenusa.",
          explicacao: `${b}² = ${h}² − ${a}² = ${h * h} − ${a * a} = ${b * b}, então a altura é ${b} m.`, esperadoMs: 45000,
        });
      }
      return numerica(c, {
        enunciado: `Um campo retangular mede ${a} m por ${b} m. Um atleta o atravessa pela diagonal. Quantos metros ele percorre?`,
        expr: "", resposta: h, distratores: [a + b, a * a + b * b, b - a, h + 1, h - 1],
        dica: "A diagonal é a hipotenusa do triângulo formado pelos dois lados.",
        explicacao: `${a}² + ${b}² = ${a * a + b * b}, e √${a * a + b * b} = ${h} m.`, esperadoMs: 45000,
      });
    }
    if (c.cat === "media-meta") {
      for (;;) {
        const notas = Array.from({ length: 4 }, () => r.int(4, 10)), alvo = r.pick([6, 7, 8]);
        const soma = notas.reduce((s, x) => s + x, 0), falta = 5 * alvo - soma;
        if (falta < 3 || falta > 10) continue;
        return numerica(c, {
          enunciado: `Pedro tirou ${notas.join(", ")} nas quatro primeiras provas. Que nota ele precisa tirar na quinta prova para ficar com média ${alvo}?`,
          expr: "", resposta: falta, distratores: [alvo, Math.round(soma / 4), 5 * alvo, falta + 1, falta - 1],
          dica: `Para média ${alvo} em 5 provas, a soma de todas deve ser 5 × ${alvo}. Veja quanto falta.`,
          explicacao: `Soma necessária: 5 × ${alvo} = ${5 * alvo}. Ele já tem ${soma}. Faltam ${5 * alvo} − ${soma} = ${falta}.`, esperadoMs: 45000,
        });
      }
    }
    if (c.cat === "probabilidade") {
      const total = r.pick([4, 5, 10, 20, 25, 50]), v = r.int(1, total - 1), p = (v * 100) / total;
      return numerica(c, {
        enunciado: `Uma urna tem ${v} ${v === 1 ? "bola vermelha" : "bolas vermelhas"} e ${total - v} ${total - v === 1 ? "azul" : "azuis"}. Sem olhar, uma bola é sorteada. Qual é a chance, em porcentagem, de sair uma vermelha?`,
        expr: "", resposta: p, distratores: [100 - p, v, total - v, p + 10, p > 10 ? p - 10 : p + 20],
        dica: "Chance = casos favoráveis ÷ total de casos. Depois passe para porcentagem.",
        explicacao: `${v} de ${total} bolas: ${v}/${total} = ${num(p)}%.`, esperadoMs: 35000,
      });
    }
    const x = r.int(3, 12), k = r.pick([1, 2, 3, 4]), A = x * (x + k);
    return numerica(c, {
      enunciado: `Um retângulo tem área de ${A} m² e um lado ${k === 1 ? "1 metro maior" : `${k} metros maior`} que o outro. Qual é a medida do lado menor, em metros?`,
      expr: "", resposta: x, distratores: [x + k, A / k, x - 1, x + 1, Math.round(Math.sqrt(A))],
      dica: `Chame o lado menor de x. O outro é x + ${k}, e a área é x · (x + ${k}) = ${A}. Procure dois números que diferem ${k} e multiplicam ${A}.`,
      explicacao: `x · (x + ${k}) = ${A} → x² + ${k === 1 ? "" : k}x − ${A} = 0. Os lados são ${x} e ${x + k}, pois ${x} × ${x + k} = ${A}.`, esperadoMs: 60000,
    });
  },
};
