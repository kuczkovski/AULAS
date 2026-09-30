import type { Habilidade, Pergunta, Rng } from "./tipos";

let contador = 0;

export function gerarPergunta(h: Habilidade, cat: string, r: Rng, digitar: boolean, reforco = false): Pergunta {
  const corpo = h.gerar({ r, cat, digitar });
  return { ...corpo, id: `${h.id}:${cat}:${++contador}`, habilidade: h.id, cat, reforco: reforco || undefined };
}

/**
 * Identidade de uma pergunta para evitar repetição dentro da rodada. Formatos
 * que compartilham enunciado (ordenar, classificar, encontre o erro) só se
 * distinguem pelos itens ou pelas linhas, por isso entram na assinatura; nas
 * perguntas de escolha as alternativas ficam de fora, senão a mesma conta com
 * outros distratores contaria como pergunta nova.
 */
export function assinaturaDe(q: Pergunta): string {
  const itens = q.formato === "ordenar" || q.formato === "classificar" ? q.opcoes?.join(",") : undefined;
  return [q.enunciado, q.expr, itens, q.linhas?.join("/")].filter((x) => x !== undefined).join("|");
}
