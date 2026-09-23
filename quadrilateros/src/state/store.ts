// Estado global da aula (navegação, estado das figuras manipuláveis e anotações).
// É sincronizado entre janelas do mesmo navegador via BroadcastChannel, o que permite
// usar uma "janela do professor" separada quando o tablet trabalha com tela estendida.
import { createContext, useCallback, useContext, useSyncExternalStore } from 'react'

export type Tool = 'pen' | 'line' | 'ellipse' | 'text' | 'eraser'

export interface Annot {
  id: string
  kind: 'pen' | 'line' | 'ellipse' | 'text'
  color: string
  width: number
  pts: number[] // pen: x,y,x,y… | line/ellipse: x1,y1,x2,y2 | text: x,y
  text?: string
}

export interface AppData {
  index: number
  step: number
  resets: Record<string, number>
  fig: Record<string, unknown>
  annots: Record<string, Annot[]>
}

const STORAGE_KEY = 'geo-quadrilateros-v1'
const initial: AppData = { index: 0, step: 0, resets: {}, fig: {}, annots: {} }

const load = (): AppData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...initial, ...JSON.parse(raw) }
  } catch {
    /* armazenamento indisponível: começa do zero */
  }
  return initial
}

let data: AppData = load()
const listeners = new Set<() => void>()
let saveTimer: number | undefined

const persist = () => {
  window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      /* ignora */
    }
  }, 300)
}

type Msg = { type: 'full'; data: AppData } | { type: 'hello' }
let channel: BroadcastChannel | null = null
try {
  channel = new BroadcastChannel('geo-quadrilateros')
  channel.onmessage = (e: MessageEvent<Msg>) => {
    if (e.data.type === 'full') {
      data = e.data.data
      listeners.forEach((l) => l())
      persist()
    } else if (e.data.type === 'hello') {
      channel?.postMessage({ type: 'full', data } satisfies Msg)
    }
  }
  channel.postMessage({ type: 'hello' } satisfies Msg)
} catch {
  channel = null
}

export const getData = () => data

export function update(fn: (d: AppData) => Partial<AppData>) {
  data = { ...data, ...fn(data) }
  listeners.forEach((l) => l())
  channel?.postMessage({ type: 'full', data } satisfies Msg)
  persist()
}

export const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useData<T>(sel: (d: AppData) => T): T {
  return useSyncExternalStore(subscribe, () => sel(data))
}

/** Identificador da tela atual, disponível para as figuras. */
export const ScreenCtx = createContext<string>('')

/**
 * Estado de uma figura manipulável, associado à tela. É preservado ao navegar,
 * sincronizado entre janelas e apagado ao reiniciar a tela.
 */
export function useScreenState<T>(key: string, init: T): [T, (v: T) => void] {
  const id = useContext(ScreenCtx)
  const k = `${id}:${key}`
  const value = useData((d) => d.fig[k]) as T | undefined
  const set = useCallback((v: T) => update((d) => ({ fig: { ...d.fig, [k]: v } })), [k])
  return [value ?? init, set]
}

export function clearScreen(id: string, clearAnnots: boolean) {
  update((d) => {
    const fig = Object.fromEntries(Object.entries(d.fig).filter(([k]) => !k.startsWith(`${id}:`)))
    const annots = clearAnnots ? { ...d.annots, [id]: [] } : d.annots
    return { fig, annots, step: 0, resets: { ...d.resets, [id]: (d.resets[id] ?? 0) + 1 } }
  })
}
