/**
 * Banco de questões da sequência diagnóstica (roteiro, seção 4).
 *
 * Este arquivo vai para o navegador do aluno, por isso NÃO contém o gabarito:
 * a correção é feita no banco (tabela `gabarito`, sem acesso público).
 * O gabarito, usado só em testes e no modo local, fica em `gabarito.ts`.
 */

export type Dim = "D1" | "D2" | "D3" | "D4";
export const DIMS: Dim[] = ["D1", "D2", "D3", "D4"];

export type Figura =
  | { tipo: "partes"; n: number }
  | { tipo: "metade" }
  | { tipo: "angulo"; graus: number };

export interface Questao {
  id: string;
  dim: Dim;
  tipo: "multipla" | "numerica";
  enunciado: string;
  opcoes?: string[];
  figura?: Figura;
}

export const TURMAS = ["1º A", "1º B", "1º C", "1º D", "1º E"] as const;
export type Turma = (typeof TURMAS)[number];

/** Duração máxima da aplicação, em segundos (igual a `duracao_prova()` no banco). */
export const DURACAO_SEGUNDOS = 60 * 60;

export const DIMENSOES: Record<Dim, { nome: string; bloco: string }> = {
  D1: { nome: "Linguagem geométrica", bloco: "Bloco 1 — Linguagem geométrica" },
  D2: { nome: "Conhecimentos sobre ângulos", bloco: "Bloco 2 — Ângulos" },
  D3: { nome: "Elementos da circunferência", bloco: "Bloco 3 — Circunferência" },
  D4: { nome: "Ponte para arcos e ângulos", bloco: "Bloco 4 — Ponte para arcos" },
};

export const QUESTOES: Questao[] = [
  { id: "Q1", dim: "D1", tipo: "multipla", enunciado: "O segmento que liga o centro de uma circunferência a qualquer ponto dela recebe qual nome?", opcoes: ["Corda", "Raio", "Diâmetro", "Arco"] },
  { id: "Q2", dim: "D1", tipo: "multipla", enunciado: "Uma circunferência tem raio de 6 cm. Qual é o seu diâmetro?", opcoes: ["3 cm", "6 cm", "12 cm", "36 cm"] },
  { id: "Q3", dim: "D1", tipo: "multipla", enunciado: "Um segmento possui as duas extremidades sobre a circunferência, mas não necessariamente passa pelo centro. Como é chamado?", opcoes: ["Raio", "Corda", "Arco", "Semirreta"] },
  { id: "Q4", dim: "D2", tipo: "multipla", enunciado: "Um ângulo de 35° é classificado como:", opcoes: ["Agudo", "Reto", "Obtuso", "Raso"] },
  { id: "Q5", dim: "D2", tipo: "multipla", enunciado: "Quantos graus correspondem a uma volta completa?", opcoes: ["90°", "180°", "270°", "360°"] },
  { id: "Q6", dim: "D2", tipo: "numerica", enunciado: "Quantos graus correspondem exatamente a meia volta?" },
  { id: "Q7", dim: "D2", tipo: "numerica", enunciado: "Uma volta completa foi dividida em quatro partes iguais. Qual é a medida angular de cada parte?" },
  { id: "Q8", dim: "D3", tipo: "multipla", enunciado: "O segmento que passa pelo centro e possui as duas extremidades na circunferência é:", opcoes: ["Raio", "Diâmetro", "Arco", "Tangente"] },
  { id: "Q9", dim: "D3", tipo: "multipla", enunciado: "Qual afirmação é correta?", opcoes: ["Todo raio é um diâmetro", "Todo diâmetro é uma corda", "Toda corda é um diâmetro", "Corda e arco são a mesma coisa"] },
  { id: "Q10", dim: "D3", tipo: "multipla", enunciado: "A linha fechada formada por todos os pontos que estão à mesma distância de um centro é chamada de:", opcoes: ["Círculo", "Circunferência", "Disco", "Diâmetro"] },
  { id: "Q11", dim: "D4", tipo: "numerica", enunciado: "Uma circunferência foi dividida em duas partes iguais. Qual medida angular corresponde a cada parte?", figura: { tipo: "partes", n: 2 } },
  { id: "Q12", dim: "D4", tipo: "numerica", enunciado: "Uma circunferência foi dividida em quatro partes iguais. Qual medida angular corresponde a cada parte?", figura: { tipo: "partes", n: 4 } },
  { id: "Q13", dim: "D4", tipo: "numerica", enunciado: "Um trecho ocupa exatamente metade de uma circunferência. Considerando uma volta completa de 360°, qual medida corresponde a esse trecho?", figura: { tipo: "metade" } },
  { id: "Q14", dim: "D4", tipo: "multipla", enunciado: "Dois raios formam, no centro da circunferência, um ângulo de 90°. Qual medida parece mais coerente para o arco compreendido entre esses raios?", opcoes: ["45°", "90°", "180°", "Não existe relação possível"], figura: { tipo: "angulo", graus: 90 } },
  { id: "Q15", dim: "D4", tipo: "numerica", enunciado: "Uma circunferência foi dividida em três partes exatamente iguais. Qual é a medida angular correspondente a cada parte?", figura: { tipo: "partes", n: 3 } },
];

export const QUESTAO_POR_ID: Record<string, Questao> = Object.fromEntries(QUESTOES.map(q => [q.id, q]));
export const TOTAL_QUESTOES = QUESTOES.length;

export const QUESTOES_POR_DIM: Record<Dim, string[]> = {
  D1: [], D2: [], D3: [], D4: [],
};
for (const q of QUESTOES) QUESTOES_POR_DIM[q.dim].push(q.id);

/** Autoavaliação metacognitiva (roteiro, seção 5). `questoes` liga cada afirmação às questões que a testam. */
export interface ItemAuto { id: string; texto: string; questoes: string[] }
export const ITENS_AUTO: ItemAuto[] = [
  { id: "A1", texto: "Sei diferenciar círculo e circunferência.", questoes: ["Q10"] },
  { id: "A2", texto: "Sei identificar um raio.", questoes: ["Q1", "Q2"] },
  { id: "A3", texto: "Sei identificar um diâmetro.", questoes: ["Q2", "Q8"] },
  { id: "A4", texto: "Sei identificar uma corda.", questoes: ["Q3", "Q9"] },
  { id: "A5", texto: "Sei quanto mede uma volta completa.", questoes: ["Q5", "Q6"] },
  { id: "A6", texto: "Consigo calcular uma parte de uma volta.", questoes: ["Q7", "Q11", "Q12", "Q13", "Q15"] },
  { id: "A7", texto: "Consigo relacionar uma figura circular com ângulos.", questoes: ["Q14"] },
];

export const ESCALA_AUTO = [
  { valor: 1, texto: "Não sei ainda" },
  { valor: 2, texto: "Tenho dúvida" },
  { valor: 3, texto: "Acho que sei" },
  { valor: 4, texto: "Sei e consigo explicar" },
];
