import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { BLOCKS, SCREENS, TOPICS, goTo, goToId } from '../lesson/lesson'

export function Menu({ index, onClose }: { index: number; onClose: () => void }) {
  const pick = (fn: () => void) => {
    fn()
    onClose()
  }
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.96, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-3xl border-4 border-slate-800 bg-white"
      >
        <div className="flex items-center gap-3 border-b-2 border-slate-200 px-5 py-3">
          <div className="font-comic text-3xl text-green-800">Menu da aula</div>
          <button className="icon-btn ml-auto" onClick={onClose} aria-label="Fechar menu">
            <X size={26} />
          </button>
        </div>
        <div className="overflow-y-auto p-5">
          <div className="mb-2 text-sm font-black uppercase text-slate-500">Acesso rápido por tema</div>
          <div className="mb-5 flex flex-wrap gap-2">
            {TOPICS.map((t) => (
              <button key={t.label} className="topic-chip" onClick={() => pick(() => goToId(t.ids[0]))}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {BLOCKS.map((b) => (
              <div key={b.id} className="rounded-2xl border-[3px] p-3" style={{ borderColor: b.color, background: b.light }}>
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="font-extrabold" style={{ color: b.color }}>
                    Bloco {b.id} · {b.title}
                  </span>
                  <span className="text-sm font-bold text-slate-500">{b.minutes} min</span>
                </div>
                <div className="space-y-1">
                  {SCREENS.map((s, i) =>
                    s.block === b.id ? (
                      <button
                        key={s.id}
                        onClick={() => pick(() => goTo(i))}
                        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[15px] font-semibold ${
                          i === index ? 'bg-slate-800 text-white' : 'bg-white text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <span className="w-7 shrink-0 text-center font-black opacity-60">{s.num || '★'}</span>
                        <span className="flex-1">{s.title}</span>
                      </button>
                    ) : null,
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
