import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Maximize,
  Menu as MenuIcon,
  MonitorUp,
  PanelRightClose,
  PanelRightOpen,
  PenLine,
  RotateCcw,
} from 'lucide-react'
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { SCREENS, blockOf, next, nextScreen, prev, prevScreen, restartScreen, setStep } from './lesson/lesson'
import type { ScreenDef } from './lesson/types'
import { HintCtx } from './geo/svg'
import { ScreenCtx, getData, useData, type Tool } from './state/store'
import { ANNOT_COLORS, AnnotToolbar, AnnotationLayer } from './ui/Annotations'
import { Menu } from './ui/Menu'
import { Roteiro } from './ui/Roteiro'
import { Stage } from './ui/Stage'
import { TeacherPanel, type TimerState } from './ui/TeacherPanel'

type Mode = 'projecao' | 'professor'

function useHash() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const on = () => setHash(window.location.hash)
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return hash
}

export default function App() {
  const hash = useHash()
  if (hash === '#roteiro') return <Roteiro />
  return <Lesson presenter={hash === '#presenter'} />
}

class Guard extends Component<{ children: ReactNode; k: string }, { err: boolean }> {
  state = { err: false }
  static getDerivedStateFromError() {
    return { err: true }
  }
  componentDidUpdate(prev: { k: string }) {
    if (prev.k !== this.props.k && this.state.err) this.setState({ err: false })
  }
  render() {
    return this.state.err ? (
      <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-slate-500">
        Não foi possível exibir esta tela. Use “Reiniciar etapa”.
      </div>
    ) : (
      this.props.children
    )
  }
}

function Header({ screen, step }: { screen: ScreenDef; step: number }) {
  const b = blockOf(screen)
  const total = screen.steps.length
  return (
    <div className="absolute flex items-center" style={{ left: 40, top: 24, width: 1840, height: 112, gap: 24 }}>
      <div className="block-badge font-comic" style={{ background: b.color }}>
        {b.id}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-extrabold uppercase" style={{ color: b.color, fontSize: 26, letterSpacing: 1 }}>
          Bloco {b.id} · {b.title}
          {screen.block < 4 && screen.num > 0 ? ` · Tela ${screen.num}` : ''}
        </div>
        <div className="font-comic truncate text-slate-800" style={{ fontSize: 56, lineHeight: 1.25 }}>
          {screen.title}
        </div>
      </div>
      {total > 1 && (
        <div className="flex items-center gap-2" aria-label={`Etapa ${step + 1} de ${total}`}>
          {screen.steps.map((_, i) => (
            <span
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === step ? 34 : 16,
                height: 16,
                background: i <= step ? b.color : '#e2e8f0',
                border: `2px solid ${i <= step ? b.color : '#cbd5e1'}`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ScreenView({ screen, step, reset, hints }: { screen: ScreenDef; step: number; reset: number; hints: boolean }) {
  const C = screen.Component
  const key = `${screen.id}:${reset}`
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        className="absolute inset-0"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.25 }}
      >
        <ScreenCtx.Provider value={screen.id}>
          <HintCtx.Provider value={hints}>
            <Guard k={key}>
              {!screen.bare && <Header screen={screen} step={step} />}
              <C step={step} goToStep={setStep} />
            </Guard>
          </HintCtx.Provider>
        </ScreenCtx.Provider>
      </motion.div>
    </AnimatePresence>
  )
}

const loadMode = (presenter: boolean): Mode => {
  if (presenter) return 'professor'
  try {
    return (sessionStorage.getItem('geo-mode') as Mode) || 'professor'
  } catch {
    return 'professor'
  }
}

function Lesson({ presenter }: { presenter: boolean }) {
  const index = useData((d) => d.index)
  const step = useData((d) => d.step)
  const reset = useData((d) => d.resets[SCREENS[d.index].id] ?? 0)
  const screen = SCREENS[index]
  const [mode, setModeRaw] = useState<Mode>(() => loadMode(presenter))
  const [menu, setMenu] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState(ANNOT_COLORS[0])
  const [confirmReset, setConfirmReset] = useState(false)
  const [timer, setTimer] = useState<TimerState>({ running: false, acc: 0, since: 0 })
  const [screenSince, setScreenSince] = useState(Date.now())

  const setMode = useCallback(
    (m: Mode) => {
      setModeRaw(m)
      if (!presenter) {
        try {
          sessionStorage.setItem('geo-mode', m)
        } catch {
          /* ignora */
        }
      }
    },
    [presenter],
  )

  useEffect(() => setScreenSince(Date.now()), [index])

  const restart = useCallback(() => {
    const d = getData()
    const has = (d.annots[SCREENS[d.index].id]?.length ?? 0) > 0
    if (has) setConfirmReset(true)
    else restartScreen(false)
  }, [])

  const fullscreen = () => {
    const el = document.documentElement
    if (document.fullscreenElement) document.exitFullscreen?.()
    else el.requestFullscreen?.().catch(() => undefined)
  }

  const openPresenter = () => {
    const url = window.location.href.split('#')[0] + '#presenter'
    window.open(url, 'geo-professor', 'popup,width=1280,height=800')
    setMode('projecao')
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      const k = e.key
      if (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'Enter') {
        e.preventDefault()
        if (e.shiftKey) nextScreen()
        else next()
      } else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace') {
        e.preventDefault()
        if (e.shiftKey) prevScreen()
        else prev()
      } else if (k === 'ArrowDown') nextScreen()
      else if (k === 'ArrowUp') prevScreen()
      else if (k === 'm' || k === 'M') setMenu((v) => !v)
      else if (k === 'r' || k === 'R') restart()
      else if (k === 'a' || k === 'A') setDrawing((v) => !v)
      else if (k === 'p' || k === 'P') setMode(mode === 'professor' ? 'projecao' : 'professor')
      else if (k === 'f' || k === 'F') fullscreen()
      else if (k === 'Escape') {
        setMenu(false)
        setDrawing(false)
        setConfirmReset(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, restart, setMode])

  const stage = (
    <Stage>
      <ScreenView screen={screen} step={step} reset={reset} hints={mode === 'professor'} />
      <AnnotationLayer screenId={screen.id} active={drawing} tool={tool} color={color} />
    </Stage>
  )

  const overlays = (
    <>
      {drawing && (
        <AnnotToolbar
          screenId={screen.id}
          tool={tool}
          setTool={setTool}
          color={color}
          setColor={setColor}
          onClose={() => setDrawing(false)}
        />
      )}
      <AnimatePresence>{menu && <Menu index={index} onClose={() => setMenu(false)} />}</AnimatePresence>
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-3xl border-4 border-slate-800 bg-white p-6">
            <div className="text-2xl font-extrabold text-slate-800">Reiniciar a demonstração</div>
            <p className="mt-1 text-slate-600">Esta tela tem anotações. O que fazer com elas?</p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                className="btn-primary"
                onClick={() => {
                  restartScreen(false)
                  setConfirmReset(false)
                }}
              >
                Manter anotações
              </button>
              <button
                className="btn-danger"
                onClick={() => {
                  restartScreen(true)
                  setConfirmReset(false)
                }}
              >
                Limpar anotações
              </button>
              <button className="btn-ghost" onClick={() => setConfirmReset(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )

  if (mode === 'projecao') {
    return (
      <div className="fixed inset-0 bg-[#0b1324]">
        {stage}
        <FloatingBar
          onPrev={prev}
          onNext={next}
          onRestart={restart}
          onMenu={() => setMenu(true)}
          drawing={drawing}
          onDraw={() => setDrawing((v) => !v)}
          onTeacher={() => setMode('professor')}
          onFull={fullscreen}
        />
        {overlays}
      </div>
    )
  }

  const lastStep = screen.steps.length - 1
  return (
    <div className="fixed inset-0 flex flex-col bg-slate-300">
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 p-2">{stage}</div>
        <TeacherPanel
          screen={screen}
          index={index}
          step={step}
          timer={timer}
          setTimer={setTimer}
          screenSince={screenSince}
        />
      </div>
      <div className="flex shrink-0 items-center gap-2 border-t-2 border-slate-300 bg-white px-3 py-2">
        <button className="bar-btn" onClick={() => setMenu(true)} aria-label="Menu">
          <MenuIcon size={24} /> <span className="hidden 2xl:inline">Menu</span>
        </button>
        <button className="bar-btn" onClick={restart} aria-label="Reiniciar etapa">
          <RotateCcw size={24} /> <span className="hidden 2xl:inline">Reiniciar etapa</span>
        </button>
        <button className={`bar-btn ${drawing ? 'bar-btn-on' : ''}`} onClick={() => setDrawing((v) => !v)} aria-label="Anotar">
          <PenLine size={24} /> <span className="hidden 2xl:inline">Anotar</span>
        </button>
        <div className="mx-auto flex items-center gap-2">
          <button className="nav-btn" onClick={prev} aria-label="Anterior">
            <ChevronLeft size={34} /> Anterior
          </button>
          <div className="min-w-[150px] text-center text-sm font-bold leading-tight text-slate-600">
            {index + 1} / {SCREENS.length}
            <div className="text-xs font-semibold text-slate-400">
              revelação {step} de {lastStep}
            </div>
          </div>
          <button className="nav-btn nav-btn-main" onClick={next} aria-label="Próximo">
            Próximo <ChevronRight size={34} />
          </button>
        </div>
        {!presenter && (
          <button className="bar-btn" onClick={openPresenter} aria-label="Janela do professor" title="Abre o painel em outra janela (para tela estendida)">
            <MonitorUp size={24} /> <span className="hidden 2xl:inline">Janela do professor</span>
          </button>
        )}
        <a className="bar-btn" href="#roteiro" aria-label="Roteiro" title="Roteiro para imprimir (útil com tela espelhada)">
          <FileText size={24} /> <span className="hidden 2xl:inline">Roteiro</span>
        </a>
        <button className="bar-btn" onClick={fullscreen} aria-label="Tela cheia">
          <Maximize size={24} />
        </button>
        {!presenter && (
          <button className="bar-btn bar-btn-proj" onClick={() => setMode('projecao')} aria-label="Modo projeção">
            <PanelRightClose size={24} /> <span className="hidden 2xl:inline">Modo projeção</span>
          </button>
        )}
      </div>
      {overlays}
    </div>
  )
}

/** Barra flutuante mínima do modo projeção: fica quase invisível quando não é usada. */
function FloatingBar(props: {
  onPrev: () => void
  onNext: () => void
  onRestart: () => void
  onMenu: () => void
  drawing: boolean
  onDraw: () => void
  onTeacher: () => void
  onFull: () => void
}) {
  const [awake, setAwake] = useState(true)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => {
    const wake = () => {
      setAwake(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setAwake(false), 3500)
    }
    wake()
    window.addEventListener('pointerdown', wake)
    window.addEventListener('keydown', wake)
    return () => {
      window.removeEventListener('pointerdown', wake)
      window.removeEventListener('keydown', wake)
      window.clearTimeout(timer.current)
    }
  }, [])
  return (
    <div className={`float-bar ${awake || props.drawing ? '' : 'float-bar-dim'}`}>
      <button className="fb" onClick={props.onMenu} aria-label="Menu">
        <MenuIcon size={28} />
      </button>
      <button className="fb" onClick={props.onRestart} aria-label="Reiniciar etapa">
        <RotateCcw size={28} />
      </button>
      <button className={`fb ${props.drawing ? 'fb-on' : ''}`} onClick={props.onDraw} aria-label="Anotar">
        <PenLine size={28} />
      </button>
      <button className="fb fb-nav" onClick={props.onPrev} aria-label="Anterior">
        <ChevronLeft size={40} />
      </button>
      <button className="fb fb-nav fb-main" onClick={props.onNext} aria-label="Próximo">
        <ChevronRight size={40} />
      </button>
      <button className="fb" onClick={props.onFull} aria-label="Tela cheia">
        <Maximize size={26} />
      </button>
      <button className="fb" onClick={props.onTeacher} aria-label="Modo professor">
        <PanelRightOpen size={26} />
      </button>
    </div>
  )
}
