import { AnimatePresence, motion } from 'framer-motion'
import { useMorph } from '../../geo/hooks'
import {
  P,
  add,
  angleAt,
  clamp,
  clampPt,
  dist,
  fmt,
  heading,
  isConvex,
  lerp,
  mid,
  mul,
  polar,
  sub,
  unit,
  type Pt,
} from '../../geo/math'
import {
  Angle,
  C,
  DragHint,
  Fig,
  Handle,
  ParArrows,
  Poly,
  RightMark,
  Seg,
  SegLabel,
  Show,
  Ticks,
  Txt,
  VLabels,
} from '../../geo/svg'
import { useScreenState } from '../../state/store'
import { Ask, Body, Card, Chain, Formula, M } from '../../ui/comic'
import type { ScreenDef, ScreenProps } from '../types'

const NAMES = ['A', 'B', 'C', 'D']
const AUX = 4
/** Medida em cm a partir de pixels (escala da tela). */
const cm = (px: number, scale = 80, d = 1) => fmt(px / scale, d)

/* ─────────────── Tela 12 — Trapézio isósceles ─────────────── */

function T12({ step }: ScreenProps) {
  const A = P(150, 720)
  const B = P(990, 720)
  const [Cs, setC] = useScreenState<Pt>('C', P(770, 270))
  const D = P(1140 - Cs.x, Cs.y)
  const pts = [A, B, Cs, D]
  const aA = Math.round(angleAt(A, B, D))
  const aD = 180 - aA
  const leg = cm(dist(A, D))
  const diag = cm(dist(A, Cs))
  return (
    <Body
      fig={
        <Fig>
          <Poly pts={pts} fill="#f8fafc" />
          <ParArrows a={A} b={B} at={0.6} />
          <ParArrows a={D} b={Cs} at={0.6} />
          <Show when={step === 1 || step >= 4}>
            <Ticks a={A} b={D} color={C.pink} />
            <Ticks a={B} b={Cs} color={C.pink} />
          </Show>
          <Show when={step === 1}>
            <SegLabel a={A} b={D} off={48} color={C.pink}>
              {leg}
            </SegLabel>
            <SegLabel a={Cs} b={B} off={48} color={C.pink}>
              {leg}
            </SegLabel>
          </Show>
          <Show when={step === 2 || step >= 4}>
            <Angle v={A} a={B} b={D} r={70} color={C.green} label={step === 2 ? `${aA}°` : undefined} />
            <Angle v={B} a={Cs} b={A} r={70} color={C.green} label={step === 2 ? `${aA}°` : undefined} />
            <Angle v={D} a={A} b={Cs} r={70} n={2} color={C.sky} label={step === 2 ? `${aD}°` : undefined} />
            <Angle v={Cs} a={D} b={B} r={70} n={2} color={C.sky} label={step === 2 ? `${aD}°` : undefined} />
          </Show>
          <Show when={step >= 3}>
            <Seg a={A} b={Cs} color={C.orange} width={5} />
            <Seg a={B} b={D} color={C.orange} width={5} />
            <Ticks a={A} b={Cs} n={3} color={C.orange} at={0.3} />
            <Ticks a={B} b={D} n={3} color={C.orange} at={0.3} />
          </Show>
          <Show when={step === 3}>
            <Txt p={add(lerp(A, Cs, 0.3), P(0, -44))} color={C.orange} size={38}>
              {diag}
            </Txt>
            <Txt p={add(lerp(B, D, 0.3), P(0, -44))} color={C.orange} size={38}>
              {diag}
            </Txt>
          </Show>
          <VLabels pts={pts} names={NAMES} />
          <Handle p={Cs} onMove={(q) => setC(P(clamp(q.x, 640, 1020), clamp(q.y, 150, 600)))} />
          <DragHint p={Cs} dx={40} />
        </Fig>
      }
      side={
        <>
          <Card tone="white" size="sm" title="Trapézio isósceles">
            <M>{'\\overline{AB}\\parallel\\overline{CD}'}</M> e lados não paralelos congruentes.
          </Card>
          <Card show={step >= 1} tone="pink" size="sm" title="1. Lados não paralelos">
            <M>{'\\overline{AD}\\cong\\overline{BC}'}</M>
            {step === 1 && <span className="text-slate-500"> ({leg} cm)</span>}
          </Card>
          <Card show={step >= 2} tone="green" size="sm" title="2. Ângulos da mesma base">
            <M>{'\\widehat{A}\\cong\\widehat{B}\\quad\\text{e}\\quad\\widehat{C}\\cong\\widehat{D}'}</M>
          </Card>
          <Card show={step >= 3} tone="orange" size="sm" title="3. Diagonais">
            <M>{'\\overline{AC}\\cong\\overline{BD}'}</M>
            {step === 3 && <span className="text-slate-500"> ({diag} cm)</span>}
          </Card>
          <Card show={step >= 4} tone="sky" size="sm">
            Arraste C: o trapézio continua isósceles e as três propriedades se mantêm.
          </Card>
        </>
      }
    />
  )
}

/* ─────────────── Tela 13 — Propriedades do paralelogramo ─────────────── */

function T13({ step }: ScreenProps) {
  const A = P(150, 720)
  const [st, setSt] = useScreenState<{ bx: number; D: Pt }>('par', { bx: 780, D: P(390, 250) })
  const B = P(st.bx, A.y)
  const D = st.D
  const Cc = add(B, sub(D, A))
  const pts = [A, B, Cc, D]
  const Mi = mid(A, Cc)
  const aA = Math.round(angleAt(A, B, D))
  const aB = 180 - aA
  const ab = cm(dist(A, B))
  const ad = cm(dist(A, D))
  const ac = cm(dist(A, Cc))
  const bd = cm(dist(B, D))
  const items = [
    'Lados opostos congruentes',
    'Ângulos opostos congruentes',
    'Ângulos consecutivos suplementares',
    'Diagonais cortam-se ao meio',
  ]
  const seen = step >= 6 ? 4 : Math.min(step, 3)
  const diagStage = step >= 4
  return (
    <Body
      fig={
        <Fig>
          <Poly pts={pts} fill="#f8fafc" />
          <ParArrows a={A} b={B} at={0.5} />
          <ParArrows a={D} b={Cc} at={0.5} />
          <ParArrows a={A} b={D} n={2} at={0.5} />
          <ParArrows a={B} b={Cc} n={2} at={0.5} />
          <Show when={step === 1}>
            <SegLabel a={B} b={A} off={-50} color={C.pink}>
              {ab}
            </SegLabel>
            <SegLabel a={D} b={Cc} off={-50} color={C.pink}>
              {ab}
            </SegLabel>
            <SegLabel a={A} b={D} off={56} color={C.sky}>
              {ad}
            </SegLabel>
            <SegLabel a={Cc} b={B} off={56} color={C.sky}>
              {ad}
            </SegLabel>
            <Seg a={A} b={B} color={C.pink} width={12} opacity={0.4} />
            <Seg a={D} b={Cc} color={C.pink} width={12} opacity={0.4} />
            <Seg a={A} b={D} color={C.sky} width={12} opacity={0.4} />
            <Seg a={B} b={Cc} color={C.sky} width={12} opacity={0.4} />
          </Show>
          <Show when={step === 2 || step === 3}>
            <g opacity={1}>
              <Angle v={A} a={B} b={D} r={70} color={C.green} label={`${aA}°`} />
              <Angle v={B} a={Cc} b={A} r={70} n={2} color={C.sky} label={`${aB}°`} />
            </g>
            <g opacity={step === 3 ? 0.2 : 1}>
              <Angle v={Cc} a={D} b={B} r={70} color={C.green} label={`${aA}°`} />
              <Angle v={D} a={A} b={Cc} r={70} n={2} color={C.sky} label={`${aB}°`} />
            </g>
          </Show>
          <Show when={diagStage}>
            <Seg a={A} b={Cc} color={C.orange} width={5} draw />
            <Seg a={B} b={D} color={C.violet} width={5} draw />
          </Show>
          <Show when={step >= 5}>
            <circle cx={Mi.x} cy={Mi.y} r={11} fill={C.ink} />
            <Txt p={add(Mi, P(0, 48))}>M</Txt>
          </Show>
          <Show when={step >= 6}>
            <Ticks a={A} b={Mi} color={C.orange} />
            <Ticks a={Mi} b={Cc} color={C.orange} />
            <Ticks a={B} b={Mi} n={2} color={C.violet} />
            <Ticks a={Mi} b={D} n={2} color={C.violet} />
          </Show>
          <VLabels pts={pts} names={NAMES} />
          <Handle p={B} onMove={(q) => setSt({ ...st, bx: clamp(q.x, 520, 800) })} />
          <Handle p={D} onMove={(q) => setSt({ ...st, D: clampPt(q, 170, 130, 330, 520) })} />
        </Fig>
      }
      side={
        <>
          <Card tone="white" size="sm" title="Propriedades">
            {items.map((it, i) => (
              <div key={it} className="flex items-center gap-2" style={{ opacity: i < seen ? 1 : 0.25, fontSize: 28 }}>
                <span className="font-black text-green-700">{i < seen ? '✓' : '•'}</span> {it}
              </div>
            ))}
          </Card>
          <Card show={step === 1} tone="pink" title="Lados opostos">
            <M>{'\\overline{AB}\\cong\\overline{CD}\\quad\\overline{AD}\\cong\\overline{BC}'}</M>
          </Card>
          <Card show={step === 2} tone="green" title="Ângulos opostos">
            <M>{'\\widehat{A}\\cong\\widehat{C}\\quad\\widehat{B}\\cong\\widehat{D}'}</M>
          </Card>
          <Card show={step === 3} tone="sky" title="Ângulos consecutivos">
            <Formula tex={`\\widehat{A}+\\widehat{B}=${aA}^\\circ+${aB}^\\circ=180^\\circ`} size={42} />
          </Card>
          <Card show={step >= 5 && step < 7} tone="orange" title="Diagonais">
            Cortam-se no ponto médio <b>M</b>:
            {step >= 6 && <Formula tex={'AM=MC\\qquad BM=MD'} boxed size={46} />}
          </Card>
          <Card show={step >= 7} tone="violet" title="Cuidado!">
            <M>{'AM=MC'}</M> e <M>{'BM=MD'}</M>, mas em geral <M>{'AC\\neq BD'}</M>.
            <div className="my-1 text-center" style={{ fontSize: 34 }}>
              <span style={{ color: C.orange }}>AC = {ac} cm</span> ·{' '}
              <span style={{ color: C.violet }}>BD = {bd} cm</span>
            </div>
            <div className="text-slate-600" style={{ fontSize: 28 }}>
              As diagonais só são congruentes no retângulo (e no quadrado).
            </div>
          </Card>
        </>
      }
    />
  )
}

/* ─────────────── Tela 14 — Base média do trapézio ─────────────── */

const PX14 = 60 // 1 cm = 60 px
function T14({ step }: ScreenProps) {
  const [st, setSt] = useScreenState('trap', { dx: 360, cx: 720, y: 280 })
  const ex = { dx: 330, cx: 810, y: 290 }
  const t = useMorph(step >= 6)
  const y = st.y + (ex.y - st.y) * t
  const A = P(150, 730)
  const B = P(990, 730)
  const D = P(st.dx + (ex.dx - st.dx) * t, y)
  const Cc = P(st.cx + (ex.cx - st.cx) * t, y)
  const pts = [A, B, Cc, D]
  const Mm = mid(A, D)
  const Nn = mid(B, Cc)
  const Pp = mid(A, Cc)
  const ab = dist(A, B) / PX14
  const cd = dist(D, Cc) / PX14
  const mn = (ab + cd) / 2
  const example = step >= 6
  const snap = (v: number) => Math.round(v / 30) * 30
  return (
    <Body
      fig={
        <Fig>
          <Poly pts={pts} fill="#f8fafc" />
          <ParArrows a={A} b={B} at={0.75} />
          <ParArrows a={D} b={Cc} at={0.75} />
          <Show when={step >= 1}>
            <Ticks a={A} b={Mm} color={C.pink} />
            <Ticks a={Mm} b={D} color={C.pink} />
            <Ticks a={B} b={Nn} n={2} color={C.sky} />
            <Ticks a={Nn} b={Cc} n={2} color={C.sky} />
            <circle cx={Mm.x} cy={Mm.y} r={10} fill={C.ink} />
            <circle cx={Nn.x} cy={Nn.y} r={10} fill={C.ink} />
            <Txt p={add(Mm, P(-44, 0))}>M</Txt>
            <Txt p={add(Nn, P(44, 0))}>N</Txt>
          </Show>
          <Show when={step >= 2}>
            <Seg a={Mm} b={Nn} color={C.orange} width={7} draw />
          </Show>
          <Show when={step >= 3}>
            <ParArrows a={Mm} b={Nn} at={0.75} color={C.orange} />
          </Show>
          <Show when={step === 5}>
            <Seg a={A} b={Cc} color={C.gray} width={AUX} dash />
            <circle cx={Pp.x} cy={Pp.y} r={9} fill={C.gray} />
            <Txt p={add(Pp, P(0, 44))} color={C.gray} size={40}>
              P
            </Txt>
            <SegLabel a={Mm} b={Pp} off={-40} color={C.pink} size={34}>
              CD/2
            </SegLabel>
            <SegLabel a={Pp} b={Nn} off={-40} color={C.sky} size={34}>
              AB/2
            </SegLabel>
          </Show>
          <Show when={example}>
            <SegLabel a={B} b={A} off={-50} color={C.greenD}>
              14 cm
            </SegLabel>
            <SegLabel a={D} b={Cc} off={-50} color={C.greenD}>
              8 cm
            </SegLabel>
            <SegLabel a={Mm} b={Nn} off={-40} color={C.orange}>
              {step >= 7 ? '11 cm' : '?'}
            </SegLabel>
          </Show>
          <VLabels pts={pts} names={NAMES} />
          {!example && (
            <>
              <Handle
                p={D}
                onMove={(q) => setSt({ ...st, y: clamp(q.y, 150, 560), dx: clamp(snap(q.x), 120, st.cx - 180) })}
              />
              <Handle
                p={Cc}
                onMove={(q) => setSt({ ...st, y: clamp(q.y, 150, 560), cx: clamp(snap(q.x), st.dx + 180, 1050) })}
              />
            </>
          )}
        </Fig>
      }
      side={
        <>
          <Card show={step >= 1 && step < 6} tone="white" size="sm" title="Pontos médios">
            M: ponto médio de <M>{'\\overline{AD}'}</M>; N: ponto médio de <M>{'\\overline{BC}'}</M>
          </Card>
          <Card show={step >= 3 && step < 6} tone="orange" size="sm" title="Base média">
            <M>{'\\overline{MN}\\parallel\\overline{AB}\\parallel\\overline{CD}'}</M>
          </Card>
          <Card show={step >= 4} tone="green" title="Medida">
            <Formula tex={'MN=\\dfrac{AB+CD}{2}'} boxed size={50} />
            {step >= 4 && step < 6 && (
              <div className="mt-1 text-center" style={{ fontSize: 30 }}>
                <M>{`\\dfrac{${fmt(ab, 2)}+${fmt(cd, 2)}}{2}=${fmt(mn, 2)}\\text{ cm}`}</M>
              </div>
            )}
          </Card>
          <Card show={step === 5} tone="sky" size="sm" title="Por quê?">
            Com a diagonal AC: <M>{'MP=\\tfrac{CD}{2}'}</M> e <M>{'PN=\\tfrac{AB}{2}'}</M> (base média dos triângulos ACD e
            ABC).
          </Card>
          <Ask show={step >= 6}>Bases de 14 cm e 8 cm. Quanto mede a base média?</Ask>
          <Card show={step >= 7} tone="pink" title="Resolução">
            <Formula tex={'MN=\\dfrac{14+8}{2}=11\\text{ cm}'} boxed size={46} />
          </Card>
        </>
      }
    />
  )
}

/* ─────────────── Tela 15 — Base média do triângulo ─────────────── */

const QUAD15 = [P(170, 640), P(640, 800), P(1010, 380), P(420, 110)]
function T15({ step }: ScreenProps) {
  const [A, setA] = useScreenState<Pt>('A', P(480, 150))
  const [q, setQ] = useScreenState<Pt[]>('quad', QUAD15)
  const phase2 = step >= 5
  return (
    <Body
      fig={
        <AnimatePresence mode="wait">
          {!phase2 ? (
            <motion.div key="tri" exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <TriMid step={step} A={A} setA={setA} />
            </motion.div>
          ) : (
            <motion.div key="quad" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Varignon step={step} pts={q} set={setQ} />
            </motion.div>
          )}
        </AnimatePresence>
      }
      side={
        !phase2 ? (
          <>
            <Card show={step >= 1} tone="white" size="sm" title="Pontos médios">
              M de <M>{'\\overline{AB}'}</M> e N de <M>{'\\overline{AC}'}</M>
            </Card>
            <Card show={step >= 3} tone="orange" size="sm" title="Paralelismo">
              <M>{'\\overline{MN}\\parallel\\overline{BC}'}</M>
            </Card>
            <Card show={step >= 4} tone="green" title="Base média do triângulo">
              <Formula tex={'MN=\\dfrac{BC}{2}'} boxed />
              <div className="text-center text-slate-600" style={{ fontSize: 28 }}>
                Arraste A: MN continua com metade de BC.
              </div>
            </Card>
          </>
        ) : (
          <>
            <Card tone="white" size="sm" title="Quadrilátero qualquer">
              M, N, P e Q: pontos médios dos lados.
            </Card>
            <Card show={step >= 6} tone="green" size="sm" title="Com a diagonal AC">
              <M>{'\\overline{MN}\\parallel\\overline{AC}'}</M> e <M>{'\\overline{QP}\\parallel\\overline{AC}'}</M>
              <div style={{ fontSize: 30 }}>ambos medem metade de AC</div>
            </Card>
            <Card show={step >= 7} tone="sky" size="sm" title="Com a diagonal BD">
              <M>{'\\overline{NP}\\parallel\\overline{BD}'}</M> e <M>{'\\overline{MQ}\\parallel\\overline{BD}'}</M>
            </Card>
            <Card show={step >= 8} tone="violet" title="Conclusão">
              Unindo os pontos médios dos lados de um quadrilátero, obtemos um <b>paralelogramo</b>.
            </Card>
          </>
        )
      }
    />
  )
}

function TriMid({ step, A, setA }: { step: number; A: Pt; setA: (p: Pt) => void }) {
  const B = P(150, 770)
  const Cc = P(990, 770)
  const Mm = mid(A, B)
  const Nn = mid(A, Cc)
  const bc = cm(dist(B, Cc), 84)
  const mn = cm(dist(Mm, Nn), 84)
  return (
    <Fig>
      <Poly pts={[A, B, Cc]} fill="#f8fafc" />
      <Show when={step >= 1}>
        <Ticks a={A} b={Mm} color={C.pink} />
        <Ticks a={Mm} b={B} color={C.pink} />
        <Ticks a={A} b={Nn} n={2} color={C.sky} />
        <Ticks a={Nn} b={Cc} n={2} color={C.sky} />
        <circle cx={Mm.x} cy={Mm.y} r={10} fill={C.ink} />
        <circle cx={Nn.x} cy={Nn.y} r={10} fill={C.ink} />
        <Txt p={add(Mm, P(-46, 0))}>M</Txt>
        <Txt p={add(Nn, P(46, 0))}>N</Txt>
      </Show>
      <Show when={step >= 2}>
        <Seg a={Mm} b={Nn} color={C.orange} width={7} draw />
      </Show>
      <Show when={step >= 3}>
        <ParArrows a={Mm} b={Nn} color={C.orange} at={0.7} />
        <ParArrows a={B} b={Cc} at={0.7} />
      </Show>
      <Show when={step >= 4}>
        <SegLabel a={Cc} b={B} off={-48} color={C.greenD}>
          {`${bc} cm`}
        </SegLabel>
        <SegLabel a={Mm} b={Nn} off={-40} color={C.orange}>
          {`${mn} cm`}
        </SegLabel>
      </Show>
      <VLabels pts={[A, B, Cc]} names={['A', 'B', 'C']} />
      <Handle p={A} onMove={(p) => setA(clampPt(p, 120, 110, 1020, 560))} />
      <DragHint p={A} dx={90} dy={0} />
    </Fig>
  )
}

const HALF = [C.pink, C.orange, '#a16207', C.gray]

function Varignon({ step, pts, set }: { step: number; pts: Pt[]; set: (p: Pt[]) => void }) {
  const [A, B, Cc, D] = pts
  const m = [mid(A, B), mid(B, Cc), mid(Cc, D), mid(D, A)]
  const [Mm, Nn, Pp, Qq] = m
  return (
    <Fig>
      <Show when={step >= 8}>
        <Poly pts={m} fill={C.violetL} stroke="none" />
      </Show>
      <Poly pts={pts} fill="none" />
      <Show when={step >= 6}>
        <Seg a={A} b={Cc} color={C.green} width={AUX} dash />
      </Show>
      <Show when={step >= 7}>
        <Seg a={B} b={D} color={C.sky} width={AUX} dash />
      </Show>
      <Poly pts={m} fill="none" stroke={C.gray} width={4} />
      <Show when={step >= 6}>
        <Seg a={Mm} b={Nn} color={C.green} width={8} />
        <Seg a={Qq} b={Pp} color={C.green} width={8} />
        <ParArrows a={Mm} b={Nn} color={C.green} />
        <ParArrows a={Qq} b={Pp} color={C.green} />
      </Show>
      <Show when={step >= 7}>
        <Seg a={Nn} b={Pp} color={C.sky} width={8} />
        <Seg a={Mm} b={Qq} color={C.sky} width={8} />
        <ParArrows a={Nn} b={Pp} n={2} color={C.sky} />
        <ParArrows a={Mm} b={Qq} n={2} color={C.sky} />
      </Show>
      {pts.map((p, i) => (
        <g key={i}>
          <Ticks a={p} b={m[i]} n={1} color={HALF[i]} size={16} />
          <Ticks a={m[i]} b={pts[(i + 1) % 4]} n={1} color={HALF[i]} size={16} />
        </g>
      ))}
      {m.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={10} fill={C.ink} />
      ))}
      <VLabels pts={m} names={['M', 'N', 'P', 'Q']} d={-46} color={C.violet} />
      <VLabels pts={pts} names={NAMES} />
      {pts.map((p, i) => (
        <Handle
          key={i}
          p={p}
          onMove={(q) => {
            const next = pts.map((o, j) => (j === i ? clampPt(q, 70, 70, 1070, 810) : o))
            if (isConvex(next, 25)) set(next)
          }}
        />
      ))}
    </Fig>
  )
}

/* ─────────────── Tela 16 — Mediana relativa à hipotenusa ─────────────── */

function T16({ step }: ScreenProps) {
  const B = P(200, 470)
  const Cc = P(940, 470)
  const Mm = mid(B, Cc)
  const R = dist(B, Cc) / 2
  const [phi, setPhi] = useScreenState('phi', 118)
  const A = polar(Mm, R, phi)
  const A2 = sub(mul(Mm, 2), A)
  const ex = step >= 6
  return (
    <Body
      fig={
        <Fig>
          <Show when={step >= 5}>
            <circle cx={Mm.x} cy={Mm.y} r={R} fill="none" stroke={C.violet} strokeWidth={4} strokeDasharray="14 12" />
          </Show>
          <Show when={step === 3 || step === 4}>
            <Poly pts={[A, B, A2, Cc]} fill={C.skyL} stroke={C.sky} width={4} dash />
            <Seg a={Mm} b={A2} color={C.sky} width={AUX} dash />
            <RightMark v={A2} a={B} b={Cc} color={C.sky} />
            <Txt p={add(A2, mul(unit(sub(A2, Mm)), 44))} color={C.sky}>
              A’
            </Txt>
          </Show>
          <Poly pts={[A, B, Cc]} fill={step >= 3 && step <= 4 ? 'none' : '#f8fafc'} />
          <RightMark v={A} a={B} b={Cc} s={34} />
          <Show when={step >= 1}>
            <Ticks a={B} b={Mm} color={C.pink} />
            <Ticks a={Mm} b={Cc} color={C.pink} />
            <circle cx={Mm.x} cy={Mm.y} r={10} fill={C.ink} />
            <Txt p={add(Mm, P(0, 46))}>M</Txt>
          </Show>
          <Show when={step >= 2}>
            <Seg a={A} b={Mm} color={C.orange} width={7} draw />
          </Show>
          <Show when={step >= 4}>
            <Ticks a={A} b={Mm} color={C.pink} />
          </Show>
          <Show when={ex}>
            <SegLabel a={Cc} b={B} off={-120} color={C.greenD}>
              12 cm
            </SegLabel>
            <Txt p={add(mid(A, Mm), P(46, 0))} color={C.orange} anchor="start">
              {step >= 7 ? '6 cm' : '?'}
            </Txt>
          </Show>
          <VLabels pts={[A, B, Cc]} names={['A', 'B', 'C']} />
          <Handle p={A} onMove={(p) => setPhi(clamp(heading(Mm, p), 28, 152))} />
          <DragHint p={A} dy={-60} />
        </Fig>
      }
      side={
        <>
          <Card tone="white" size="sm" title="Triângulo retângulo em A">
            <M>{'\\overline{BC}'}</M> é a hipotenusa.
          </Card>
          <Card show={step >= 2 && step < 6} tone="orange" size="sm">
            <M>{'\\overline{AM}'}</M>: mediana relativa à hipotenusa.
          </Card>
          <Card show={step === 3 || step === 4} tone="sky" size="sm" title="Retângulo ABA’C">
            As diagonais do retângulo são <b>congruentes</b> e se cortam <b>ao meio</b>.
          </Card>
          <Card show={step >= 4} tone="green" title="Propriedade">
            <Formula tex={'AM=BM=CM=\\dfrac{BC}{2}'} boxed size={46} />
            {step === 5 && (
              <div className="text-center text-slate-600" style={{ fontSize: 28 }}>
                A está sempre na circunferência de diâmetro BC.
              </div>
            )}
          </Card>
          <Ask show={ex}>A hipotenusa mede 12 cm. Quanto mede a mediana AM?</Ask>
          <Card show={step >= 7} tone="pink" title="Resolução">
            <Formula tex={'AM=\\dfrac{12}{2}=6\\text{ cm}'} boxed size={46} />
          </Card>
        </>
      }
    />
  )
}

/* ─────────────── Tela 17 — Bissetriz e triângulo isósceles ─────────────── */

export const CHAIN = ['Paralelismo', 'Ângulos congruentes', 'Triângulo isósceles', 'Segmentos congruentes']

function T17({ step }: ScreenProps) {
  const A = P(120, 700)
  const B = P(840, 700)
  const [D, setD] = useScreenState<Pt>('D', polar(A, 400, 60))
  const Cc = add(D, sub(B, A))
  const ad = dist(A, D)
  const Pp = add(D, mul(unit(sub(B, A)), ad))
  const pts = [A, B, Cc, D]
  const chain = step >= 6 ? 4 : step >= 5 ? 4 : step >= 4 ? 3 : step >= 3 ? 2 : step >= 2 ? 1 : 0
  return (
    <Body
      fig={
        <Fig>
          <Show when={step >= 4}>
            <Poly pts={[A, Pp, D]} fill={C.yellowL} stroke="none" />
          </Show>
          <Poly pts={pts} fill="none" />
          <ParArrows a={A} b={B} at={0.8} />
          <ParArrows a={D} b={Cc} at={0.85} />
          <ParArrows a={A} b={D} n={2} />
          <ParArrows a={B} b={Cc} n={2} />
          <Show when={step >= 2}>
            <Seg a={A} b={B} color={C.green} width={13} opacity={0.4} />
            <Seg a={D} b={Cc} color={C.green} width={13} opacity={0.4} />
          </Show>
          <Show when={step >= 1}>
            <Seg a={A} b={Pp} color={C.orange} width={6} draw />
            <Angle v={A} a={B} b={Pp} r={90} color={C.pink} label="α" />
            <Angle v={A} a={Pp} b={D} r={90} color={C.pink} label="α" />
          </Show>
          <Show when={step >= 3}>
            <Angle v={Pp} a={D} b={A} r={80} color={C.pink} label="α" />
          </Show>
          <Show when={step >= 5}>
            <Ticks a={A} b={D} n={2} color={C.violet} />
            <Ticks a={D} b={Pp} n={2} color={C.violet} />
          </Show>
          <circle cx={Pp.x} cy={Pp.y} r={9} fill={C.ink} />
          <Txt p={add(Pp, P(0, -48))}>P</Txt>
          <VLabels pts={pts} names={NAMES} />
          <Handle
            p={D}
            onMove={(q) => {
              const r = clamp(dist(A, q), 220, 620)
              const h = clamp(heading(A, q), 40, 85)
              const nd = polar(A, r, h)
              if (nd.y > 110 && nd.x + (B.x - A.x) < 1110) setD(nd)
            }}
          />
        </Fig>
      }
      side={
        <>
          <Card tone="white" size="sm" title="Paralelogramo ABCD">
            <M>{'\\overline{AP}'}</M>: bissetriz de <M>{'\\widehat{A}'}</M>
          </Card>
          <Card show={step >= 3} tone="pink" size="sm" title="Alternos internos">
            <M>{'\\overline{AB}\\parallel\\overline{DC}'}</M>, logo <M>{'\\widehat{DPA}\\cong\\widehat{PAB}=\\alpha'}</M>
          </Card>
          <Card show={step >= 4} tone="orange" size="sm" title="Triângulo ADP">
            Tem dois ângulos iguais a α: é <b>isósceles</b>.
          </Card>
          <Card show={step >= 5} tone="violet" size="sm" title="Então">
            <Formula tex={'DP=AD'} boxed size={46} />
          </Card>
          <Card show={step >= 2} tone="green" size="sm" title="Caminho">
            <Chain items={CHAIN} active={chain} />
          </Card>
        </>
      }
    />
  )
}

/* ───────────────────────── Definições ───────────────────────── */

export const bloco3: ScreenDef[] = [
  {
    id: 't12',
    block: 3,
    num: 12,
    title: 'Trapézio isósceles',
    minutes: 2,
    steps: [
      'Trapézio isósceles (vértice C arrastável, D simétrico)',
      'Lados não paralelos congruentes',
      'Ângulos adjacentes à mesma base congruentes',
      'Diagonais congruentes',
      'Resumo com as três propriedades',
    ],
    Component: T12,
    notes: {
      objetivo: 'Reconhecer as três propriedades do trapézio isósceles.',
      previos: ['Trapézio (Tela 9).', 'Congruência de triângulos (casos LAL e caso especial de triângulos retângulos).'],
      orientacoes: [
        'Cada propriedade tem sua cor: rosa (lados), verde/azul (ângulos), laranja (diagonais).',
        'Arraste C: D se move simetricamente, mantendo o trapézio isósceles.',
      ],
      perguntas: ['Se Â = 65°, quanto mede D̂? E B̂?', 'Qual eixo de simetria você enxerga?'],
      justificativa: [
        'Ângulos: traçando as alturas DD’ e CC’, os triângulos AD’D e BC’C são retângulos com hipotenusa e cateto congruentes; logo Â = B̂ (e, por suplementaridade, D̂ = Ĉ).',
        'Diagonais: ΔABD ≅ ΔBAC por LAL (AD = BC, Â = B̂, AB comum), logo AC = BD.',
      ],
      dificuldades: ['Estender a propriedade das diagonais para qualquer trapézio.'],
      avaliacao: 'Exercícios de trapézio isósceles usam ângulos da base iguais e a decomposição com alturas (Problema 2).',
    },
  },
  {
    id: 't13',
    block: 3,
    num: 13,
    title: 'Propriedades do paralelogramo',
    minutes: 2.5,
    steps: [
      'Paralelogramo ABCD (B e D arrastáveis)',
      'Lados opostos congruentes',
      'Ângulos opostos congruentes',
      'Ângulos consecutivos suplementares',
      'Traça as diagonais',
      'Ponto de interseção M',
      'AM = MC e BM = MD',
      'Cuidado: AC ≠ BD em geral',
    ],
    Component: T13,
    notes: {
      objetivo: 'Apresentar as propriedades do paralelogramo uma de cada vez.',
      previos: ['Alternos internos (Tela 3).', 'Casos de congruência ALA e LAL.'],
      orientacoes: [
        'Cada etapa mostra só uma propriedade; a lista acima acompanha o que já foi visto.',
        'Arraste B e D para mostrar que as propriedades valem para qualquer paralelogramo.',
        'Na última etapa, compare AC e BD: são diferentes (a menos que seja retângulo).',
      ],
      perguntas: ['Se Â = 70°, quanto medem B̂, Ĉ e D̂?', 'M é ponto médio de qual segmento?'],
      justificativa: [
        'Lados/ângulos opostos: a diagonal AC gera ΔABC ≅ ΔCDA (ALA, com alternos internos e AC comum).',
        'Consecutivos: AB ∥ CD com transversal AD, Â e D̂ são colaterais internos (180°).',
        'Diagonais: ΔAMB ≅ ΔCMD (ALA) ⇒ AM = MC e BM = MD.',
      ],
      dificuldades: ['Confundir “as diagonais se cortam ao meio” com “as diagonais são iguais”.'],
      avaliacao: 'Muitos exercícios pedem ângulos ou lados do paralelogramo a partir de um dado; e segmentos das diagonais.',
    },
  },
  {
    id: 't14',
    block: 3,
    num: 14,
    title: 'Base média do trapézio',
    minutes: 2,
    steps: [
      'Trapézio ABCD (C e D arrastáveis)',
      'Pontos médios M e N dos lados não paralelos',
      'Traça MN',
      'MN é paralelo às bases',
      'MN = (AB + CD)/2 com as medidas atuais',
      'Por quê? (diagonal AC)',
      'Exemplo: bases 14 cm e 8 cm',
      'MN = 11 cm',
    ],
    Component: T14,
    notes: {
      objetivo: 'Calcular a base média do trapézio como média aritmética das bases.',
      previos: ['Ponto médio.', 'Média aritmética.'],
      orientacoes: [
        'Arraste C e D: as medidas se atualizam e a base média é sempre a média das bases.',
        'A etapa “Por quê?” pode ser retomada depois da Tela 15.',
      ],
      perguntas: ['A base média fica mais perto da base maior ou da menor?', 'Se as bases forem iguais, que figura temos?'],
      justificativa: [
        'Diagonal AC e P = ponto médio de AC: no ΔACD, MP = CD/2; no ΔABC, PN = AB/2 (base média do triângulo). Como MP e PN são paralelos às bases, M, P, N são colineares e MN = (AB + CD)/2.',
      ],
      dificuldades: ['Somar as bases e esquecer de dividir por 2.', 'Usar os lados não paralelos na fórmula.'],
      avaliacao: 'Aplicação direta em exercícios de base média (inclusive o da verificação).',
    },
  },
  {
    id: 't15',
    block: 3,
    num: 15,
    title: 'Base média do triângulo',
    minutes: 2,
    steps: [
      'Triângulo ABC (vértice A arrastável)',
      'Pontos médios M e N',
      'Traça MN',
      'MN ∥ BC',
      'MN = BC/2',
      'Quadrilátero qualquer e os pontos médios dos lados',
      'Diagonal AC: MN e QP paralelos a AC',
      'Diagonal BD: NP e MQ paralelos a BD',
      'MNPQ é paralelogramo',
    ],
    Component: T15,
    notes: {
      objetivo: 'Aplicar a base média do triângulo e concluir que os pontos médios de um quadrilátero formam um paralelogramo.',
      previos: ['Ponto médio.', 'Definição de paralelogramo (Tela 10).'],
      orientacoes: [
        'Arraste A: MN muda de posição, mas mantém metade de BC.',
        'Na segunda parte, arraste os vértices do quadrilátero: MNPQ continua paralelogramo.',
      ],
      perguntas: ['Se BC = 18 cm, quanto mede MN?', 'Por que MN e QP são paralelos entre si?'],
      justificativa: [
        'Base média: ΔAMN ~ ΔABC na razão 1:2 (LAL), logo MN ∥ BC e MN = BC/2.',
        'Varignon: MN e QP são bases médias de ΔABC e ΔACD em relação a AC, logo são paralelos e iguais a AC/2. Dois lados opostos paralelos e congruentes ⇒ paralelogramo.',
      ],
      dificuldades: ['Unir pontos médios de lados que não são do mesmo triângulo.'],
      avaliacao: 'Exercícios que unem pontos médios dos lados de um quadrilátero e pedem o perímetro do quadrilátero formado.',
    },
  },
  {
    id: 't16',
    block: 3,
    num: 16,
    title: 'Mediana relativa à hipotenusa',
    minutes: 1.5,
    steps: [
      'Triângulo retângulo em A (A arrastável sobre a circunferência)',
      'Ponto médio M da hipotenusa',
      'Traça a mediana AM',
      'Completa o retângulo ABA’C',
      'AM = BM = CM = BC/2',
      'Circunferência de diâmetro BC',
      'Exemplo: hipotenusa de 12 cm',
      'AM = 6 cm',
    ],
    Component: T16,
    notes: {
      objetivo: 'Reconhecer que a mediana relativa à hipotenusa mede metade da hipotenusa.',
      previos: ['Triângulo retângulo, hipotenusa.', 'Diagonais do retângulo (congruentes e se cortam ao meio).'],
      orientacoes: [
        'A justificativa usa o retângulo: “dobrar” o triângulo completa ABA’C.',
        'Na etapa da circunferência, arraste A: o ângulo continua reto e AM continua igual ao raio.',
      ],
      perguntas: ['Onde fica o ponto M em relação a A, B e C?', 'Se AM = 7,5 cm, quanto mede a hipotenusa?'],
      justificativa: [
        'A’ é o simétrico de A em relação a M. ABA’C tem diagonais que se cortam ao meio (paralelogramo) e ângulo reto em A: é retângulo. No retângulo as diagonais são congruentes: AA’ = BC, logo AM = AA’/2 = BC/2.',
      ],
      dificuldades: ['Confundir mediana (vai ao ponto médio) com altura (perpendicular).'],
      avaliacao: 'Exercícios com triângulo retângulo e ponto médio da hipotenusa (cálculo direto de BC/2).',
    },
  },
  {
    id: 't17',
    block: 3,
    num: 17,
    title: 'Bissetriz e triângulo isósceles',
    minutes: 2,
    steps: [
      'Paralelogramo ABCD (D arrastável)',
      'Bissetriz de Â até P em DC',
      'Destaca AB ∥ DC',
      'Alternos internos: ângulo em P também mede α',
      'Triângulo ADP com dois ângulos α',
      'Conclusão: DP = AD',
      'Sequência lógica completa',
    ],
    Component: T17,
    notes: {
      objetivo: 'Mostrar que bissetriz + paralelismo formam um triângulo isósceles no paralelogramo.',
      previos: ['Bissetriz (Tela 4).', 'Alternos internos (Tela 3).', 'Recíproca do triângulo isósceles (Tela 5).'],
      orientacoes: [
        'Siga o caminho em verde: paralelismo → ângulos congruentes → triângulo isósceles → segmentos congruentes.',
        'Arraste D: P se move, mas DP continua igual a AD.',
      ],
      perguntas: ['Quais retas são paralelas? Qual é a transversal?', 'Qual lado é oposto a cada ângulo α no triângulo ADP?'],
      justificativa: [
        'AP é bissetriz: PAB = PAD = α. AB ∥ DC com transversal AP: DPA = PAB = α (alternos internos). No ΔADP, os ângulos em A e P são iguais, logo os lados opostos são iguais: DP = AD.',
      ],
      dificuldades: ['Não perceber que o ângulo em P é alterno interno de PAB.', 'Confundir qual lado é oposto a qual ângulo.'],
      avaliacao: 'Prepara exercícios em que a bissetriz divide o lado do paralelogramo em dois segmentos.',
    },
  },
]
