import type { Ano, EstadoAluno } from "./tipos";

export function novoEstado(ano: Ano): EstadoAluno {
  return {
    v: 2,
    ano,
    apelido: "",
    avatar: { cor: 0, forma: 0, acessorio: 0 },
    xp: 0,
    nivel: 1,
    andar: 1,
    quedas: 0,
    fatos: {},
    chefes: [],
    colocadas: [],
    nivelamentoFeito: false,
    dias: [],
    rodadas: 0,
    melhorSequencia: 0,
    respondidas: 0,
    acertos: 0,
    som: false,
    calmo: false,
  };
}

/** XP para sair do nível n: curva suave, pensada para sessões de sala de aula. */
export const xpNecessario = (nivel: number) => 80 + 25 * nivel;

export function aplicarXp(e: EstadoAluno, ganho: number): number {
  e.xp += Math.max(0, Math.round(ganho));
  let subiu = 0;
  while (e.xp >= xpNecessario(e.nivel)) {
    e.xp -= xpNecessario(e.nivel);
    e.nivel++;
    subiu++;
  }
  return subiu;
}

export const hojeISO = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Dias seguidos de prática até hoje (hoje sem jogar ainda não quebra a sequência). */
export function sequenciaDeDias(dias: readonly string[], hoje = new Date()): number {
  const set = new Set(dias);
  const d = new Date(hoje);
  if (!set.has(hojeISO(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(hojeISO(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** Segunda-feira da semana de `d`, em ISO. */
export function inicioDaSemana(d = new Date()): string {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  return hojeISO(s);
}
