import { clearScreen, getData, update } from '../state/store'
import { BLOCKS } from './blocks'
import { bloco1 } from './screens/bloco1'
import { bloco2 } from './screens/bloco2'
import { bloco3 } from './screens/bloco3'
import { bloco4, bloco5 } from './screens/bloco45'
import type { ScreenDef } from './types'

export const SCREENS: ScreenDef[] = [...bloco1, ...bloco2, ...bloco3, ...bloco4, ...bloco5]
export { BLOCKS }

export const blockOf = (s: ScreenDef) => BLOCKS[s.block - 1]

/** Temas do menu de acesso rápido → telas. */
export const TOPICS: { label: string; ids: string[] }[] = [
  { label: 'Triângulos e ângulos', ids: ['t1', 't2', 't5'] },
  { label: 'Retas paralelas', ids: ['t3'] },
  { label: 'Bissetriz', ids: ['t4', 't17'] },
  { label: 'Quadriláteros', ids: ['t6', 't7', 't8'] },
  { label: 'Trapézios', ids: ['t9', 't12', 't14'] },
  { label: 'Paralelogramos', ids: ['t10', 't11', 't13'] },
  { label: 'Base média', ids: ['t14', 't15'] },
  { label: 'Mediana da hipotenusa', ids: ['t16'] },
  { label: 'Problemas orientados', ids: ['p1', 'p2', 'p3', 'verif'] },
]

const clampIndex = (i: number) => Math.max(0, Math.min(SCREENS.length - 1, i))
const lastStep = (i: number) => SCREENS[i].steps.length - 1

/** Avança uma revelação; no fim da tela, vai para a próxima tela. */
export function next() {
  const { index, step } = getData()
  if (step < lastStep(index)) update(() => ({ step: step + 1 }))
  else if (index < SCREENS.length - 1) update(() => ({ index: index + 1, step: 0 }))
}

/** Volta uma revelação; no início da tela, vai para o fim da tela anterior. */
export function prev() {
  const { index, step } = getData()
  if (step > 0) update(() => ({ step: step - 1 }))
  else if (index > 0) update(() => ({ index: index - 1, step: lastStep(index - 1) }))
}

export function goTo(index: number, step = 0) {
  const i = clampIndex(index)
  update(() => ({ index: i, step: Math.max(0, Math.min(step, lastStep(i))) }))
}

export const goToId = (id: string) => goTo(SCREENS.findIndex((s) => s.id === id))

export function setStep(step: number) {
  const { index } = getData()
  update(() => ({ step: Math.max(0, Math.min(step, lastStep(index))) }))
}

export function nextScreen() {
  const { index } = getData()
  goTo(index + 1)
}

export function prevScreen() {
  const { index } = getData()
  goTo(index - 1)
}

export function restartScreen(clearAnnots: boolean) {
  clearScreen(SCREENS[getData().index].id, clearAnnots)
}
