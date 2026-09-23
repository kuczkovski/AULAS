// Primitivas SVG com as marcações geométricas convencionais da aplicação:
//  • traços para segmentos congruentes      • setas para paralelismo
//  • arcos para ângulos                      • quadradinho para ângulo reto
//  • linhas tracejadas para construções auxiliares
import { AnimatePresence, motion } from 'framer-motion'
import { createContext, useContext, useRef, type ReactNode } from 'react'
import { add, centroid, heading, mid, mul, perp, polar, sub, unit, type Pt } from './math'

export const C = {
  ink: '#1e293b',
  paper: '#ffffff',
  green: '#16a34a',
  greenD: '#166534',
  greenL: '#dcfce7',
  sky: '#0284c7',
  skyM: '#38bdf8',
  skyL: '#e0f2fe',
  pink: '#db2777',
  pinkM: '#f472b6',
  pinkL: '#fce7f3',
  orange: '#ea580c',
  orangeL: '#ffedd5',
  violet: '#7c3aed',
  violetL: '#ede9fe',
  yellow: '#facc15',
  yellowL: '#fef9c3',
  gray: '#64748b',
  grayL: '#e2e8f0',
}

export const SIDE_W = 7
export const AUX_W = 4
export const FONT = "'Nunito', system-ui, sans-serif"

/** Área de figura: SVG cujo viewBox coincide com o tamanho em pixels do quadro. */
export function Fig({ w = 1140, h = 880, children }: { w?: number; h?: number; children: ReactNode }) {
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      style={{ touchAction: 'none', overflow: 'visible', display: 'block', fontFamily: FONT }}
    >
      {children}
    </svg>
  )
}

/** Mostra/oculta um grupo SVG com transição suave. */
export function Show({ when, children, delay = 0 }: { when: boolean; children: ReactNode; delay?: number }) {
  return (
    <AnimatePresence>
      {when && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, delay }}
        >
          {children}
        </motion.g>
      )}
    </AnimatePresence>
  )
}

interface SegProps {
  a: Pt
  b: Pt
  color?: string
  width?: number
  dash?: boolean | string
  draw?: boolean
  opacity?: number
  cap?: 'round' | 'butt'
}

/** Segmento. `draw` anima o traçado quando o segmento aparece. */
export function Seg({ a, b, color = C.ink, width = SIDE_W, dash, draw, opacity = 1, cap = 'round' }: SegProps) {
  const dasharray = dash === true ? '18 14' : dash || undefined
  if (draw && !dash) {
    return (
      <motion.line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={color}
        strokeWidth={width}
        strokeLinecap={cap}
        opacity={opacity}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: 'easeInOut' }}
      />
    )
  }
  return (
    <line
      x1={a.x}
      y1={a.y}
      x2={b.x}
      y2={b.y}
      stroke={color}
      strokeWidth={width}
      strokeLinecap={cap}
      strokeDasharray={dasharray}
      opacity={opacity}
    />
  )
}

/** Reta (ou semirreta) prolongada além dos pontos a e b. */
export function Line({
  a,
  b,
  ext = 2000,
  extA = ext,
  extB = ext,
  ...rest
}: Omit<SegProps, 'draw'> & { ext?: number; extA?: number; extB?: number }) {
  const d = unit(sub(b, a))
  return <Seg a={add(a, mul(d, -extA))} b={add(b, mul(d, extB))} {...rest} />
}

export function Poly({
  pts,
  fill = 'none',
  stroke = C.ink,
  width = SIDE_W,
  opacity = 1,
  dash,
}: {
  pts: Pt[]
  fill?: string
  stroke?: string
  width?: number
  opacity?: number
  dash?: boolean
}) {
  return (
    <polygon
      points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
      fill={fill}
      stroke={stroke}
      strokeWidth={width}
      strokeLinejoin="round"
      strokeDasharray={dash ? '18 14' : undefined}
      opacity={opacity}
    />
  )
}

export function Dot({ p, r = 9, color = C.ink, ring = false }: { p: Pt; r?: number; color?: string; ring?: boolean }) {
  return ring ? (
    <circle cx={p.x} cy={p.y} r={r} fill={C.paper} stroke={color} strokeWidth={4} />
  ) : (
    <circle cx={p.x} cy={p.y} r={r} fill={color} />
  )
}

/** Texto com contorno branco para legibilidade sobre as linhas. */
export function Txt({
  p,
  children,
  size = 46,
  color = C.ink,
  anchor = 'middle',
  weight = 800,
  italic = false,
}: {
  p: Pt
  children: ReactNode
  size?: number
  color?: string
  anchor?: 'start' | 'middle' | 'end'
  weight?: number
  italic?: boolean
}) {
  return (
    <text
      x={p.x}
      y={p.y}
      fontSize={size}
      fontWeight={weight}
      fill={color}
      textAnchor={anchor}
      dominantBaseline="central"
      fontStyle={italic ? 'italic' : undefined}
      stroke={C.paper}
      strokeWidth={size / 5}
      paintOrder="stroke"
      strokeLinejoin="round"
    >
      {children}
    </text>
  )
}

/** Rótulo de vértice, afastado do centro da figura. */
export function VLabel({ p, from, text, d = 44, color = C.ink, size = 50 }: { p: Pt; from: Pt; text: ReactNode; d?: number; color?: string; size?: number }) {
  const q = add(p, mul(unit(sub(p, from)), d))
  return (
    <Txt p={q} size={size} color={color} italic={false}>
      {text}
    </Txt>
  )
}

/** Rótulos para todos os vértices de um polígono. */
export function VLabels({ pts, names, d = 44, color }: { pts: Pt[]; names: string[]; d?: number; color?: string }) {
  const c = centroid(pts)
  return (
    <>
      {pts.map((p, i) => (
        <VLabel key={names[i]} p={p} from={c} text={names[i]} d={d} color={color} />
      ))}
    </>
  )
}

/** Rótulo de medida ao lado de um segmento (lado positivo = à esquerda de a→b na tela). */
export function SegLabel({
  a,
  b,
  children,
  off = 40,
  color = C.ink,
  size = 42,
}: {
  a: Pt
  b: Pt
  children: ReactNode
  off?: number
  color?: string
  size?: number
}) {
  const n = unit(perp(sub(b, a)))
  const q = add(mid(a, b), mul(n, off))
  return (
    <Txt p={q} size={size} color={color}>
      {children}
    </Txt>
  )
}

/** Traços de congruência no ponto médio do segmento. */
export function Ticks({ a, b, n = 1, color = C.pink, size = 22, at = 0.5 }: { a: Pt; b: Pt; n?: number; color?: string; size?: number; at?: number }) {
  const d = unit(sub(b, a))
  const nrm = perp(d)
  const m = add(a, mul(sub(b, a), at))
  const gap = 12
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const c = add(m, mul(d, (i - (n - 1) / 2) * gap))
        return <Seg key={i} a={add(c, mul(nrm, -size))} b={add(c, mul(nrm, size))} color={color} width={5} />
      })}
    </g>
  )
}

/** Setas de paralelismo sobre o segmento, apontando no sentido a→b. */
export function ParArrows({ a, b, n = 1, color = C.ink, at = 0.5, size = 20 }: { a: Pt; b: Pt; n?: number; color?: string; at?: number; size?: number }) {
  const d = unit(sub(b, a))
  const nrm = perp(d)
  const m = add(a, mul(sub(b, a), at))
  const gap = 18
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const tip = add(m, mul(d, (i - (n - 1) / 2) * gap + size / 2))
        const back = add(tip, mul(d, -size))
        const p1 = add(back, mul(nrm, size * 0.75))
        const p2 = add(back, mul(nrm, -size * 0.75))
        return (
          <polyline
            key={i}
            points={`${p1.x},${p1.y} ${tip.x},${tip.y} ${p2.x},${p2.y}`}
            fill="none"
            stroke={color}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )
      })}
    </g>
  )
}

const normDelta = (d: number) => {
  let x = ((d % 360) + 360) % 360
  if (x > 180) x -= 360
  return x
}

/** Caminho do arco do ângulo AVB (o menor dos dois). */
export function arcPath(v: Pt, a: Pt, b: Pt, r: number, wedge = false) {
  const h1 = heading(v, a)
  const h2 = heading(v, b)
  const delta = normDelta(h2 - h1)
  const p1 = polar(v, r, h1)
  const p2 = polar(v, r, h1 + delta)
  const sweep = delta > 0 ? 0 : 1
  const arc = `A ${r} ${r} 0 0 ${sweep} ${p2.x} ${p2.y}`
  return wedge ? `M ${v.x} ${v.y} L ${p1.x} ${p1.y} ${arc} Z` : `M ${p1.x} ${p1.y} ${arc}`
}

/** Direção da bissetriz do ângulo AVB (graus). */
export const bisectorHeading = (v: Pt, a: Pt, b: Pt) => {
  const h1 = heading(v, a)
  return h1 + normDelta(heading(v, b) - h1) / 2
}

/** Arco de ângulo com preenchimento suave, n arcos (marca de congruência) e rótulo opcional. */
export function Angle({
  v,
  a,
  b,
  r = 62,
  color = C.green,
  fill,
  n = 1,
  label,
  labelR,
  labelSize = 40,
  labelColor,
}: {
  v: Pt
  a: Pt
  b: Pt
  r?: number
  color?: string
  fill?: string | false
  n?: number
  label?: ReactNode
  labelR?: number
  labelSize?: number
  labelColor?: string
}) {
  const h = bisectorHeading(v, a, b)
  const lp = polar(v, labelR ?? r + 30 + (n - 1) * 10 + labelSize * 0.4, h)
  return (
    <g>
      {fill !== false && <path d={arcPath(v, a, b, r, true)} fill={fill ?? color} opacity={0.18} />}
      {Array.from({ length: n }, (_, i) => (
        <path key={i} d={arcPath(v, a, b, r - i * 11)} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" />
      ))}
      {label !== undefined && (
        <Txt p={lp} size={labelSize} color={labelColor ?? color}>
          {label}
        </Txt>
      )}
    </g>
  )
}

/** Marca de ângulo reto (quadradinho) no vértice v, entre as direções de a e b. */
export function RightMark({ v, a, b, s = 30, color = C.ink }: { v: Pt; a: Pt; b: Pt; s?: number; color?: string }) {
  const u = mul(unit(sub(a, v)), s)
  const w = mul(unit(sub(b, v)), s)
  const p1 = add(v, u)
  const p2 = add(add(v, u), w)
  const p3 = add(v, w)
  return (
    <polyline
      points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`}
      fill="none"
      stroke={color}
      strokeWidth={4}
      strokeLinejoin="round"
    />
  )
}

/**
 * Alça de arraste (alvo de toque grande). Converte as coordenadas do ponteiro para
 * o sistema do SVG, que pode estar escalado pelo palco 16:9.
 */
export function Handle({
  p,
  onMove,
  color = C.orange,
  r = 16,
}: {
  p: Pt
  onMove: (p: Pt) => void
  color?: string
  r?: number
}) {
  const dragging = useRef(false)
  const toLocal = (e: React.PointerEvent<SVGGElement>) => {
    const svg = (e.currentTarget as SVGGElement).ownerSVGElement!
    const rect = svg.getBoundingClientRect()
    const vb = svg.viewBox.baseVal
    return {
      x: vb.x + ((e.clientX - rect.left) * vb.width) / rect.width,
      y: vb.y + ((e.clientY - rect.top) * vb.height) / rect.height,
    }
  }
  return (
    <g
      style={{ cursor: 'grab', touchAction: 'none' }}
      onPointerDown={(e) => {
        e.stopPropagation()
        dragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        if (dragging.current) onMove(toLocal(e))
      }}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <circle cx={p.x} cy={p.y} r={46} fill="transparent" />
      <circle cx={p.x} cy={p.y} r={r + 10} fill={color} opacity={0.18} className="handle-pulse" />
      <circle cx={p.x} cy={p.y} r={r} fill={C.paper} stroke={color} strokeWidth={6} />
    </g>
  )
}

/** Dicas de manipulação aparecem apenas no modo professor (não são projetadas). */
export const HintCtx = createContext(false)

/** Pequeno texto de ajuda ("arraste") próximo a uma alça. */
export function DragHint({ p, text = 'arraste', dx = 0, dy = -58 }: { p: Pt; text?: string; dx?: number; dy?: number }) {
  const show = useContext(HintCtx)
  if (!show) return null
  return (
    <Txt p={{ x: p.x + dx, y: p.y + dy }} size={28} color={C.orange} weight={800}>
      {text}
    </Txt>
  )
}
