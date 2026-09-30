import { chaveFato, consolidada, dominio, dominioHabilidade, pesoCategoria } from "./dominio";
import { assinaturaDe, gerarPergunta } from "./gerar";
import { HABILIDADES } from "./habilidades";
import { ZONAS } from "./zonas";
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

export function montarRodada(e: EstadoAluno, tipo: TipoRodada, r: Rng, foco?: string, opts: { n?: number; zona?: string } = {}): Pergunta[] {
  const cfg = { ...CONFIG_RODADA[tipo], n: opts.n ?? CONFIG_RODADA[tipo].n };
  const todas = desbloqueadas(e).map((h) => ({ h, sit: situacao(h, e) }));
  let pool = tipo === "revisao" ? todas.filter((x) => x.sit === "consolidada") : todas;
  if (foco) pool = todas.filter((x) => x.h.id === foco);
  // o chefe só cobra o que pertence à sua zona
  if (tipo === "chefe") {
    const daZona = todas.filter((x) => x.h.zona === (opts.zona ?? chefeDaVez(e)));
    if (daZona.length) pool = daZona;
  }
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
    const assinatura = assinaturaDe(q);
    if (vistos.has(assinatura) && tentativas < 300) continue;
    vistos.add(assinatura);
    porHabilidade.set(escolhido.h.id, (porHabilidade.get(escolhido.h.id) ?? 0) + 1);
    perguntas.push(q);
  }
  return perguntas;
}

/** Zonas em que o aluno já pode praticar, na ordem da torre. */
export function zonasAbertas(e: EstadoAluno): string[] {
  const abertas = new Set(desbloqueadas(e).map((h) => h.zona));
  return Object.keys(ZONAS).filter((z) => abertas.has(z));
}

export type SituacaoChefe = "derrotado" | "disponivel" | "bloqueado";

export interface ProgressoZona {
  total: number;
  abertas: number;
  dominadas: number;
  chefe: SituacaoChefe;
}

/** Quantas habilidades da zona já foram vistas, quantas dominadas e como está o chefe. */
export function progressoDaZona(e: EstadoAluno, zona: string): ProgressoZona {
  const hs = HABILIDADES.filter((h) => h.zona === zona && h.ano <= e.ano);
  const sits = hs.map((h) => situacao(h, e));
  const abertas = sits.filter((x) => x !== "bloqueada").length;
  return {
    total: hs.length,
    abertas,
    dominadas: sits.filter((x) => x === "consolidada").length,
    chefe: e.chefes.includes(zona) ? "derrotado" : abertas > 0 ? "disponivel" : "bloqueado",
  };
}

/**
 * Chefe da vez: a zona mais bem preparada ainda sem chefe derrotado (mais
 * habilidades dominadas). Quando todas já caíram, vem a revanche na zona
 * mais fraca.
 */
export function chefeDaVez(e: EstadoAluno): string {
  const abertas = zonasAbertas(e);
  if (!abertas.length) return "Fundação";
  const pendentes = abertas.filter((z) => !e.chefes.includes(z));
  if (pendentes.length) {
    const preparo = (z: string) => {
      const p = progressoDaZona(e, z);
      return p.dominadas * 2 + (p.abertas - p.dominadas) * 0.5;
    };
    return pendentes.reduce((melhor, z) => (preparo(z) > preparo(melhor) ? z : melhor));
  }
  const fraqueza = (z: string) => {
    const ds = HABILIDADES.filter((h) => h.zona === z && h.ano <= e.ano).map((h) => dominioHabilidade(h, e.fatos)?.d ?? 1);
    return ds.reduce((a, b) => a + b, 0) / Math.max(1, ds.length);
  };
  return abertas.reduce((pior, z) => (fraqueza(z) < fraqueza(pior) ? z : pior));
}

/** Zona que mais aparece nas perguntas de uma rodada. */
export function zonaDominante(perguntas: readonly Pergunta[]): string {
  const cont = new Map<string, number>();
  for (const p of perguntas) {
    const z = HABILIDADES.find((h) => h.id === p.habilidade)?.zona ?? "Fundação";
    cont.set(z, (cont.get(z) ?? 0) + 1);
  }
  return [...cont.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Fundação";
}

/** Zona em foco para o próximo andar de treino: onde está a maior necessidade de prática. */
export function zonaEmFoco(e: EstadoAluno): string {
  const soma = new Map<string, number>();
  for (const h of desbloqueadas(e)) soma.set(h.zona, (soma.get(h.zona) ?? 0) + pesoHabilidade(h, e, situacao(h, e)));
  return [...soma.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Fundação";
}
