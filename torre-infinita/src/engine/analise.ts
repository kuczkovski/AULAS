import { dominio, dominioHabilidade } from "./dominio";
import { POR_ID } from "./habilidades";
import { situacao, type Situacao } from "./selecao";
import type { EstadoAluno } from "./tipos";

export interface Dificuldade {
  habilidade: string;
  nome: string;
  cat: string;
  rotulo: string;
  /** Domínio médio entre os alunos que já viram esta categoria. */
  media: number;
  alunos: number;
}

export function rotuloCategoria(habilidade: string, cat: string): string {
  if (habilidade === "tabuada") return cat.replace("x", " × ");
  if (habilidade === "divisao" && cat.startsWith("por")) return `divisão por ${cat.slice(3)}`;
  return cat
    .replace(/\bsr\b/g, "sem reserva")
    .replace(/\bcr\b/g, "com reserva")
    .replace(/-/g, " ");
}

/**
 * Categorias em que a turma mais tropeça: domínio médio mais baixo entre
 * quem já a viu. `minAlunos` evita que um único aluno defina a lista.
 */
export function dificuldadesDaTurma(estados: EstadoAluno[], topo = 6, minAlunos = 2): Dificuldade[] {
  const acc = new Map<string, { soma: number; n: number }>();
  for (const e of estados) {
    for (const [chave, f] of Object.entries(e.fatos)) {
      if (!f.hn) continue;
      const a = acc.get(chave) ?? { soma: 0, n: 0 };
      a.soma += dominio(f, 6000);
      a.n++;
      acc.set(chave, a);
    }
  }
  const limite = Math.min(minAlunos, Math.max(1, estados.length));
  return [...acc.entries()]
    .filter(([, a]) => a.n >= limite)
    .map(([chave, a]) => {
      const [habilidade, cat] = chave.split("|") as [string, string];
      return {
        habilidade,
        nome: POR_ID.get(habilidade)?.nome ?? habilidade,
        cat,
        rotulo: rotuloCategoria(habilidade, cat),
        media: a.soma / a.n,
        alunos: a.n,
      };
    })
    .sort((x, y) => x.media - y.media)
    .slice(0, topo);
}

export interface CelulaMapa {
  situacao: Situacao;
  /** 0 a 1, ou null se ainda não há dados. */
  d: number | null;
}

export function celulaDoMapa(e: EstadoAluno | null, habilidade: string): CelulaMapa {
  const h = POR_ID.get(habilidade);
  if (!e || !h) return { situacao: "bloqueada", d: null };
  const dom = dominioHabilidade(h, e.fatos);
  return { situacao: situacao(h, e), d: dom ? dom.d : null };
}

export type Alerta = "nunca-jogou" | "travado" | "parado";

export function alertasDoAluno(e: EstadoAluno | null, ultimaAtividade: string | null, agora = Date.now()): Alerta[] {
  if (!e || !e.respondidas) return ["nunca-jogou"];
  const out: Alerta[] = [];
  if (e.quedas >= 2) out.push("travado");
  const ult = ultimaAtividade ? Date.parse(ultimaAtividade) : NaN;
  if (Number.isFinite(ult) && agora - ult > 7 * 86_400_000) out.push("parado");
  return out;
}
