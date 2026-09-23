import { AnimatePresence, motion } from 'framer-motion'
import { useMorph, useTween } from '../../geo/hooks'
import {
  P,
  add,
  centroid,
  clamp,
  clampPt,
  isConvex,
  lerp,
  lerpN,
  mul,
  polar,
  polyAngles,
  project,
  roundToSum,
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
  Line,
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
import { Ask, Body, Card, Formula, M } from '../../ui/comic'
import type { ScreenDef, ScreenProps } from '../types'

const NAMES = ['A', 'B', 'C', 'D']

/** Alças para mover os vértices de um quadrilátero mantendo-o convexo. */
function ConvexHandles({ pts, set }: { pts: Pt[]; set: (p: Pt[]) => void }) {
  return (
    <>
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
    </>
  )
}

/* ─────────────── Tela 6 — Elementos de um quadrilátero ─────────────── */

function T6({ step }: ScreenProps) {
  const pts = [P(210, 700), P(900, 770), P(1000, 250), P(340, 160)]
  const [A, B, Cc, D] = pts
  const sideColors = [C.green, C.sky, C.pink, C.orange]
  const cmp = step >= 5
  return (
    <Body
      fig={
        <Fig>
          <Poly pts={pts} fill="#f8fafc" opacity={cmp ? 0.35 : 1} />
          <Show when={step >= 1 && !cmp}>
            {pts.map((p, i) => (
              <Seg key={i} a={p} b={pts[(i + 1) % 4]} color={sideColors[i]} width={13} opacity={0.55} />
            ))}
          </Show>
          <Show when={step >= 3 && !cmp}>
            {pts.map((p, i) => (
              <Angle key={i} v={p} a={pts[(i + 3) % 4]} b={pts[(i + 1) % 4]} r={62} color={C.violet} />
            ))}
          </Show>
          <Show when={step >= 4}>
            <Seg a={A} b={Cc} color={C.orange} width={5} dash={!cmp} />
            {!cmp && <Seg a={B} b={D} color={C.orange} width={5} dash />}
          </Show>
          <Show when={cmp}>
            <Seg a={A} b={B} color={C.green} width={12} />
            <SegLabel a={A} b={B} off={-48} color={C.green}>
              lado
            </SegLabel>
            <Seg a={A} b={Cc} color={C.orange} width={9} />
            <Txt p={add(lerp(A, Cc, 0.55), P(-10, -46))} color={C.orange}>
              diagonal
            </Txt>
          </Show>
          <Show when={step >= 2}>
            {pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={11} fill={C.ink} />
            ))}
            <VLabels pts={pts} names={NAMES} />
          </Show>
        </Fig>
      }
      side={
        <>
          <Card show={step >= 1} tone="green" size="sm" title="Lados">
            4 lados: <M>{'\\overline{AB},\\ \\overline{BC},\\ \\overline{CD},\\ \\overline{DA}'}</M>
          </Card>
          <Card show={step >= 2} tone="white" size="sm" title="Vértices">
            4 vértices: A, B, C e D
          </Card>
          <Card show={step >= 3} tone="violet" size="sm" title="Ângulos internos">
            <M>{'\\widehat{A},\\ \\widehat{B},\\ \\widehat{C},\\ \\widehat{D}'}</M>
          </Card>
          <Card show={step >= 4} tone="orange" size="sm" title="Diagonais">
            2 diagonais: <M>{'\\overline{AC}'}</M> e <M>{'\\overline{BD}'}</M>
          </Card>
          <Card show={step >= 5} tone="sky" size="sm" title="Lado × diagonal">
            <div>
              <b className="text-green-700">Lado</b>: une vértices <b>consecutivos</b> (A e B).
            </div>
            <div className="mt-1">
              <b className="text-orange-600">Diagonal</b>: une vértices <b>não consecutivos</b> (A e C).
            </div>
          </Card>
        </>
      }
    />
  )
}

/* ─────────────── Tela 7 — Soma dos ângulos internos do quadrilátero ─────────────── */

const QUAD0 = [P(190, 690), P(880, 780), P(1000, 280), P(380, 150)]

function T7({ step }: ScreenProps) {
  const [pts, setPts] = useScreenState<Pt[]>('pts', QUAD0)
  const [A, B, Cc, D] = pts
  const meas = roundToSum(polyAngles(pts), 360)
  const g1 = centroid([A, B, Cc])
  const g2 = centroid([A, Cc, D])
  return (
    <Body
      fig={
        <Fig>
          <Show when={step >= 2}>
            <Poly pts={[A, B, Cc]} fill={C.skyL} stroke="none" />
            <Poly pts={[A, Cc, D]} fill={C.pinkL} stroke="none" />
          </Show>
          <Show when={step >= 3 && step < 5}>
            <Angle v={A} a={B} b={Cc} r={70} color={C.sky} />
            <Angle v={B} a={Cc} b={A} r={70} color={C.sky} />
            <Angle v={Cc} a={A} b={B} r={70} color={C.sky} />
            <Angle v={A} a={Cc} b={D} r={95} color={C.pink} />
            <Angle v={Cc} a={D} b={A} r={95} color={C.pink} />
            <Angle v={D} a={A} b={Cc} r={70} color={C.pink} />
            <Txt p={g1} color={C.sky} size={54}>
              180°
            </Txt>
            <Txt p={g2} color={C.pink} size={54}>
              180°
            </Txt>
          </Show>
          <Show when={step >= 5}>
            {pts.map((p, i) => (
              <Angle key={i} v={p} a={pts[(i + 3) % 4]} b={pts[(i + 1) % 4]} r={70} color={C.green} label={`${meas[i]}°`} />
            ))}
          </Show>
          <Poly pts={pts} />
          <Show when={step >= 1}>
            <Seg a={A} b={Cc} color={C.orange} width={5} dash />
          </Show>
          <VLabels pts={pts} names={NAMES} />
          <ConvexHandles pts={pts} set={setPts} />
        </Fig>
      }
      side={
        <>
          <Card show={step >= 1} tone="orange" size="sm" title="Diagonal AC">
            Divide o quadrilátero em <b>dois triângulos</b>.
          </Card>
          <Card show={step >= 3} tone="sky" size="sm" title="Cada triângulo">
            Soma dos ângulos internos: <b>180°</b>
          </Card>
          <Card show={step >= 4} tone="pink" title="Juntando">
            <Formula tex={'180^\\circ+180^\\circ=360^\\circ'} />
          </Card>
          <Card show={step >= 5} tone="green" title="Conclusão">
            <Formula tex={'\\widehat{A}+\\widehat{B}+\\widehat{C}+\\widehat{D}=360^\\circ'} boxed size={46} />
            <div className="mt-2 text-center" style={{ fontSize: 36 }}>
              <M>{`${meas[0]}^\\circ+${meas[1]}^\\circ+${meas[2]}^\\circ+${meas[3]}^\\circ=360^\\circ`}</M>
            </div>
          </Card>
        </>
      }
    />
  )
}

/* ─────────────── Tela 8 — Ângulos externos do quadrilátero ─────────────── */

const QUAD8 = [P(230, 680), P(820, 760), P(930, 330), P(420, 210)]
const WEDGE = [C.orange, C.sky, C.pink, C.violet]

function T8({ step }: ScreenProps) {
  const [pts, setPts] = useScreenState<Pt[]>('pts', QUAD8)
  const inner = roundToSum(polyAngles(pts), 360)
  const outer = inner.map((v) => 180 - v)
  // Em cada vértice, prolonga o lado que chega (percurso A→B→C→D→A).
  const ext = pts.map((p, i) => {
    const prev = pts[(i + 3) % 4]
    return add(p, mul(unit(sub(p, prev)), 210))
  })
  const focus = step === 3
  return (
    <Body
      fig={
        <Fig>
          <Poly pts={pts} fill="#f8fafc" />
          {pts.map((p, i) => (
            <g key={`i${i}`}>
              <Angle
                v={p}
                a={pts[(i + 3) % 4]}
                b={pts[(i + 1) % 4]}
                r={58}
                color={C.green}
                label={focus && i !== 1 ? undefined : `${inner[i]}°`}
                labelSize={34}
              />
            </g>
          ))}
          <Show when={step >= 1}>
            {pts.map((p, i) => (
              <Seg key={i} a={p} b={ext[i]} color={C.gray} width={AUX} dash />
            ))}
          </Show>
          <Show when={step >= 2}>
            {pts.map((p, i) => (
              <g key={i} opacity={focus && i !== 1 ? 0.25 : 1}>
                <Angle
                  v={p}
                  a={ext[i]}
                  b={pts[(i + 1) % 4]}
                  r={84}
                  color={WEDGE[i]}
                  label={`E${SUB[i]} = ${outer[i]}°`}
                  labelSize={34}
                  labelR={150}
                />
              </g>
            ))}
          </Show>
          <VLabels pts={pts} names={NAMES} d={40} />
          <ConvexHandles pts={pts} set={setPts} />
        </Fig>
      }
      side={
        <>
          <Card show={step >= 1} tone="white" size="sm" title="Prolongamentos">
            Em cada vértice, prolongamos um lado, sempre no mesmo sentido de percurso.
          </Card>
          <Card show={step >= 3} tone="orange" size="sm" title="Em cada vértice">
            Interno + externo formam um ângulo raso:
            <Formula tex={`${inner[1]}^\\circ+${outer[1]}^\\circ=180^\\circ`} size={42} />
          </Card>
          <Card show={step >= 4 && step < 6} tone="sky" size="sm" title="Nos 4 vértices">
            <Formula tex={'(\\text{internos})+(\\text{externos})=4\\cdot180^\\circ=720^\\circ'} size={34} />
          </Card>
          <Card show={step >= 5 && step < 6} tone="pink" size="sm">
            <Formula tex={'360^\\circ+(\\text{externos})=720^\\circ'} size={36} />
          </Card>
          <Card show={step >= 6} tone="green" title="Conclusão">
            <Formula tex={'E_1+E_2+E_3+E_4=360^\\circ'} boxed size={46} />
            <div className="flex items-center gap-4">
              <svg viewBox="-110 -110 220 220" width={190} height={190}>
                {(() => {
                  let acc = 90
                  return outer.map((v, i) => {
                    const a0 = acc
                    acc += v
                    const p1 = polar(P(0, 0), 100, a0)
                    const p2 = polar(P(0, 0), 100, acc)
                    const large = v > 180 ? 1 : 0
                    return (
                      <path
                        key={i}
                        d={`M0 0 L${p1.x} ${p1.y} A100 100 0 ${large} 0 ${p2.x} ${p2.y} Z`}
                        fill={WEDGE[i]}
                        stroke="#fff"
                        strokeWidth={4}
                      />
                    )
                  })
                })()}
              </svg>
              <div style={{ fontSize: 30 }}>
                Juntos, os externos dão <b>uma volta completa</b>.
              </div>
            </div>
          </Card>
        </>
      }
    />
  )
}
const SUB = ['₁', '₂', '₃', '₄']
const AUX = 4

/* ─────────────── Tela 9 — Trapézio ─────────────── */

interface TrapState {
  dx: number
  cx: number
  y: number
}

function T9({ step }: ScreenProps) {
  const A = P(150, 740)
  const B = P(1000, 740)
  const [st, setSt] = useScreenState<TrapState>('trap', { dx: 330, cx: 780, y: 290 })
  const t = useMorph(step >= 1)
  // Estado inicial: D mais alto que C (lados opostos não paralelos).
  const D = P(st.dx, lerpN(st.y - 150, st.y, t))
  const Cc = P(st.cx, lerpN(st.y + 40, st.y, t))
  const pts = [A, B, Cc, D]
  const [ma, mb, mc, md] = roundToSum(polyAngles(pts), 360)
  const H = project(D, A, B)
  const par = step >= 1 && t > 0.98
  const move = (which: 'D' | 'C') => (q: Pt) => {
    const y = clamp(q.y, 150, 600)
    if (which === 'D') setSt({ ...st, y, dx: clamp(q.x, 90, st.cx - 120) })
    else setSt({ ...st, y, cx: clamp(q.x, st.dx + 120, Math.min(1080, st.dx + 780)) })
  }
  return (
    <Body
      fig={
        <Fig>
          <Poly pts={pts} fill="#f8fafc" />
          <Show when={step >= 4}>
            <Seg a={D} b={H} color={C.gray} width={AUX} dash />
            <RightMark v={H} a={B} b={D} />
            <Txt p={add(lerp(D, H, 0.5), P(30, 0))} color={C.gray} anchor="start">
              h
            </Txt>
          </Show>
          <Show when={par}>
            <ParArrows a={A} b={B} at={0.62} />
            <ParArrows a={D} b={Cc} at={0.62} />
          </Show>
          <Show when={step >= 2}>
            <Seg a={A} b={B} color={C.green} width={12} opacity={0.45} />
            <Seg a={D} b={Cc} color={C.green} width={12} opacity={0.45} />
            <SegLabel a={B} b={A} off={-52} color={C.greenD}>
              {step >= 3 ? 'base maior' : 'base'}
            </SegLabel>
            <SegLabel a={D} b={Cc} off={-52} color={C.greenD}>
              {step >= 3 ? 'base menor' : 'base'}
            </SegLabel>
          </Show>
          <Show when={step >= 3}>
            <Seg a={A} b={D} color={C.violet} width={12} opacity={0.4} />
            <Seg a={B} b={Cc} color={C.violet} width={12} opacity={0.4} />
          </Show>
          <Show when={step >= 5}>
            <Angle v={A} a={B} b={D} r={70} color={C.pink} label={`${ma}°`} />
            <Angle v={D} a={A} b={Cc} r={70} color={C.pink} label={`${md}°`} />
            <Angle v={B} a={Cc} b={A} r={70} n={2} color={C.sky} label={`${mb}°`} />
            <Angle v={Cc} a={D} b={B} r={70} n={2} color={C.sky} label={`${mc}°`} />
          </Show>
          <VLabels pts={pts} names={NAMES} />
          {step >= 2 && (
            <>
              <Handle p={D} onMove={move('D')} />
              <Handle p={Cc} onMove={move('C')} />
            </>
          )}
        </Fig>
      }
      side={
        <>
          <Ask show={step < 2}>Algum par de lados opostos é paralelo?</Ask>
          <Card show={step >= 2} tone="green" title="Definição">
            <b>Trapézio</b> é o quadrilátero convexo que tem <b>pelo menos um par</b> de lados opostos paralelos.
          </Card>
          <Card show={step >= 3} tone="violet" size="sm">
            <M>{'\\overline{AB}\\parallel\\overline{CD}'}</M> são as <b>bases</b>; <M>{'\\overline{AD}'}</M> e{' '}
            <M>{'\\overline{BC}'}</M> são os lados não paralelos.
          </Card>
          <Card show={step >= 4} tone="white" size="sm" title="Altura">
            <b>h</b> é a distância entre as bases.
          </Card>
          <Card show={step >= 5} tone="pink" size="sm" title="Ângulos suplementares">
            <M>{`\\widehat{A}+\\widehat{D}=${ma}^\\circ+${md}^\\circ=180^\\circ`}</M>
            <br />
            <M>{`\\widehat{B}+\\widehat{C}=${mb}^\\circ+${mc}^\\circ=180^\\circ`}</M>
          </Card>
        </>
      }
    />
  )
}

/* ─────────────── Tela 10 — Paralelogramo ─────────────── */

function T10({ step }: ScreenProps) {
  const A = P(160, 730)
  const [st, setSt] = useScreenState<{ B: Pt; D: Pt }>('par', { B: P(800, 730), D: P(370, 270) })
  const { B, D } = st
  const cTrap = add(D, mul(sub(B, A), 0.55))
  const cPar = add(B, sub(D, A))
  const t = useMorph(step >= 2, 1400)
  const Cc = lerp(cTrap, cPar, t)
  const pts = [A, B, Cc, D]
  const done = step >= 2 && t > 0.98
  return (
    <Body
      fig={
        <Fig>
          <Poly pts={pts} fill={done ? C.skyL : '#f8fafc'} />
          <ParArrows a={A} b={B} at={0.5} />
          <ParArrows a={D} b={Cc} at={0.5} />
          <Show when={step === 1}>
            <Line a={B} b={add(B, sub(D, A))} extA={60} extB={120} color={C.sky} width={AUX} dash />
          </Show>
          <Show when={done}>
            <ParArrows a={A} b={D} n={2} color={C.sky} />
            <ParArrows a={B} b={Cc} n={2} color={C.sky} />
          </Show>
          <VLabels pts={pts} names={NAMES} />
          {step >= 5 && (
            <>
              <Handle p={B} onMove={(q) => setSt({ ...st, B: P(clamp(q.x, A.x + 250, 760), A.y) })} />
              <Handle
                p={D}
                onMove={(q) => {
                  const nd = clampPt(q, A.x + 20, 140, A.x + 340, A.y - 220)
                  setSt({ ...st, D: nd })
                }}
              />
              <DragHint p={D} />
            </>
          )}
        </Fig>
      }
      side={
        <>
          <Card tone="white" size="sm" title="Um trapézio">
            <M>{'\\overline{AB}\\parallel\\overline{CD}'}</M>
          </Card>
          <Card show={step >= 1 && step < 3} tone="sky" size="sm">
            Vamos mover C até que <M>{'\\overline{BC}\\parallel\\overline{AD}'}</M>.
          </Card>
          <Card show={step >= 3} tone="sky" title="Definição">
            <b>Paralelogramo</b> é o quadrilátero convexo que tem <b>dois pares</b> de lados opostos paralelos.
          </Card>
          <Card show={step >= 4} tone="green" title="Caso particular">
            <svg viewBox="0 0 600 300" width="100%">
              <ellipse cx="300" cy="150" rx="290" ry="140" fill="#fff" stroke="#1e293b" strokeWidth="5" />
              <ellipse cx="330" cy="170" rx="210" ry="105" fill="#dcfce7" stroke="#16a34a" strokeWidth="5" />
              <ellipse cx="360" cy="185" rx="120" ry="62" fill="#e0f2fe" stroke="#0284c7" strokeWidth="5" />
              <text x="300" y="40" textAnchor="middle" fontSize="30" fontWeight="800" fill="#1e293b">
                Quadriláteros
              </text>
              <text x="290" y="100" textAnchor="middle" fontSize="30" fontWeight="800" fill="#166534">
                Trapézios
              </text>
              <text x="360" y="195" textAnchor="middle" fontSize="28" fontWeight="800" fill="#075985">
                Paralelogramos
              </text>
            </svg>
            <div style={{ fontSize: 30 }}>Todo paralelogramo é um trapézio.</div>
          </Card>
        </>
      }
    />
  )
}

/* ─────────────── Tela 11 — Retângulo, losango e quadrado ─────────────── */

const SHAPES = [
  { a: 520, b: 330, th: 62 },
  { a: 520, b: 330, th: 90 },
  { a: 400, b: 400, th: 58 },
  { a: 400, b: 400, th: 90 },
]
const DEFS = [
  { t: 'Paralelogramo', tone: 'sky', d: 'Dois pares de lados opostos paralelos.' },
  { t: 'Retângulo', tone: 'pink', d: 'Paralelogramo com quatro ângulos retos.' },
  { t: 'Losango', tone: 'orange', d: 'Paralelogramo com quatro lados congruentes.' },
  { t: 'Quadrado', tone: 'violet', d: 'Paralelogramo com quatro lados congruentes e quatro ângulos retos.' },
] as const

function T11({ step }: ScreenProps) {
  const s = SHAPES[Math.min(step, 3)]
  const a = useTween(s.a)
  const b = useTween(s.b)
  const th = useTween(s.th)
  const A0 = P(0, 0)
  const B0 = P(a, 0)
  const D0 = polar(A0, b, th)
  const C0 = add(B0, sub(D0, A0))
  const g = centroid([A0, B0, C0, D0])
  const shift = sub(P(570, 450), g)
  const pts = [A0, B0, C0, D0].map((p) => add(p, shift))
  const right = Math.abs(th - 90) < 0.5
  const equal = Math.abs(a - b) < 0.5
  const def = DEFS[Math.min(step, 3)]
  const fill = [C.skyL, C.pinkL, C.orangeL, C.violetL][Math.min(step, 3)]
  return (
    <Body
      fig={
        <AnimatePresence mode="wait">
          {step < 4 ? (
            <motion.div key="fig" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <Fig>
                <Poly pts={pts} fill={fill} />
                <Show when={right}>
                  {pts.map((p, i) => (
                    <RightMark key={i} v={p} a={pts[(i + 3) % 4]} b={pts[(i + 1) % 4]} s={34} />
                  ))}
                </Show>
                <Show when={equal}>
                  {pts.map((p, i) => (
                    <Ticks key={i} a={p} b={pts[(i + 1) % 4]} color={C.orange} />
                  ))}
                </Show>
                <Show when={!equal}>
                  <Ticks a={pts[0]} b={pts[1]} color={C.pink} />
                  <Ticks a={pts[2]} b={pts[3]} color={C.pink} />
                  <Ticks a={pts[1]} b={pts[2]} n={2} color={C.sky} />
                  <Ticks a={pts[3]} b={pts[0]} n={2} color={C.sky} />
                </Show>
                <VLabels pts={pts} names={NAMES} />
              </Fig>
            </motion.div>
          ) : (
            <motion.div key="euler" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Euler />
            </motion.div>
          )}
        </AnimatePresence>
      }
      side={
        <>
          <Card tone="white" title="Família dos paralelogramos" size="sm">
            <Tree step={step} />
          </Card>
          {step < 4 ? (
            <Card key={def.t} tone={def.tone} title={def.t}>
              {def.d}
            </Card>
          ) : (
            <Card tone="violet" title="Atenção">
              O <b>quadrado</b> é, ao mesmo tempo, <b>retângulo</b> e <b>losango</b>.
            </Card>
          )}
        </>
      }
    />
  )
}

function Tree({ step }: { step: number }) {
  const node = (x: number, y: number, label: string, color: string, on: boolean, active: boolean) => (
    <g opacity={on ? 1 : 0.12} style={{ transition: 'opacity .5s' }}>
      <rect x={x - 130} y={y - 34} width={260} height={68} rx={20} fill="#fff" stroke={color} strokeWidth={active ? 8 : 4} />
      <text x={x} y={y + 2} textAnchor="middle" dominantBaseline="central" fontSize={32} fontWeight={800} fill={color}>
        {label}
      </text>
    </g>
  )
  const edge = (x1: number, y1: number, x2: number, y2: number, on: boolean) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#475569" strokeWidth={4} opacity={on ? 1 : 0.12} style={{ transition: 'opacity .5s' }} />
  )
  const s = Math.min(step, 4)
  return (
    <svg viewBox="0 0 600 330" width="100%">
      {edge(300, 74, 150, 136, s >= 1)}
      {edge(300, 74, 450, 136, s >= 2)}
      {edge(150, 204, 300, 256, s >= 3)}
      {edge(450, 204, 300, 256, s >= 3)}
      {node(300, 40, 'Paralelogramo', C.sky, true, s === 0)}
      {node(150, 170, 'Retângulo', C.pink, s >= 1, s === 1)}
      {node(450, 170, 'Losango', C.orange, s >= 2, s === 2)}
      {node(300, 290, 'Quadrado', C.violet, s >= 3, s >= 3)}
    </svg>
  )
}

function Euler() {
  return (
    <svg viewBox="0 0 1140 880" width={1140} height={880} style={{ fontFamily: "'Nunito', sans-serif" }}>
      <rect x={60} y={60} width={1020} height={760} rx={60} fill="#fff" stroke={C.ink} strokeWidth={6} />
      <text x={570} y={120} textAnchor="middle" fontSize={50} fontWeight={900} fill={C.ink}>
        Paralelogramos
      </text>
      <ellipse cx={420} cy={430} rx={290} ry={220} fill={C.pink} fillOpacity={0.16} stroke={C.pink} strokeWidth={6} />
      <ellipse cx={720} cy={430} rx={290} ry={220} fill={C.orange} fillOpacity={0.16} stroke={C.orange} strokeWidth={6} />
      <rect x={210} y={340} width={160} height={100} fill="#fff" stroke={C.pink} strokeWidth={5} />
      <text x={290} y={500} textAnchor="middle" fontSize={40} fontWeight={900} fill={C.pink}>
        Retângulos
      </text>
      <polygon points="850,320 920,390 850,460 780,390" fill="#fff" stroke={C.orange} strokeWidth={5} />
      <text x={850} y={500} textAnchor="middle" fontSize={40} fontWeight={900} fill={C.orange}>
        Losangos
      </text>
      <rect x={520} y={330} width={100} height={100} fill={C.violetL} stroke={C.violet} strokeWidth={6} />
      <text x={570} y={480} textAnchor="middle" fontSize={36} fontWeight={900} fill={C.violet}>
        Quadrados
      </text>
      <polygon points="180,770 360,770 420,680 240,680" fill={C.skyL} stroke={C.sky} strokeWidth={5} />
      <text x={450} y={735} fontSize={32} fontWeight={800} fill={C.sky}>
        nem retângulo, nem losango
      </text>
    </svg>
  )
}

/* ───────────────────────── Definições ───────────────────────── */

export const bloco2: ScreenDef[] = [
  {
    id: 't6',
    block: 2,
    num: 6,
    title: 'Elementos de um quadrilátero',
    minutes: 1.5,
    steps: ['Quadrilátero convexo', 'Os quatro lados', 'Os quatro vértices', 'Os quatro ângulos internos', 'As duas diagonais', 'Lado × diagonal'],
    Component: T6,
    notes: {
      objetivo: 'Nomear e identificar lados, vértices, ângulos internos e diagonais; distinguir lado de diagonal.',
      previos: ['Polígono, segmento, vértice.'],
      orientacoes: [
        'Nomeie sempre seguindo a ordem dos vértices (ABCD): lados consecutivos compartilham um vértice.',
        'Na última etapa, compare AB (lado) com AC (diagonal).',
      ],
      perguntas: ['Quais vértices são consecutivos ao vértice A?', 'Por que BD é diagonal e não lado?'],
      justificativa: ['Diagonal é o segmento cujos extremos são vértices não consecutivos; um quadrilátero tem 4·(4−3)/2 = 2 diagonais.'],
      dificuldades: ['Ler o quadrilátero fora de ordem (ex.: ACBD), trocando lados por diagonais.'],
      avaliacao: 'Nomear corretamente lados e diagonais é necessário para interpretar todos os enunciados.',
    },
  },
  {
    id: 't7',
    block: 2,
    num: 7,
    title: 'Ângulos internos do quadrilátero',
    minutes: 1.5,
    steps: [
      'Quadrilátero ABCD (vértices arrastáveis)',
      'Traça a diagonal AC',
      'Destaca os dois triângulos',
      'Ângulos de cada triângulo: 180°',
      '180° + 180° = 360°',
      'Conclusão com as medidas dos 4 ângulos',
    ],
    Component: T7,
    notes: {
      objetivo: 'Demonstrar que a soma dos ângulos internos de qualquer quadrilátero convexo é 360°.',
      previos: ['Soma dos ângulos internos do triângulo (Tela 1).'],
      orientacoes: [
        'Observe que os ângulos Â e Ĉ ficam “repartidos” entre os dois triângulos.',
        'Na última etapa, arraste vértices: as medidas mudam, a soma permanece 360°.',
      ],
      perguntas: ['Quantos triângulos a diagonal forma?', 'E em um pentágono, quantos triângulos teríamos?'],
      justificativa: [
        'A diagonal AC divide ABCD em ABC e ACD. Os ângulos desses triângulos compõem exatamente os ângulos Â, B̂, Ĉ, D̂. Logo a soma é 2·180° = 360°.',
      ],
      dificuldades: ['Somar os 6 ângulos dos triângulos e achar que são “6 ângulos do quadrilátero”.'],
      avaliacao: 'Usada diretamente em exercícios de cálculo de um ângulo desconhecido (como o Problema 1).',
    },
  },
  {
    id: 't8',
    block: 2,
    num: 8,
    title: 'Ângulos externos do quadrilátero',
    minutes: 2,
    steps: [
      'Quadrilátero com ângulos internos (vértices arrastáveis)',
      'Prolonga um lado em cada vértice',
      'Destaca os ângulos externos E₁ a E₄',
      'Interno + externo = 180° em cada vértice',
      'Nos 4 vértices: 4 · 180° = 720°',
      '360° + externos = 720°',
      'Conclusão: E₁ + E₂ + E₃ + E₄ = 360° (volta completa)',
    ],
    Component: T8,
    notes: {
      objetivo: 'Justificar que a soma dos ângulos externos de um quadrilátero convexo é 360°.',
      previos: ['Ângulos suplementares (Tela 2).', 'Soma dos internos = 360° (Tela 7).'],
      orientacoes: [
        'Imagine alguém caminhando pelo contorno: em cada vértice, gira o ângulo externo. Ao voltar ao início, deu uma volta completa (360°).',
        'O gráfico de setores final reúne os quatro externos em torno de um ponto.',
      ],
      perguntas: ['Se um ângulo interno mede 100°, quanto mede o externo adjacente?', 'Essa soma muda se o quadrilátero mudar?'],
      justificativa: ['Em cada vértice: interno + externo = 180°. Somando: 360° + (E₁+E₂+E₃+E₄) = 720°, logo E₁+E₂+E₃+E₄ = 360°.'],
      dificuldades: ['Prolongar lados em sentidos diferentes e marcar o ângulo errado.', 'Achar que o externo é o “replemento” (360° − interno).'],
      avaliacao: 'Exercícios que pedem ângulo externo usam a relação interno + externo = 180°.',
    },
  },
  {
    id: 't9',
    block: 2,
    num: 9,
    title: 'Trapézio',
    minutes: 1.5,
    steps: [
      'Quadrilátero sem lados paralelos',
      'Transforma: um par de lados opostos fica paralelo',
      'Destaca as bases e a definição',
      'Base maior, base menor e lados não paralelos',
      'Altura h',
      'Ângulos adjacentes a um lado não paralelo: suplementares',
    ],
    Component: T9,
    notes: {
      objetivo: 'Definir trapézio, identificar bases, altura e lados não paralelos; relacionar os ângulos.',
      previos: ['Retas paralelas e transversal (Tela 3).', 'Ângulos suplementares (Tela 2).'],
      orientacoes: [
        'Use a definição do material: “pelo menos um par” de lados opostos paralelos.',
        'A partir da etapa 3, arraste C e D: a base menor continua paralela à maior.',
      ],
      perguntas: ['Qual lado funciona como transversal para Â e D̂?', 'A altura pode ficar fora do trapézio?'],
      justificativa: [
        'AB ∥ CD e AD é transversal: Â e D̂ são colaterais internos, portanto suplementares (Â + D̂ = 180°). O mesmo vale para B̂ e Ĉ com a transversal BC.',
      ],
      dificuldades: ['Achar que a base é sempre o lado “de baixo”.', 'Confundir altura com lado não paralelo.'],
      avaliacao: 'Exercícios com ângulos de trapézios usam a suplementaridade; a altura aparece no Problema 2.',
    },
  },
  {
    id: 't10',
    block: 2,
    num: 10,
    title: 'Paralelogramo',
    minutes: 1.5,
    steps: [
      'Um trapézio (AB ∥ CD)',
      'Reta guia por B paralela a AD',
      'Move C até que BC ∥ AD',
      'Definição de paralelogramo',
      'Paralelogramo como caso particular de trapézio',
      'Manipulação: continua paralelogramo',
    ],
    Component: T10,
    notes: {
      objetivo: 'Definir paralelogramo e reconhecê-lo como caso particular de trapézio (definição do material).',
      previos: ['Definição de trapézio (Tela 9).'],
      orientacoes: [
        'Deixe claro que usamos a definição inclusiva: trapézio tem “pelo menos um” par de lados paralelos.',
        'Na última etapa, arraste B e D: C é recalculado para manter os dois pares de lados paralelos.',
      ],
      perguntas: ['O paralelogramo tem pelo menos um par de lados paralelos? Então é trapézio?', 'Todo trapézio é paralelogramo?'],
      justificativa: ['Construção: C = B + (D − A), ou seja, o vetor BC é igual ao vetor AD; por isso BC ∥ AD e DC ∥ AB.'],
      dificuldades: ['Resistência à ideia “paralelogramo é trapézio” (definições exclusivas de outras fontes).'],
      avaliacao: 'Classificar corretamente a figura é o primeiro passo em todos os exercícios.',
    },
  },
  {
    id: 't11',
    block: 2,
    num: 11,
    title: 'Retângulo, losango e quadrado',
    minutes: 2,
    steps: ['Paralelogramo', 'Transforma em retângulo', 'Transforma em losango', 'Transforma em quadrado', 'Diagrama de relações'],
    Component: T11,
    notes: {
      objetivo: 'Classificar os paralelogramos notáveis e perceber o quadrado como retângulo e losango ao mesmo tempo.',
      previos: ['Definição de paralelogramo.', 'Ângulo reto e segmentos congruentes.'],
      orientacoes: [
        'Chame atenção para o que muda em cada transformação: ângulos (retângulo) ou lados (losango).',
        'No diagrama final, o quadrado está na interseção.',
      ],
      perguntas: ['Todo quadrado é retângulo? Todo retângulo é quadrado?', 'Um losango pode ter ângulos retos?'],
      justificativa: ['Retângulo, losango e quadrado são paralelogramos: herdam todas as suas propriedades.'],
      dificuldades: ['Visão “exclusiva” das categorias (achar que quadrado não é losango).', 'Chamar losango de “quadrado torto”.'],
      avaliacao: 'Exercícios de retângulo/losango/quadrado usam as propriedades do paralelogramo mais as específicas.',
    },
  },
]

