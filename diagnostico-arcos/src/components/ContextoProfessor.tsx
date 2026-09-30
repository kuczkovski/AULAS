"use client";
import { createContext, useContext } from "react";
import type { AlunoAnalise, Base } from "@/lib/analise";

export interface Painel {
  base: Base;
  /** alunos da turma escolhida no filtro */
  alunos: AlunoAnalise[];
  turma: string;
  gabarito: Record<string, string>;
  recarregar: () => Promise<void>;
}

export const ContextoProfessor = createContext<Painel | null>(null);

export function usePainel(): Painel {
  const p = useContext(ContextoProfessor);
  if (!p) throw new Error("usePainel fora do painel");
  return p;
}
