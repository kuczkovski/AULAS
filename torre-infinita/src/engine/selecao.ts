import { chaveFato, consolidada, dominio, dominioHabilidade, pesoCategoria } from "./dominio";
import { gerarPergunta } from "./gerar";
import { HABILIDADES } from "./habilidades";
import type { EstadoAluno, Habilidade, Pergunta, Rng } from "./tipos";

export type TipoRodada = "treino" | "revisao" | "chefe";

export const CONFIG_RODADA: Record<TipoRodada, { n: number; vidas: number; mult: number; rotulo: string }> = {
  treino: { n: 10, vidas: 3, mult: 1, rotulo: "Treino" },
  revisao: { n: 10, vidas: 3, mult: 1, rotulo: "Revisão" },
  chefe: { n: 12, vidas: 4, mult: 1.5, rotulo: "Chefe" },
};

export function tipoDoAndar(andar: number): TipoRodada {
  return andar % 5 === 0 ? "chefe" : andar % 4 === 0 ? "revisao" : "treino";
}

export type Situacao = "bloqueada" | "nova" | "aprendendo" | "consolidada";

export function situacao(h: Habilidade, e: EstadoAluno): Situacao {
  if (h.ano > e.ano) return "bloqueada";
  const livre = h.requisitos.every((id) => {
    const r = HABILIDADES.find((x) => x.id === id);
    return !r || consolidada(r, e.fatos, e.colocadas);
  });
  if (!livre) return "bloqueada";
  const d = dominioHabilidade(h, e.fatos);
  /* o nivelamento libera o conteúdo, mas a prática manda: quem erra muito uma
     habilidade "colocada" volta a ser tratado como aprendendo */
  if (d && d.observadas >= 3 && d.d < 0.5) return "aprendendo";
  if (consolidada(h, e.fatos, e.colocadas)) return "consolidada";
  return d ? "aprendendo" : "nova";
}

export const desbloqueadas = (e: EstadoAluno) => HABILIDADES.filter((h) => situacao(h, e) !== "bloqueada");

function pesoHabilidade(h: Habilidade, e: EstadoAluno, sit: Situacao): number {
  const d = dominioHabilidade(h, e.fatos);
  if (sit === "nova") return 3;
  if (sit === "aprendendo") return 2 + 3 * (1 - (d?.d ?? 0));
  const ultima = Math.max(...h.categorias.map((c) => e.fatos[chaveFato(h.id, c)]?.last ?? -99));
  return 0.8 + 1.2 * (1 - (d?.d ?? 1)) + (e.rodadas - ultima > 6 ? 1 : 0);
}

function sortear<T>(r: Rng, itens: readonly T[], pesos: readonly number[]): T {
  const total = pesos.reduce((s, p) => s + p, 0);
  let x = r.next() * total;
  for (let i = 0; i < itens.length; i++) {
    x -= pesos[i]!;
    if (x <= 0) return itens[i]!;
  }
  return itens[itens.length - 1]!;
}

/** Sorteia a categoria de uma habilidade e decide se a resposta é digitada. */
export function perguntaDe(h: Habilidade, e: EstadoAluno, r: Rng, opts: { chefe?: boolean; digitar?: boolean } = {}): Pergunta {
  const pesos = h.categorias.map((c) => pesoCategoria(e.fatos[chaveFato(h.id, c)], e.rodadas));
  const cat = sortear(r, h.categorias, pesos);
  const f = e.fatos[chaveFato(h.id, cat)];
  const d = dominio(f);
  const p = !f || !f.hn ? 0 : d >= 0.55 ? 0.6 : d >= 0.4 ? 0.25 : 0;
  const digitar = opts.digitar ?? r.chance(opts.chefe ? Math.min(1, p + 0.2) : p);
  return gerarPergunta(h, cat, r, digitar);
}

export function montarRodada(e: EstadoAluno, tipo: TipoRodada, r: Rng, foco?: string): Pergunta[] {
  const cfg = CONFIG_RODADA[tipo];
  const todas = desbloqueadas(e).map((h) => ({ h, sit: situacao(h, e) }));
  let pool = tipo === "revisao" ? todas.filter((x) => x.sit === "consolidada") : todas;
  if (foco) pool = todas.filter((x) => x.h.id === foco);
  if (!pool.length) pool = todas;
  const pesos = pool.map(({ h, sit }) => {
    const w = pesoHabilidade(h, e, sit);
    return tipo === "chefe" ? w * w : w;
  });

  const perguntas: Pergunta[] = [];
  const porHabilidade = new Map<string, number>();
  const vistos = new Set<string>();
  let tentativas = 0;
  while (perguntas.length < cfg.n && tentativas++ < 400) {
    const disponiveis = pool.filter(({ h }) => (porHabilidade.get(h.id) ?? 0) < Math.max(4, Math.ceil(cfg.n / pool.length) + 1));
    const base = disponiveis.length ? disponiveis : pool;
    const escolhido = sortear(r, base, base.map((x) => pesos[pool.indexOf(x)]!));
    const q = perguntaDe(escolhido.h, e, r, { chefe: tipo === "chefe" });
    const assinatura = q.enunciado + "|" + q.expr;
    if (vistos.has(assinatura) && tentativas < 300) continue;
    vistos.add(assinatura);
    porHabilidade.set(escolhido.h.id, (porHabilidade.get(escolhido.h.id) ?? 0) + 1);
    perguntas.push(q);
  }
  return perguntas;
}

/** Nome do chefe: guardião da zona da habilidade mais frágil em jogo. */
export function nomeDoChefe(e: EstadoAluno): string {
  const cand = desbloqueadas(e)
    .map((h) => ({ h, d: dominioHabilidade(h, e.fatos)?.d ?? 1 }))
    .sort((a, b) => a.d - b.d)[0];
  return `Guardião de ${cand?.h.zona ?? "Fundação"}`;
}
