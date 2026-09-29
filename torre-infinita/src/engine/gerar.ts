import type { Habilidade, Pergunta, Rng } from "./tipos";

let contador = 0;

export function gerarPergunta(h: Habilidade, cat: string, r: Rng, digitar: boolean, reforco = false): Pergunta {
  const corpo = h.gerar({ r, cat, digitar });
  return { ...corpo, id: `${h.id}:${cat}:${++contador}`, habilidade: h.id, cat, reforco: reforco || undefined };
}
