import type { Ano, EstadoAluno } from "@/engine/tipos";
import { novoEstado } from "@/engine/estado";

export interface AlunoNuvem {
  alunoId: string;
  turmaId: string;
  turma: string;
  ano: Ano;
}

export interface Sessao {
  modo: "local" | "nuvem";
  estado: EstadoAluno;
  aluno?: AlunoNuvem;
  atualizadoEm: number;
}

/** Rodada aguardando envio ao servidor. */
export interface RodadaPendente {
  alunoId: string;
  tipo: "nivelamento" | "treino" | "revisao" | "chefe";
  andar: number | null;
  acertos: number;
  total: number;
  pontos: number;
  duracaoS: number;
  falhou: boolean;
}

const CHAVE = "torre-infinita-v2";
const FILA = "torre-infinita-v2-fila";

function ler<T>(chave: string): T | null {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : null;
  } catch {
    return null;
  }
}
function gravar(chave: string, valor: unknown) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* armazenamento cheio ou bloqueado: o jogo segue na memória */
  }
}

/** Completa campos que versões anteriores do estado não tinham. */
function normalizar(e: EstadoAluno): EstadoAluno {
  return { ...novoEstado(e.ano ?? 6), ...e, v: 2 };
}

export function carregarSessao(): Sessao | null {
  const s = ler<Sessao>(CHAVE);
  if (!s?.estado || s.estado.v !== 2) return null;
  return { ...s, estado: normalizar(s.estado) };
}

export function salvarSessao(s: Sessao) {
  gravar(CHAVE, { ...s, atualizadoEm: Date.now() });
}

export function apagarSessao() {
  try {
    localStorage.removeItem(CHAVE);
    localStorage.removeItem(FILA);
  } catch {
    /* ignora */
  }
}

export const lerFila = () => ler<RodadaPendente[]>(FILA) ?? [];
export const gravarFila = (f: RodadaPendente[]) => gravar(FILA, f.slice(-200));
