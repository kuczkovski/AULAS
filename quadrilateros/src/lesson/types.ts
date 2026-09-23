import type { FC } from 'react'

export type BlockId = 1 | 2 | 3 | 4 | 5

export interface TeacherNotes {
  /** Objetivo específico da etapa. */
  objetivo: string
  /** Conhecimentos prévios necessários. */
  previos: string[]
  /** Orientações para a explicação. */
  orientacoes: string[]
  /** Perguntas que podem ser feitas aos alunos. */
  perguntas: string[]
  /** Justificativas matemáticas das propriedades. */
  justificativa: string[]
  /** Possíveis dificuldades conceituais. */
  dificuldades: string[]
  /** Relação com os exercícios da avaliação. */
  avaliacao: string
}

export interface ScreenProps {
  step: number
  goToStep: (s: number) => void
}

export interface ScreenDef {
  id: string
  block: BlockId
  /** Número exibido (Tela 1, Tela 2…). 0 = abertura. */
  num: number
  title: string
  /** Tempo previsto em minutos. */
  minutes: number
  /** Descrição de cada estado da revelação progressiva (o índice 0 é o estado inicial). */
  steps: string[]
  Component: FC<ScreenProps>
  notes: TeacherNotes
  /** Telas "cheias" não usam o cabeçalho padrão. */
  bare?: boolean
}

export interface BlockDef {
  id: BlockId
  title: string
  minutes: number
  color: string
  light: string
  goal: string
}
