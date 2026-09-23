// Camada de anotação sobre o palco: caneta, destaque de segmento, círculo, texto e borracha.
// As anotações ficam associadas à tela atual.
import { Circle, Eraser, Highlighter, PenLine, Trash2, Type, Undo2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { update, useData, type Annot, type Tool } from '../state/store'
import { STAGE_H, STAGE_W } from './Stage'

export const ANNOT_COLORS = ['#dc2626', '#2563eb', '#16a34a', '#f59e0b', '#1e293b']

const uid = () => Math.random().toString(36).slice(2, 10)

function setAnnots(screenId: string, fn: (list: Annot[]) => Annot[]) {
  update((d) => ({ annots: { ...d.annots, [screenId]: fn(d.annots[screenId] ?? []) } }))
}

function AnnotShape({ a, erasing }: { a: Annot; erasing: boolean }) {
  const pe = erasing ? 'visiblePainted' : 'none'
  const common = { 'data-annot': a.id, style: { pointerEvents: pe } as React.CSSProperties }
  if (a.kind === 'pen') {
    const pts = []
    for (let i = 0; i < a.pts.length; i += 2) pts.push(`${a.pts[i]},${a.pts[i + 1]}`)
    return (
      <polyline
        {...common}
        points={pts.join(' ')}
        fill="none"
        stroke={a.color}
        strokeWidth={a.width}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )
  }
  if (a.kind === 'line') {
    const [x1, y1, x2, y2] = a.pts
    return <line {...common} x1={x1} y1={y1} x2={x2} y2={y2} stroke={a.color} strokeWidth={a.width} strokeLinecap="round" opacity={0.45} />
  }
  if (a.kind === 'ellipse') {
    const [x1, y1, x2, y2] = a.pts
    return (
      <ellipse
        {...common}
        cx={(x1 + x2) / 2}
        cy={(y1 + y2) / 2}
        rx={Math.abs(x2 - x1) / 2}
        ry={Math.abs(y2 - y1) / 2}
        fill="none"
        stroke={a.color}
        strokeWidth={a.width}
      />
    )
  }
  return (
    <text
      {...common}
      x={a.pts[0]}
      y={a.pts[1]}
      fill={a.color}
      fontSize={48}
      fontWeight={800}
      dominantBaseline="central"
      stroke="#fff"
      strokeWidth={9}
      paintOrder="stroke"
      style={{ ...common.style, fontFamily: "'Nunito', sans-serif" }}
    >
      {a.text}
    </text>
  )
}

export function AnnotationLayer({
  screenId,
  active,
  tool,
  color,
}: {
  screenId: string
  active: boolean
  tool: Tool
  color: string
}) {
  const list = useData((d) => d.annots[screenId]) ?? []
  const [draft, setDraft] = useState<Annot | null>(null)
  const [textAt, setTextAt] = useState<{ x: number; y: number } | null>(null)
  const [text, setText] = useState('')
  const svgRef = useRef<SVGSVGElement>(null)
  const down = useRef(false)

  const toLocal = (e: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect()
    return [((e.clientX - r.left) * STAGE_W) / r.width, ((e.clientY - r.top) * STAGE_H) / r.height]
  }
  const eraseAt = (e: React.PointerEvent) => {
    const el = document.elementFromPoint(e.clientX, e.clientY)
    const id = el?.getAttribute('data-annot')
    if (id) setAnnots(screenId, (l) => l.filter((a) => a.id !== id))
  }
  const commitText = () => {
    if (textAt && text.trim()) {
      setAnnots(screenId, (l) => [
        ...l,
        { id: uid(), kind: 'text', color, width: 0, pts: [textAt.x, textAt.y], text: text.trim() },
      ])
    }
    setTextAt(null)
    setText('')
  }

  return (
    <>
      <svg
        ref={svgRef}
        className="absolute inset-0"
        width={STAGE_W}
        height={STAGE_H}
        viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
        style={{ pointerEvents: active ? 'auto' : 'none', touchAction: 'none', cursor: active ? 'crosshair' : undefined, zIndex: 20 }}
        onPointerDown={(e) => {
          if (!active) return
          const [x, y] = toLocal(e)
          if (tool === 'text') {
            if (textAt) commitText()
            setTextAt({ x, y })
            return
          }
          down.current = true
          e.currentTarget.setPointerCapture(e.pointerId)
          if (tool === 'eraser') return eraseAt(e)
          const width = tool === 'line' ? 18 : 7
          setDraft({ id: uid(), kind: tool, color, width, pts: tool === 'pen' ? [x, y] : [x, y, x, y] })
        }}
        onPointerMove={(e) => {
          if (!down.current) return
          if (tool === 'eraser') return eraseAt(e)
          if (!draft) return
          const [x, y] = toLocal(e)
          if (draft.kind === 'pen') setDraft({ ...draft, pts: [...draft.pts, x, y] })
          else setDraft({ ...draft, pts: [draft.pts[0], draft.pts[1], x, y] })
        }}
        onPointerUp={() => {
          down.current = false
          if (draft) {
            const [x1, y1, x2, y2] = draft.pts
            const tiny = draft.kind !== 'pen' && Math.hypot(x2 - x1, y2 - y1) < 8
            if (!tiny) setAnnots(screenId, (l) => [...l, draft])
          }
          setDraft(null)
        }}
      >
        {list.map((a) => (
          <AnnotShape key={a.id} a={a} erasing={active && tool === 'eraser'} />
        ))}
        {draft && <AnnotShape a={draft} erasing={false} />}
      </svg>
      {textAt && (
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === 'Enter') commitText()
            if (e.key === 'Escape') {
              setTextAt(null)
              setText('')
            }
          }}
          onBlur={commitText}
          placeholder="Digite…"
          className="annot-input"
          style={{ left: textAt.x, top: textAt.y - 34, color, zIndex: 30 }}
        />
      )}
    </>
  )
}

const TOOLS: { id: Tool; label: string; Icon: typeof PenLine }[] = [
  { id: 'pen', label: 'Caneta', Icon: PenLine },
  { id: 'line', label: 'Destacar segmento', Icon: Highlighter },
  { id: 'ellipse', label: 'Circular', Icon: Circle },
  { id: 'text', label: 'Texto', Icon: Type },
  { id: 'eraser', label: 'Apagar anotação', Icon: Eraser },
]

export function AnnotToolbar({
  screenId,
  tool,
  setTool,
  color,
  setColor,
  onClose,
}: {
  screenId: string
  tool: Tool
  setTool: (t: Tool) => void
  color: string
  setColor: (c: string) => void
  onClose: () => void
}) {
  const count = useData((d) => d.annots[screenId]?.length ?? 0)
  return (
    <div className="annot-toolbar">
      {TOOLS.map(({ id, label, Icon }) => (
        <button key={id} title={label} aria-label={label} className={`tb ${tool === id ? 'tb-on' : ''}`} onClick={() => setTool(id)}>
          <Icon size={26} />
        </button>
      ))}
      <div className="my-1 h-px w-full bg-slate-300" />
      {ANNOT_COLORS.map((c) => (
        <button
          key={c}
          aria-label={`Cor ${c}`}
          className="tb"
          onClick={() => setColor(c)}
          style={{ outline: color === c ? `4px solid ${c}` : undefined, outlineOffset: 2 }}
        >
          <span className="block h-7 w-7 rounded-full" style={{ background: c }} />
        </button>
      ))}
      <div className="my-1 h-px w-full bg-slate-300" />
      <button
        title="Desfazer"
        aria-label="Desfazer"
        className="tb"
        disabled={!count}
        onClick={() => setAnnots(screenId, (l) => l.slice(0, -1))}
      >
        <Undo2 size={26} />
      </button>
      <button
        title="Limpar todas"
        aria-label="Limpar todas as anotações"
        className="tb"
        disabled={!count}
        onClick={() => setAnnots(screenId, () => [])}
      >
        <Trash2 size={26} />
      </button>
      <button title="Fechar anotação" aria-label="Fechar anotação" className="tb tb-close" onClick={onClose}>
        <X size={26} />
      </button>
    </div>
  )
}
