/**
 * Banco de 20 questões da sequência diagnóstica (documento "Banco de 20 exercícios diagnósticos").
 *
 * Este arquivo vai para o navegador do aluno, por isso NÃO contém o gabarito:
 * a correção é feita no banco (tabela `gabarito`, sem acesso público).
 * O gabarito, usado só em testes e no modo local, fica em `gabarito.ts`.
 *
 * O documento original tem cinco dimensões; a D5 (integração arco × ângulo, Q19–Q20)
 * foi incorporada à D4, que fica com Q16–Q20.
 */

export type Dim = "D1" | "D2" | "D3" | "D4";
export const DIMS: Dim[] = ["D1", "D2", "D3", "D4"];

/** Figuras de apoio, desenhadas em SVG (ver components/Figura.tsx). Ângulos em graus, de cima, no sentido horário. */
export type Figura =
  | { tipo: "raio" }
  | { tipo: "corda" }
  | { tipo: "tangente" }
  | { tipo: "secante" }
  | { tipo: "partes"; n: number }
  | { tipo: "angulo"; graus: number }
  | { tipo: "setores"; angulos: number[] };

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
  D1: { nome: "Linguagem e elementos geométricos", bloco: "Bloco 1 — Linguagem geométrica" },
  D2: { nome: "Circunferência e seus elementos", bloco: "Bloco 2 — Circunferência" },
  D3: { nome: "Ângulos e rotações", bloco: "Bloco 3 — Ângulos" },
  D4: { nome: "Frações da volta e ponte para o arco", bloco: "Bloco 4 — Frações da volta e arcos" },
};

export const QUESTOES: Questao[] = [
  { id: "Q1", dim: "D1", tipo: "multipla", enunciado: "Em uma figura aparecem os pontos A e B ligados por uma linha reta limitada pelos dois pontos. O objeto geométrico representado é:", opcoes: ["Reta", "Semirreta", "Segmento de reta", "Circunferência"] },
  { id: "Q2", dim: "D1", tipo: "multipla", enunciado: "Em uma circunferência de centro O, o ponto A pertence à circunferência. O segmento OA recebe o nome de:", opcoes: ["Corda", "Raio", "Diâmetro", "Arco"], figura: { tipo: "raio" } },
  { id: "Q3", dim: "D1", tipo: "multipla", enunciado: "Uma roda possui raio de 18 cm. Qual é o seu diâmetro?", opcoes: ["9 cm", "18 cm", "36 cm", "324 cm"] },
  { id: "Q4", dim: "D1", tipo: "multipla", enunciado: "Uma tampa circular possui diâmetro de 30 cm. Qual é o raio dessa tampa?", opcoes: ["10 cm", "15 cm", "30 cm", "60 cm"] },
  { id: "Q5", dim: "D1", tipo: "multipla", enunciado: "Os pontos A e B pertencem a uma circunferência. O segmento AB liga esses dois pontos, mas não passa pelo centro. Esse segmento é:", opcoes: ["Raio", "Corda", "Arco", "Tangente"], figura: { tipo: "corda" } },
  { id: "Q6", dim: "D2", tipo: "multipla", enunciado: "Uma praça possui uma faixa pintada apenas ao longo de sua borda circular. A faixa representa geometricamente:", opcoes: ["O círculo", "A circunferência", "O raio", "O centro"] },
  { id: "Q7", dim: "D2", tipo: "multipla", enunciado: "Uma pizza inteira, considerando toda a superfície delimitada pela borda, é melhor representada geometricamente por:", opcoes: ["Uma circunferência", "Um raio", "Um círculo", "Uma corda"] },
  { id: "Q8", dim: "D2", tipo: "multipla", enunciado: "Qual afirmação é sempre verdadeira?", opcoes: ["Toda corda é um diâmetro", "Todo raio é uma corda", "Todo diâmetro é uma corda", "Todo diâmetro é um raio"] },
  { id: "Q9", dim: "D2", tipo: "multipla", enunciado: "Uma reta toca uma circunferência em exatamente um ponto. Essa reta é chamada de:", opcoes: ["Corda", "Secante", "Tangente", "Diâmetro"], figura: { tipo: "tangente" } },
  { id: "Q10", dim: "D2", tipo: "multipla", enunciado: "Uma estrada retilínea atravessa uma rotatória circular, cruzando sua borda em dois pontos distintos. Considerando apenas a representação geométrica, essa reta se comporta como:", opcoes: ["Tangente", "Secante", "Raio", "Arco"], figura: { tipo: "secante" } },
  { id: "Q11", dim: "D3", tipo: "multipla", enunciado: "Um ângulo mede 42°. Ele é:", opcoes: ["Agudo", "Reto", "Obtuso", "Raso"] },
  { id: "Q12", dim: "D3", tipo: "multipla", enunciado: "Qual das medidas abaixo representa um ângulo obtuso?", opcoes: ["45°", "90°", "135°", "180°"] },
  { id: "Q13", dim: "D3", tipo: "multipla", enunciado: "Um ponteiro gira até retornar exatamente à posição inicial depois de uma volta completa. Qual foi a rotação realizada?", opcoes: ["90°", "180°", "270°", "360°"] },
  { id: "Q14", dim: "D3", tipo: "numerica", enunciado: "Uma câmera de segurança está inicialmente voltada para o norte. Ela gira exatamente meia volta. Qual é a medida da rotação?" },
  { id: "Q15", dim: "D3", tipo: "numerica", enunciado: "Uma porta giratória executa um quarto de uma volta completa. Determine o ângulo correspondente." },
  { id: "Q16", dim: "D4", tipo: "multipla", enunciado: "Uma circunferência foi dividida em três partes iguais. Qual medida angular corresponde a cada parte?", opcoes: ["90°", "120°", "180°", "240°"], figura: { tipo: "partes", n: 3 } },
  { id: "Q17", dim: "D4", tipo: "numerica", enunciado: "Um mostrador circular foi dividido em seis setores iguais. Qual é o ângulo correspondente a cada setor?", figura: { tipo: "partes", n: 6 } },
  { id: "Q18", dim: "D4", tipo: "numerica", enunciado: "Um ponteiro percorreu 3/4 de uma volta completa. Quantos graus ele percorreu?" },
  { id: "Q19", dim: "D4", tipo: "multipla", enunciado: "Em uma circunferência de centro O, dois raios OA e OB formam um ângulo de 90°. O arco menor entre A e B corresponde a qual fração da circunferência?", opcoes: ["1/2", "1/3", "1/4", "3/4"], figura: { tipo: "angulo", graus: 90 } },
  { id: "Q20", dim: "D4", tipo: "multipla", enunciado: "Uma pista circular foi dividida em quatro trechos. Três deles correspondem a 70°, 110° e 95°. Qual deve ser a medida do quarto trecho?", opcoes: ["75°", "80°", "85°", "95°"], figura: { tipo: "setores", angulos: [70, 110, 95] } },
];

export const QUESTAO_POR_ID: Record<string, Questao> = Object.fromEntries(QUESTOES.map(q => [q.id, q]));
export const TOTAL_QUESTOES = QUESTOES.length;

export const QUESTOES_POR_DIM: Record<Dim, string[]> = {
  D1: [], D2: [], D3: [], D4: [],
};
for (const q of QUESTOES) QUESTOES_POR_DIM[q.dim].push(q.id);

/** Autoavaliação metacognitiva. `questoes` liga cada afirmação às questões que a testam. */
export interface ItemAuto { id: string; texto: string; questoes: string[] }
export const ITENS_AUTO: ItemAuto[] = [
  { id: "A1", texto: "Sei diferenciar círculo e circunferência.", questoes: ["Q6", "Q7"] },
  { id: "A2", texto: "Sei identificar um raio.", questoes: ["Q2", "Q4"] },
  { id: "A3", texto: "Sei identificar um diâmetro.", questoes: ["Q3", "Q8"] },
  { id: "A4", texto: "Sei identificar uma corda.", questoes: ["Q5", "Q8"] },
  { id: "A5", texto: "Sei quanto mede uma volta completa.", questoes: ["Q13", "Q14"] },
  { id: "A6", texto: "Consigo calcular uma parte de uma volta.", questoes: ["Q15", "Q16", "Q17", "Q18"] },
  { id: "A7", texto: "Consigo relacionar uma figura circular com ângulos.", questoes: ["Q19", "Q20"] },
];

export const ESCALA_AUTO = [
  { valor: 1, texto: "Não sei ainda" },
  { valor: 2, texto: "Tenho dúvida" },
  { valor: 3, texto: "Acho que sei" },
  { valor: 4, texto: "Sei e consigo explicar" },
];
