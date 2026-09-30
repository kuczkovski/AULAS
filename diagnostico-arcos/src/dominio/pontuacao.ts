import { DIMS, QUESTOES_POR_DIM, type Dim } from "./questoes";

/** Normaliza uma resposta numérica ("180°", "90 graus", "1,5") para "180", "90", "1.5"; `null` se inválida. */
export function normalizarNumero(texto: string): string | null {
  let v = texto.trim().toLowerCase();
  v = v.replace(/(°|º|graus?|deg)\s*$/, "").trim().replace(",", ".");
  if (!/^[0-9]{1,4}(\.[0-9]{1,4})?$/.test(v)) return null;
  return String(Number(v));
}

export type Nivel = "consolidado" | "funcional" | "fragil" | "recomposicao";

/** Régua diagnóstica do roteiro (seção 7). */
export function nivelDe(pct: number): Nivel {
  if (pct >= 80) return "consolidado";
  if (pct >= 60) return "funcional";
  if (pct >= 40) return "fragil";
  return "recomposicao";
}

export const NIVEIS: Record<Nivel, { rotulo: string; aluno: string; faixa: string }> = {
  consolidado: { rotulo: "Conhecimento consolidado", aluno: "Já está consolidado", faixa: "80–100%" },
  funcional: { rotulo: "Funcional, com pequenas lacunas", aluno: "Está quase lá", faixa: "60–79%" },
  fragil: { rotulo: "Conhecimento frágil", aluno: "Vamos fortalecer em aula", faixa: "40–59%" },
  recomposicao: { rotulo: "Recomposição necessária", aluno: "Vamos retomar em aula", faixa: "abaixo de 40%" },
};

export const pct = (acertos: number, total: number) => (total === 0 ? 0 : (100 * acertos) / total);

export interface ResultadoDim { acertos: number; total: number; pct: number; nivel: Nivel }

/** Desempenho por dimensão. Questão sem resposta conta como não acertada. */
export function resultadoPorDimensao(acertou: Record<string, boolean | null | undefined>): Record<Dim, ResultadoDim> {
  const out = {} as Record<Dim, ResultadoDim>;
  for (const d of DIMS) {
    const ids = QUESTOES_POR_DIM[d];
    const acertos = ids.filter(id => acertou[id] === true).length;
    const p = pct(acertos, ids.length);
    out[d] = { acertos, total: ids.length, pct: p, nivel: nivelDe(p) };
  }
  return out;
}
