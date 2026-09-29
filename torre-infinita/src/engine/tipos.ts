export type Ano = 6 | 7 | 8 | 9;
export type Formato = "escolha" | "digitar" | "vf" | "ordenar" | "reta" | "classificar";

/** Modelo visual opcional exibido junto da pergunta ou da explicação. */
export type Visual =
  | { tipo: "barra"; num: number; den: number }
  | { tipo: "area"; a: number; b: number }
  | { tipo: "reta"; min: number; max: number; marca: number };

export interface Pergunta {
  id: string;
  habilidade: string;
  /** Categoria (fato) dentro da habilidade: é a unidade do modelo de domínio. */
  cat: string;
  formato: Formato;
  /** Frase curta acima da expressão ("Quanto é", "Simplifique"...). */
  enunciado: string;
  /** Expressão em destaque ("7 × 8"). */
  expr: string;
  /** Resposta canônica, sempre em texto ("-5", "3/4", "0,75"). */
  resposta: string;
  /** Respostas equivalentes aceitas no formato "digitar". */
  aceitar?: string[];
  /**
   * Alternativas já embaralhadas. Em "escolha" e "vf" o aluno marca uma; em
   * "ordenar" são os itens a colocar em ordem (a resposta os junta com "|").
   */
  opcoes?: string[];
  /**
   * Formato "classificar": os dois grupos que recebem os itens de `opcoes`.
   * A resposta tem um dígito por item, na ordem de `opcoes`: "0" para o primeiro grupo, "1" para o segundo.
   */
  grupos?: [string, string];
  /** Linhas de uma resolução ("encontre o erro"), exibidas numeradas. */
  linhas?: string[];
  /** Formato "reta": o aluno toca na reta; vale a resposta dentro da tolerância. */
  reta?: { min: number; max: number; passo: number; tolerancia: number };
  /** Pista que ensina o caminho sem entregar o número. */
  dica: string;
  /** Explicação mostrada depois de um erro. */
  explicacao: string;
  visual?: Visual;
  /** Mostra o modelo visual já durante a pergunta (senão só na explicação). */
  verVisualAntes?: boolean;
  /** Tempo esperado de um aluno fluente, em ms. Alimenta o modelo de domínio. */
  esperadoMs: number;
  /** Segunda chance de uma pergunta errada: não gasta vida nem rende pontos. */
  reforco?: boolean;
}

export interface Contexto {
  r: Rng;
  cat: string;
  /** O aluno já está fluente nesta categoria: prefira digitar a resposta. */
  digitar: boolean;
}

export type CorpoPergunta = Omit<Pergunta, "id" | "habilidade" | "cat">;

export interface Habilidade {
  id: string;
  nome: string;
  ano: Ano;
  /** Agrupamento na torre. */
  zona: string;
  requisitos: string[];
  categorias: string[];
  /** Falso para habilidades que só fazem sentido na prática (formatos com toque). */
  nivelamento?: boolean;
  gerar(c: Contexto): CorpoPergunta;
}

export interface Rng {
  /** Float em [0, 1). */
  next(): number;
  /** Inteiro em [lo, hi]. */
  int(lo: number, hi: number): number;
  pick<T>(arr: readonly T[]): T;
  shuffle<T>(arr: readonly T[]): T[];
  chance(p: number): boolean;
}

/** Registro do que já se observou de uma categoria. */
export interface Fato {
  seen: number;
  wrong: number;
  n: number;
  sumT: number;
  /** Últimos 8 resultados em bits; o mais recente no bit 0. */
  h: number;
  hn: number;
  /** Acertos logo depois de um erro. */
  rec: number;
  /** Contador de rodadas na última vez em que apareceu. */
  last: number;
}

export interface Avatar {
  cor: number;
  forma: number;
  acessorio: number;
}

export interface EstadoAluno {
  v: 2;
  ano: Ano;
  apelido: string;
  avatar: Avatar;
  xp: number;
  nivel: number;
  andar: number;
  quedas: number;
  fatos: Record<string, Fato>;
  /** Zonas cujo chefe já foi derrotado. */
  chefes: string[];
  /** Habilidades que o nivelamento marcou como conhecidas. */
  colocadas: string[];
  nivelamentoFeito: boolean;
  dias: string[];
  rodadas: number;
  melhorSequencia: number;
  respondidas: number;
  acertos: number;
  som: boolean;
  calmo: boolean;
}
