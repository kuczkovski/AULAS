import { Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BLOCKS, SCREENS, blockOf, setStep } from '../lesson/lesson'
import type { ScreenDef } from '../lesson/types'

export interface TimerState {
  running: boolean
  acc: number // ms acumulados até a última pausa
  since: number // instante do último "play"
}

export const timerElapsed = (t: TimerState, now = Date.now()) => t.acc + (t.running ? now - t.since : 0)

const mmss = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/** Minutos previstos acumulados até o início da tela i. */
const plannedBefore = (i: number) => SCREENS.slice(0, i).reduce((a, s) => a + s.minutes, 0)

function useNow(ms = 500) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms)
    return () => window.clearInterval(id)
  }, [ms])
  return now
}

export function Timer({
  timer,
  setTimer,
  index,
  screenSince,
}: {
  timer: TimerState
  setTimer: (t: TimerState) => void
  index: number
  screenSince: number
}) {
  const now = useNow()
  const total = timerElapsed(timer, now)
  const screen = SCREENS[index]
  const onScreen = timer.running || timer.acc > 0 ? now - screenSince : 0
  const planned = screen.minutes * 60_000
  const drift = total - plannedBefore(index) * 60_000
  const driftMin = Math.round(drift / 60_000)
  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white p-3">
      <div className="flex items-center gap-3">
        <div className="font-mono text-3xl font-black tabular-nums text-slate-800">{mmss(total)}</div>
        <div className="text-sm text-slate-500">/ 50:00</div>
        <div className="ml-auto flex gap-1">
          <button
            className="icon-btn"
            aria-label={timer.running ? 'Pausar cronômetro' : 'Iniciar cronômetro'}
            onClick={() =>
              setTimer(
                timer.running
                  ? { running: false, acc: timerElapsed(timer), since: 0 }
                  : { running: true, acc: timer.acc, since: Date.now() },
              )
            }
          >
            {timer.running ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button className="icon-btn" aria-label="Zerar cronômetro" onClick={() => setTimer({ running: false, acc: 0, since: 0 })}>
            <RotateCcw size={20} />
          </button>
        </div>
      </div>
      {/* Barra de tempo com as fronteiras dos blocos */}
      <div className="relative mt-2 flex h-3 overflow-hidden rounded-full bg-slate-100">
        {BLOCKS.map((b) => (
          <div key={b.id} style={{ width: `${(b.minutes / 50) * 100}%`, background: b.light, borderRight: '2px solid #fff' }} />
        ))}
        <div className="absolute inset-y-0 left-0 bg-slate-700/60" style={{ width: `${Math.min(100, (total / 3_000_000) * 100)}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-sm">
        <span className={onScreen > planned ? 'font-bold text-rose-600' : 'text-slate-600'}>
          Tela: {mmss(onScreen)} / {mmss(planned)}
        </span>
        <span className={driftMin > 1 ? 'font-bold text-rose-600' : driftMin < -1 ? 'text-sky-700' : 'text-green-700'}>
          {total === 0 ? 'cronômetro parado' : driftMin > 0 ? `${driftMin} min atrasado` : driftMin < 0 ? `${-driftMin} min adiantado` : 'no tempo'}
        </span>
      </div>
    </div>
  )
}

function Section({ title, items, color }: { title: string; items: string[] | string; color: string }) {
  const list = Array.isArray(items) ? items : [items]
  return (
    <div>
      <div className="mb-1 text-xs font-black uppercase tracking-wide" style={{ color }}>
        {title}
      </div>
      <ul className="space-y-1 text-[15px] leading-snug text-slate-700">
        {list.map((it) => (
          <li key={it} className="flex gap-2">
            <span style={{ color }}>•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function TeacherPanel({
  screen,
  index,
  step,
  timer,
  setTimer,
  screenSince,
}: {
  screen: ScreenDef
  index: number
  step: number
  timer: TimerState
  setTimer: (t: TimerState) => void
  screenSince: number
}) {
  const block = blockOf(screen)
  const n = screen.notes
  const nextScreen: ScreenDef | undefined = SCREENS[index + 1]
  return (
    <aside className="flex h-full w-[340px] shrink-0 2xl:w-[400px] flex-col gap-3 overflow-y-auto border-l-2 border-slate-200 bg-slate-50 p-3">
      <Timer timer={timer} setTimer={setTimer} index={index} screenSince={screenSince} />

      <div className="rounded-2xl border-2 bg-white p-3" style={{ borderColor: block.color }}>
        <div className="text-xs font-black uppercase" style={{ color: block.color }}>
          Bloco {block.id} · {block.title} · {block.minutes} min
        </div>
        <div className="text-lg font-extrabold text-slate-800">
          {screen.num > 0 && screen.block < 4 ? `Tela ${screen.num} — ` : ''}
          {screen.title}
        </div>
        <div className="text-sm text-slate-500">Tempo previsto: {String(screen.minutes).replace('.', ',')} min</div>
      </div>

      <div className="rounded-2xl border-2 border-slate-200 bg-white p-3">
        <div className="mb-1 text-xs font-black uppercase text-slate-500">Revelações (toque para ir)</div>
        <ol className="space-y-1">
          {screen.steps.map((s, i) => (
            <li key={i}>
              <button
                onClick={() => setStep(i)}
                className={`w-full rounded-lg px-2 py-1 text-left text-[15px] leading-snug ${
                  i === step ? 'bg-green-600 font-bold text-white' : i < step ? 'text-slate-400' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {i}. {s}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="space-y-3 rounded-2xl border-2 border-slate-200 bg-white p-3">
        <Section title="Objetivo" items={n.objetivo} color="#15803d" />
        <Section title="Conhecimentos prévios" items={n.previos} color="#0369a1" />
        <Section title="Orientações" items={n.orientacoes} color="#7c3aed" />
        <Section title="Perguntas para a turma" items={n.perguntas} color="#db2777" />
        <Section title="Justificativa matemática" items={n.justificativa} color="#b45309" />
        <Section title="Possíveis dificuldades" items={n.dificuldades} color="#dc2626" />
        <Section title="Relação com a avaliação" items={n.avaliacao} color="#0f766e" />
      </div>

      {nextScreen && (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 p-3 text-sm text-slate-500">
          Próxima tela: <b className="text-slate-700">{nextScreen.title}</b>
        </div>
      )}
    </aside>
  )
}
