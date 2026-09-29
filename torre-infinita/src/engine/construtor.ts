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
  },
): CorpoPergunta {
  const { resposta: bruta, distratores, tambemCorretas, passo, ...base } = d;
  const resposta = num(bruta);
  const aceitar = tambemCorretas?.map(num);
  if (c.digitar) return { ...base, formato: "digitar", resposta, aceitar };

  const proibidos = new Set([bruta, ...(tambemCorretas ?? [])].map(num));
  const naoNegativo = bruta >= 0;
  const pool: string[] = [];
  const tentar = (v: number) => {
    const s = num(v);
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
