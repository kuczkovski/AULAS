// Componentes visuais em estilo "quadrinhos": quadros, balões, fórmulas.
import katex from 'katex'
import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, type ReactNode } from 'react'

/** Fórmula em LaTeX (KaTeX, renderizado localmente). */
export function M({ children, display = false }: { children: string; display?: boolean }) {
  const html = useMemo(
    () => katex.renderToString(children, { throwOnError: false, displayMode: display, strict: false }),
    [children, display],
  )
  return <span className={display ? 'block' : 'inline-block'} dangerouslySetInnerHTML={{ __html: html }} />
}

const TONES = {
  green: { border: '#166534', bg: '#f0fdf4', chip: '#16a34a' },
  sky: { border: '#075985', bg: '#f0f9ff', chip: '#0284c7' },
  pink: { border: '#9d174d', bg: '#fdf2f8', chip: '#db2777' },
  orange: { border: '#9a3412', bg: '#fff7ed', chip: '#ea580c' },
  violet: { border: '#5b21b6', bg: '#f5f3ff', chip: '#7c3aed' },
  white: { border: '#1e293b', bg: '#ffffff', chip: '#1e293b' },
} as const
export type Tone = keyof typeof TONES

/** Quadro (painel) com borda grossa e cantos arredondados; aparece com animação. */
export function Card({
  show = true,
  tone = 'white',
  title,
  children,
  className = '',
  size = 'md',
}: {
  show?: boolean
  tone?: Tone
  title?: ReactNode
  children?: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const t = TONES[tone]
  const fs = size === 'lg' ? 46 : size === 'sm' ? 32 : 38
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          layout="position"
          initial={{ opacity: 0, y: 26, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className={`comic-card relative ${className}`}
          style={{ borderColor: t.border, background: t.bg, fontSize: fs }}
        >
          {title && (
            <div className="comic-chip" style={{ background: t.chip }}>
              {title}
            </div>
          )}
          <div className="leading-snug">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Fórmula em destaque; `boxed` indica um resultado/conclusão. */
export function Formula({ tex, boxed = false, size = 56, color }: { tex: string; boxed?: boolean; size?: number; color?: string }) {
  return (
    <div
      className={`my-1 flex justify-center ${boxed ? 'formula-boxed' : ''}`}
      style={{ fontSize: size, color }}
    >
      <M>{tex}</M>
    </div>
  )
}

/** Mascote discreto: um esquadro com olhos ("Esquadrinho"). */
export function Mascot({ size = 120 }: { size?: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden>
      <path d="M12 108 L12 12 L108 108 Z" fill="#4ade80" stroke="#1e293b" strokeWidth="6" strokeLinejoin="round" />
      <path d="M30 90 L30 54 L66 90 Z" fill="#f0fdf4" stroke="#1e293b" strokeWidth="4" strokeLinejoin="round" />
      {[20, 32, 44, 56, 68, 80, 92].map((y) => (
        <line key={y} x1="12" y1={y} x2="20" y2={y} stroke="#1e293b" strokeWidth="3" />
      ))}
      <circle cx="34" cy="38" r="7" fill="#fff" stroke="#1e293b" strokeWidth="3" />
      <circle cx="36" cy="39" r="3" fill="#1e293b" />
      <circle cx="52" cy="50" r="7" fill="#fff" stroke="#1e293b" strokeWidth="3" />
      <circle cx="54" cy="51" r="3" fill="#1e293b" />
    </svg>
  )
}

/** Balão de fala com uma pergunta para a turma. */
export function Ask({ show = true, children, mascot = true }: { show?: boolean; children: ReactNode; mascot?: boolean }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          layout="position"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          className="flex items-end gap-3"
        >
          {mascot && (
            <div className="shrink-0">
              <Mascot size={104} />
            </div>
          )}
          <div className="balloon">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Área de conteúdo padrão: quadro da figura (1140×880) à esquerda e coluna de quadros à direita. */
export function Body({ fig, side }: { fig: ReactNode; side?: ReactNode }) {
  return (
    <div className="absolute flex" style={{ left: 40, top: 158, width: 1840, height: 892, gap: 30 }}>
      <div className="figure-panel" style={{ width: 1150, height: 890 }}>
        {fig}
      </div>
      <div className="flex flex-col" style={{ width: 660, gap: 22 }}>
        {side}
      </div>
    </div>
  )
}

/** Sequência lógica destacada progressivamente (ex.: paralelismo → ângulos → …). */
export function Chain({ items, active }: { items: string[]; active: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2" style={{ fontSize: 27 }}>
      {items.map((it, i) => (
        <div key={it} className="flex items-center gap-2">
          <span
            className="rounded-full border-[3px] px-3 py-0.5 font-extrabold transition-all duration-500"
            style={{
              borderColor: i < active ? '#166534' : '#cbd5e1',
              background: i < active ? '#bbf7d0' : '#f8fafc',
              color: i < active ? '#14532d' : '#94a3b8',
            }}
          >
            {it}
          </span>
          {i < items.length - 1 && <span style={{ color: i < active - 1 ? '#166534' : '#cbd5e1' }}>➜</span>}
        </div>
      ))}
    </div>
  )
}
