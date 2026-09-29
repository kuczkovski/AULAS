import type { Contexto, CorpoPergunta, Visual } from "./tipos";
import { num } from "./texto";

interface Base {
  enunciado: string;
  expr: string;
  dica: string;
  explicacao: string;
  esperadoMs: number;
  visual?: Visual;
  verVisualAntes?: boolean;
}

/** Pergunta de resposta numérica: vira "digitar" quando o aluno já está fluente. */
export function numerica(
  c: Contexto,
  d: Base & {
    resposta: number;
    distratores: number[];
    /** Outras respostas também corretas (ex.: as duas raízes de uma equação). */
    tambemCorretas?: number[];
    passo?: number;
    /** Números grandes ganham ponto de milhar nas alternativas (600.000). Digitar segue sem separador. */
    milhar?: boolean;
  },
): CorpoPergunta {
  const { resposta: bruta, distratores, tambemCorretas, passo, milhar, ...base } = d;
  const fm = (v: number) => (milhar && Math.abs(v) >= 10000 ? v.toLocaleString("pt-BR") : num(v));
  const resposta = c.digitar ? num(bruta) : fm(bruta);
  const aceitar = tambemCorretas?.map(num);
  if (c.digitar) return { ...base, formato: "digitar", resposta, aceitar };

  const proibidos = new Set([bruta, ...(tambemCorretas ?? [])].map(fm));
  const naoNegativo = bruta >= 0;
  const pool: string[] = [];
  const tentar = (v: number) => {
    const s = fm(v);
    if (proibidos.has(s) || pool.includes(s) || (naoNegativo && v < 0) || (bruta >= 5 && v === 0)) return;
    pool.push(s);
  };
  c.r.shuffle(distratores).forEach(tentar);
  const p = passo ?? 1;
  for (let k = 1; pool.length < 3 && k < 60; k++) tentar(bruta + (c.r.chance(0.5) ? 1 : -1) * k * p);
  return { ...base, formato: "escolha", resposta, aceitar, opcoes: c.r.shuffle([resposta, ...pool.slice(0, 3)]) };
}

/** Pergunta cuja resposta é um texto (fração, intervalo...). */
export function textual(
  c: Contexto,
  d: Base & { resposta: string; distratores: string[]; digitavel?: boolean; aceitar?: string[] },
): CorpoPergunta {
  const { resposta, distratores, digitavel, aceitar, ...base } = d;
  if (digitavel && c.digitar) return { ...base, formato: "digitar", resposta, aceitar };
  const pool = [...new Set(distratores)].filter((x) => x !== resposta && !(aceitar ?? []).includes(x));
  return {
    ...base,
    formato: "escolha",
    resposta,
    aceitar,
    opcoes: c.r.shuffle([resposta, ...c.r.shuffle(pool).slice(0, 3)]),
  };
}

export function verdadeiroFalso(d: Base & { verdadeiro: boolean }): CorpoPergunta {
  const { verdadeiro, ...base } = d;
  return { ...base, formato: "vf", resposta: verdadeiro ? "Verdadeiro" : "Falso", opcoes: ["Verdadeiro", "Falso"] };
}

/** Colocar itens em ordem. `crescente` traz os itens já na ordem correta. */
export function ordenar(c: Contexto, d: Base & { crescente: string[] }): CorpoPergunta {
  const { crescente, ...base } = d;
  let mistura = c.r.shuffle(crescente);
  // evita entregar a resposta de graça
  for (let t = 0; t < 10 && mistura.join("|") === crescente.join("|"); t++) mistura = c.r.shuffle(crescente);
  return { ...base, formato: "ordenar", resposta: crescente.join("|"), opcoes: mistura };
}

/** Tocar na reta numérica: vale o ponto dentro da tolerância. */
export function naReta(d: Base & { alvo: number; min: number; max: number; passo: number; tolerancia?: number }): CorpoPergunta {
  const { alvo, min, max, passo, tolerancia, ...base } = d;
  return { ...base, formato: "reta", resposta: num(alvo), reta: { min, max, passo, tolerancia: tolerancia ?? passo / 2 } };
}

/** Colocar itens em dois grupos. Cada item traz o índice (0 ou 1) do grupo certo. */
export function classificar(c: Contexto, d: Base & { itens: { texto: string; grupo: 0 | 1 }[]; grupos: [string, string] }): CorpoPergunta {
  const { itens, grupos, ...base } = d;
  const mistura = c.r.shuffle(itens);
  return { ...base, formato: "classificar", grupos, opcoes: mistura.map((i) => i.texto), resposta: mistura.map((i) => String(i.grupo)).join("") };
}
