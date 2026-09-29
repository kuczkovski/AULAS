import type { Rng } from "./tipos";

/** mulberry32: gerador determinístico, para testes reproduzíveis. */
export function criarRng(semente?: number): Rng {
  let s = (semente ?? Math.floor(Math.random() * 2 ** 32)) >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng: Rng = {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)] as never,
    shuffle: (arr) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j] as never, a[i] as never];
      }
      return a;
    },
    chance: (p) => next() < p,
  };
  return rng;
}
