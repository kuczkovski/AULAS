import type { Fato, Habilidade } from "./tipos";

export const chaveFato = (habilidade: string, cat: string) => `${habilidade}|${cat}`;

export function obterFato(fatos: Record<string, Fato>, chave: string): Fato {
  return (fatos[chave] ??= { seen: 0, wrong: 0, n: 0, sumT: 0, h: 0, hn: 0, rec: 0, last: -99 });
}

export function registrar(f: Fato, ok: boolean, dtMs: number, rodada: number) {
  const anterior = f.hn ? f.h & 1 : null;
  f.h = ((f.h << 1) | (ok ? 1 : 0)) & 255;
  f.hn = Math.min(8, f.hn + 1);
  if (ok && anterior === 0) f.rec++;
  f.seen++;
  f.n++;
  f.sumT += Math.min(dtMs, 60000);
  f.last = rodada;
  if (ok) f.wrong = Math.max(0, f.wrong - 0.5);
  else f.wrong += 1;
}

export function acertoRecente(f: Fato): number | null {
  if (!f.hn) return null;
  let c = 0;
  for (let i = 0; i < f.hn; i++) if ((f.h >> i) & 1) c++;
  return c / f.hn;
}

/**
 * Domínio de 0 a 1: acerto recente pesa 80%, rapidez 20%. Com poucas
 * observações a estimativa é puxada para 0,5, para que um acerto de sorte
 * não marque a categoria como dominada.
 */
export function dominio(f: Fato | undefined, esperadoMs = 6000): number {
  const acc = f ? acertoRecente(f) : null;
  if (!f || acc === null) return 0.35;
  const k = 2.5;
  const ajustado = (acc * f.hn + 0.5 * k) / (f.hn + k);
  const media = f.n ? f.sumT / f.n : esperadoMs * 2;
  const vel = Math.max(0, Math.min(1, 1 - (media - esperadoMs) / (2 * esperadoMs)));
  return Math.max(0, Math.min(1, ajustado * 0.8 + vel * 0.2));
}

/** Peso de sorteio de uma categoria: frágil e vencida voltam mais. */
export function pesoCategoria(f: Fato | undefined, rodada: number): number {
  const d = dominio(f);
  const fragil = Math.max(0, 1 - d - Math.min(0.2, (f?.rec ?? 0) * 0.05));
  const desde = Math.max(0, rodada - (f?.last ?? -99));
  const intervalo = 1 + Math.round(d * d * 10);
  const vencido = Math.min(2, desde / intervalo);
  let peso = 0.4 + fragil * 3 + vencido * 1.6 + Math.min(1, (f?.wrong ?? 0) * 0.25);
  if (desde === 1) peso *= 0.6;
  return peso;
}

export interface DominioHabilidade {
  /** Domínio da habilidade: o terço mais frágil pesa mais que a média. */
  d: number;
  observadas: number;
  total: number;
}

export function dominioHabilidade(h: Habilidade, fatos: Record<string, Fato>): DominioHabilidade | null {
  const ds = h.categorias
    .map((c) => fatos[chaveFato(h.id, c)])
    .filter((f): f is Fato => !!f && f.hn > 0)
    .map((f) => dominio(f))
    .sort((a, b) => a - b);
  if (!ds.length) return null;
  const media = ds.reduce((s, v) => s + v, 0) / ds.length;
  const corte = Math.max(1, Math.ceil(ds.length / 3));
  const pior = ds.slice(0, corte).reduce((s, v) => s + v, 0) / corte;
  return { d: media * 0.4 + pior * 0.6, observadas: ds.length, total: h.categorias.length };
}

export const LIMIAR_CONSOLIDADA = 0.6;

export function consolidada(h: Habilidade, fatos: Record<string, Fato>, colocadas: readonly string[]): boolean {
  if (colocadas.includes(h.id)) return true;
  const d = dominioHabilidade(h, fatos);
  return !!d && d.observadas >= Math.min(h.categorias.length, 4) && d.d >= LIMIAR_CONSOLIDADA;
}
