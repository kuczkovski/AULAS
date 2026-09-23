import { motion } from 'framer-motion'
import { useMorph, useTween } from '../../geo/hooks'
import {
  P,
  add,
  angleAt,
  clamp,
  heading,
  lerp,
  mid,
  polar,
  polyAngles,
  roundToSum,
  triFromAngles,
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
  Show,
  Ticks,
  Txt,
  VLabels,
  arcPath,
} from '../../geo/svg'
import { useScreenState } from '../../state/store'
import { Ask, Body, Card, Formula, M, Mascot } from '../../ui/comic'
import type { ScreenDef, ScreenProps } from '../types'

/* ───────────────────────── Abertura ───────────────────────── */

function MiniFig({ pts, color, fill, marks }: { pts: Pt[]; color: string; fill: string; marks?: React.ReactNode }) {
  return (
    <svg viewBox="0 0 260 200" width={260} height={200}>
      <Poly pts={pts} fill={fill} stroke={color} width={7} />
      {marks}
    </svg>
  )
}

function Abertura({ step }: ScreenProps) {
  const figs = [
    { name: 'Trapézio', pts: [P(20, 170), P(240, 170), P(185, 40), P(75, 40)], c: C.green, f: C.greenL },
    { name: 'Paralelogramo', pts: [P(20, 170), P(190, 170), P(240, 40), P(70, 40)], c: C.sky, f: C.skyL },
    { name: 'Retângulo', pts: [P(30, 170), P(230, 170), P(230, 40), P(30, 40)], c: C.pink, f: C.pinkL },
    { name: 'Losango', pts: [P(130, 190), P(240, 105), P(130, 20), P(20, 105)], c: C.orange, f: C.orangeL },
    { name: 'Quadrado', pts: [P(65, 170), P(195, 170), P(195, 40), P(65, 40)], c: C.violet, f: C.violetL },
  ]
  const road = [
    ['1', 'Conhecimentos prévios', '#0284c7'],
    ['2', 'Reconhecer quadriláteros', '#16a34a'],
    ['3', 'Propriedades', '#db2777'],
    ['4', 'Aplicação', '#ea580c'],
    ['5', 'Verificação', '#7c3aed'],
  ]
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingBottom: 40 }}>
      <div className="flex items-center gap-8">
        <Mascot size={190} />
        <div>
          <div className="font-comic leading-none text-green-800" style={{ fontSize: 112 }}>
            Geometria em Quadrinhos
          </div>
          <div className="font-extrabold text-pink-600" style={{ fontSize: 64 }}>
            Quadriláteros notáveis
          </div>
        </div>
      </div>
      <div className="mt-14 flex gap-7">
        {figs.map((f, i) => (
          <motion.div
            key={f.name}
            initial={{ opacity: 0, y: 30, rotate: i % 2 ? 2 : -2 }}
            animate={{ opacity: 1, y: 0, rotate: i % 2 ? 1.5 : -1.5 }}
            transition={{ delay: 0.12 * i, type: 'spring', stiffness: 200, damping: 18 }}
            className="comic-card flex flex-col items-center"
            style={{ borderColor: f.c, padding: '18px 18px 10px' }}
          >
            <MiniFig pts={f.pts} color={f.c} fill={f.f} />
            <div className="font-extrabold" style={{ fontSize: 34, color: f.c }}>
              {f.name}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-14 flex gap-3" style={{ minHeight: 110 }}>
        {step >= 1 &&
          road.map(([n, t, c], i) => (
            <motion.div
              key={n}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 * i }}
              className="flex items-center gap-3 whitespace-nowrap rounded-2xl border-4 bg-white px-4 py-3"
              style={{ borderColor: c }}
            >
              <span
                className="font-comic flex items-center justify-center rounded-full text-white"
                style={{ background: c, width: 54, height: 54, fontSize: 32 }}
              >
                {n}
              </span>
              <span className="font-extrabold" style={{ fontSize: 29, color: '#1e293b' }}>
                {t}
              </span>
            </motion.div>
          ))}
      </div>
    </div>
  )
}

/* ─────────────── Tela 1 — Soma dos ângulos internos do triângulo ─────────────── */

function T1({ step }: ScreenProps) {
  const A = P(170, 760)
  const B = P(970, 760)
  const [Cd, setC] = useScreenState<Pt>('C', P(660, 190))
  const ex = triFromAngles(A, 800, 50, 60)[2]
  const t = useMorph(step >= 3)
  const Cc = lerp(Cd, ex, t)
  const pts = [A, B, Cc]
  const [a, b, c] = roundToSum(polyAngles(pts), 180)
  const example = step >= 3
  const la = example ? '50°' : `${a}°`
  const lb = example ? '60°' : `${b}°`
  const lc = example ? (step >= 5 ? '70°' : 'x') : `${c}°`
  return (
    <Body
      fig={
        <Fig>
          <Poly pts={pts} fill="#f8fafc" />
          <Show when={step >= 1}>
            <Angle v={A} a={B} b={Cc} r={80} color={C.green} label={la} labelSize={44} />
            <Angle v={B} a={A} b={Cc} r={80} color={C.sky} label={lb} labelSize={44} />
            <Angle v={Cc} a={A} b={B} r={70} color={C.pink} label={lc} labelSize={44} />
          </Show>
          <VLabels pts={pts} names={['A', 'B', 'C']} />
          {step < 3 && (
            <>
              <Handle p={Cc} onMove={(p) => setC({ x: clamp(p.x, 140, 1000), y: clamp(p.y, 110, 640) })} />
              {step >= 1 && <DragHint p={Cc} dy={-70} />}
            </>
          )}
        </Fig>
      }
      side={
        <>
          <Card show={step >= 1 && step < 3} tone="sky" title="Ângulos internos">
            Três ângulos: <M>{'\\widehat{A},\\ \\widehat{B},\\ \\widehat{C}'}</M>
            <div className="mt-2 text-slate-600" style={{ fontSize: 30 }}>
              Arraste o vértice C e observe as medidas.
            </div>
          </Card>
          <Card show={step >= 2} tone="green" title="Propriedade">
            <Formula tex={'\\widehat{A}+\\widehat{B}+\\widehat{C}=180^\\circ'} boxed size={54} />
          </Card>
          <Ask show={step >= 3}>Dois ângulos medem 50° e 60°. Quanto mede o terceiro?</Ask>
          <Card show={step >= 4} tone="pink" title="Resolução">
            <Formula tex={'50^\\circ+60^\\circ+x=180^\\circ'} />
            {step >= 5 && <Formula tex={'x=70^\\circ'} boxed />}
          </Card>
        </>
      }
    />
  )
}

/* ─────────────── Tela 2 — Ângulos suplementares ─────────────── */

function T2({ step }: ScreenProps) {
  const O = P(570, 600)
  const L = P(60, 600)
  const R = P(1080, 600)
  const [phiD, setPhi] = useScreenState('phi', 48)
  const phi = useTween(step >= 3 ? 120 : phiD, 1000)
  const Q = polar(O, 360, phi)
  const al = Math.round(phi)
  const be = 180 - al
  const ex = step >= 3
  return (
    <Body
      fig={
        <Fig>
          <Show when={step >= 2}>
            <path d={arcPath(O, R, L, 250)} fill="none" stroke={C.orange} strokeWidth={5} strokeDasharray="14 12" />
            <Txt p={P(1080, 300)} color={C.orange} size={42} anchor="end">
              180° (ângulo raso)
            </Txt>
          </Show>
          <Show when={step >= 1}>
            <Angle v={O} a={R} b={Q} r={100} color={C.green} label={ex ? 'α = 120°' : `α = ${al}°`} labelR={170} />
            <Angle v={O} a={Q} b={L} r={130} color={C.pink} label={ex ? (step >= 4 ? 'β = 60°' : 'β = ?') : `β = ${be}°`} labelR={200} />
          </Show>
          <Seg a={L} b={R} />
          <Seg a={O} b={Q} />
          <circle cx={O.x} cy={O.y} r={9} fill={C.ink} />
          <Txt p={P(570, 655)}>O</Txt>
          {step < 3 && (
            <>
              <Handle p={Q} onMove={(p) => setPhi(clamp(heading(O, p), 15, 165))} />
              <DragHint p={Q} />
            </>
          )}
        </Fig>
      }
      side={
        <>
          <Card show={step >= 1} tone="sky" title="Ângulos adjacentes">
            α e β têm um lado em comum e juntos formam uma <b>meia-volta</b>.
          </Card>
          <Card show={step >= 2} tone="green" title="Suplementares">
            <Formula tex={'\\alpha+\\beta=180^\\circ'} boxed />
          </Card>
          <Ask show={step >= 3}>Se um dos ângulos mede 120°, quanto mede o outro?</Ask>
          <Card show={step >= 4} tone="pink" title="Resolução">
            <Formula tex={'120^\\circ+\\beta=180^\\circ\\;\\Rightarrow\\;\\beta=60^\\circ'} size={48} />
          </Card>
        </>
      }
    />
  )
}

/* ─────────────── Tela 3 — Retas paralelas e transversal ─────────────── */

function T3({ step }: ScreenProps) {
  const [th, setTh] = useScreenState('theta', 62)
  const yR = 250
  const yS = 630
  const O = P(570, (yR + yS) / 2)
  const d = polar(P(0, 0), 1, th)
  // Interseções da transversal com r e s.
  const P1 = add(O, mul1(d, (yR - O.y) / d.y))
  const P2 = add(O, mul1(d, (yS - O.y) / d.y))
  const H = polar(O, 330, th)
  const right = P(1, 0)
  const g = Math.round(angleAt(P1, P2, add(P1, right)))
  const pk = 180 - g
  return (
    <Body
      fig={
        <Fig>
          <Seg a={P(30, yR)} b={P(1110, yR)} />
          <Seg a={P(30, yS)} b={P(1110, yS)} />
          <ParArrows a={P(30, yR)} b={P(1110, yR)} at={0.88} />
          <ParArrows a={P(30, yS)} b={P(1110, yS)} at={0.88} />
          <Txt p={P(1090, yR - 45)}>r</Txt>
          <Txt p={P(1090, yS - 45)}>s</Txt>
          <Show when={step >= 1}>
            <Angle v={P1} a={P2} b={add(P1, right)} r={80} color={C.green} label={step >= 2 ? `${g}°` : undefined} />
            <Angle v={P2} a={P1} b={add(P2, mul1(right, -1))} r={80} color={C.green} label={step >= 2 ? `${g}°` : undefined} />
          </Show>
          <Show when={step >= 3}>
            <Angle v={P1} a={P2} b={add(P1, mul1(right, -1))} r={60} n={2} color={C.pink} label={`${pk}°`} />
            <Angle v={P2} a={P1} b={add(P2, right)} r={60} n={2} color={C.pink} label={`${pk}°`} />
          </Show>
          <Line a={P1} b={P2} extA={140} extB={140} color={C.violet} />
          <Txt p={add(H, P(40, 10))} color={C.violet}>
            t
          </Txt>
          <circle cx={P1.x} cy={P1.y} r={8} fill={C.ink} />
          <circle cx={P2.x} cy={P2.y} r={8} fill={C.ink} />
          <Handle p={H} onMove={(p) => setTh(clamp(heading(O, p), 28, 152))} />
          <DragHint p={H} dx={0} dy={-56} />
        </Fig>
      }
      side={
        <>
          <Card tone="white" title="Situação">
            <M>{'r\\parallel s'}</M> cortadas pela transversal <M>t</M>
          </Card>
          <Card show={step >= 1} tone="green" title="Alternos internos">
            Entre as paralelas, em lados opostos da transversal.
          </Card>
          <Card show={step >= 2} tone="green">
            <div className="text-center font-extrabold">Alternos internos são congruentes.</div>
          </Card>
          <Card show={step >= 3} tone="pink" title="E o outro par?">
            Também congruentes, e <M>{`${g}^\\circ+${pk}^\\circ=180^\\circ`}</M>
          </Card>
          <Card show={step >= 4} tone="sky" size="sm">
            Mude a inclinação de <M>t</M>: as medidas mudam, mas os pares continuam iguais.
          </Card>
        </>
      }
    />
  )
}
const mul1 = (p: Pt, k: number): Pt => ({ x: p.x * k, y: p.y * k })

/* ─────────────── Tela 4 — Bissetriz ─────────────── */

function T4({ step }: ScreenProps) {
  const O = P(170, 760)
  const [phiD, setPhi] = useScreenState('phi', 64)
  const phi = useTween(step >= 4 ? 80 : phiD, 1000)
  const X = polar(O, 900, 0)
  const Y = polar(O, 700, phi)
  const r0 = 330
  const X1 = polar(O, r0, 0)
  const X2 = polar(O, r0, phi)
  const rho = 360
  const half = (r0 * Math.sin((phi * Math.PI) / 360)) as number
  const kDist = r0 * Math.cos((phi * Math.PI) / 360) + Math.sqrt(Math.max(0, rho * rho - half * half))
  const K = polar(O, kDist, phi / 2)
  const Bis = polar(O, 860, phi / 2)
  const smallArc = (c: Pt) => {
    const h = heading(c, K)
    const p1 = polar(c, rho, h - 9)
    const p2 = polar(c, rho, h + 9)
    return `M ${p1.x} ${p1.y} A ${rho} ${rho} 0 0 0 ${p2.x} ${p2.y}`
  }
  const whole = Math.round(phi)
  const ex = step >= 4
  const halfLabel = ex ? '40°' : `${fmtHalf(whole)}°`
  return (
    <Body
      fig={
        <Fig>
          <Show when={step >= 1 && step < 3}>
            <Angle v={O} a={X} b={Y} r={150} color={C.green} label={`${whole}°`} labelR={210} />
          </Show>
          <Show when={step >= 2}>
            <path d={arcPath(O, X, Y, r0)} fill="none" stroke={C.gray} strokeWidth={3} strokeDasharray="10 10" />
            <path d={smallArc(X1)} fill="none" stroke={C.gray} strokeWidth={3} />
            <path d={smallArc(X2)} fill="none" stroke={C.gray} strokeWidth={3} />
            <circle cx={X1.x} cy={X1.y} r={8} fill={C.gray} />
            <circle cx={X2.x} cy={X2.y} r={8} fill={C.gray} />
            <circle cx={K.x} cy={K.y} r={8} fill={C.orange} />
          </Show>
          <Show when={step >= 3}>
            <Angle v={O} a={X} b={Bis} r={150} color={C.pink} label={halfLabel} labelR={220} />
            <Angle v={O} a={Bis} b={Y} r={150} color={C.pink} label={halfLabel} labelR={220} />
            <Seg a={O} b={Bis} color={C.orange} width={6} draw />
            <Txt p={add(Bis, P(20, -30))} color={C.orange} size={38} anchor="start">
              bissetriz
            </Txt>
          </Show>
          <Seg a={O} b={X} />
          <Seg a={O} b={Y} />
          <circle cx={O.x} cy={O.y} r={9} fill={C.ink} />
          <Txt p={P(O.x - 36, O.y + 30)}>O</Txt>
          {ex && (
            <>
              <path d={arcPath(O, X, Y, 270)} fill="none" stroke={C.green} strokeWidth={5} />
              <Txt p={polar(O, 312, phi * 0.82)} color={C.green} size={42}>
                80°
              </Txt>
            </>
          )}
          {step < 4 && (
            <>
              <Handle p={Y} onMove={(p) => setPhi(clamp(heading(O, p), 30, 150))} />
              <DragHint p={Y} dy={-60} />
            </>
          )}
        </Fig>
      }
      side={
        <>
          <Card show={step >= 2 && step < 4} tone="white" title="Construção" size="sm">
            Compasso em O: marca distâncias iguais nos dois lados. Depois, dois arcos iguais se cruzam em um ponto da
            bissetriz.
          </Card>
          <Card show={step >= 3} tone="pink" title="Bissetriz">
            Divide o ângulo em <b>dois ângulos congruentes</b>.
          </Card>
          <Card show={step >= 4} tone="green" title="Exemplo">
            <Formula tex={'80^\\circ \\div 2 = 40^\\circ'} boxed />
          </Card>
        </>
      }
    />
  )
}
const fmtHalf = (w: number) => (w % 2 === 0 ? String(w / 2) : (w / 2).toLocaleString('pt-BR'))

/* ─────────────── Tela 5 — Triângulo isósceles ─────────────── */

function T5({ step }: ScreenProps) {
  const B = P(230, 770)
  const Cc = P(910, 770)
  const [ay, setAy] = useScreenState('ay', 200)
  const A = P(570, ay)
  const pts = [A, B, Cc]
  const base = Math.round(angleAt(B, A, Cc))
  const Mb = mid(B, Cc)
  const emph = step >= 4
  return (
    <Body
      fig={
        <Fig>
          <Poly pts={pts} fill="#f8fafc" />
          <Show when={step >= 3}>
            <Seg a={A} b={Mb} color={C.gray} width={AUXW} dash />
            <RightMark v={Mb} a={Cc} b={A} />
          </Show>
          <Show when={step >= 1}>
            {emph && <Seg a={A} b={B} color={C.pink} width={11} opacity={0.5} />}
            {emph && <Seg a={A} b={Cc} color={C.pink} width={11} opacity={0.5} />}
            <Ticks a={A} b={B} color={C.pink} />
            <Ticks a={A} b={Cc} color={C.pink} />
          </Show>
          <Show when={step >= 2}>
            <Angle v={B} a={Cc} b={A} r={80} color={C.sky} n={2} label={`${base}°`} />
            <Angle v={Cc} a={A} b={B} r={80} color={C.sky} n={2} label={`${base}°`} />
          </Show>
          <VLabels pts={pts} names={['A', 'B', 'C']} />
          <Handle p={A} onMove={(p) => setAy(clamp(p.y, 130, 620))} />
          <DragHint p={A} dx={110} dy={0} />
        </Fig>
      }
      side={
        <>
          <Card show={step >= 1} tone="pink" title="Lados congruentes">
            <Formula tex={'\\overline{AB}\\cong\\overline{AC}'} />
          </Card>
          <Card show={step >= 2} tone="sky" title="Ângulos da base">
            <Formula tex={'\\widehat{B}\\cong\\widehat{C}'} />
          </Card>
          <Card show={step >= 3} tone="green" title="Propriedade">
            Em um triângulo isósceles, os <b>ângulos da base</b> são congruentes.
          </Card>
          <Card show={step >= 4} tone="orange" title="Vale a volta!">
            Se dois ângulos são congruentes, os <b>lados opostos</b> a eles também são.
            <Formula tex={'\\widehat{B}\\cong\\widehat{C}\\;\\Rightarrow\\;\\overline{AC}\\cong\\overline{AB}'} size={44} />
          </Card>
        </>
      }
    />
  )
}
const AUXW = 4

/* ───────────────────────── Definições ───────────────────────── */

export const bloco1: ScreenDef[] = [
  {
    id: 'abertura',
    block: 1,
    num: 0,
    title: 'Abertura',
    minutes: 0.5,
    bare: true,
    steps: ['Título e as figuras da aula', 'Roteiro dos 5 blocos'],
    Component: Abertura,
    notes: {
      objetivo: 'Situar a turma: hoje vamos reconhecer, relacionar e aplicar propriedades dos quadriláteros notáveis.',
      previos: ['Noção de polígono (figura fechada formada por segmentos).'],
      orientacoes: [
        'Pergunte onde os alunos veem quadriláteros no dia a dia (azulejos, telas, campos de arroz da abertura do livro).',
        'Mostre o roteiro: primeiro revisamos ângulos, depois classificamos, provamos propriedades e resolvemos problemas.',
      ],
      perguntas: ['Qual dessas figuras vocês já conhecem pelo nome?', 'O que todas têm em comum?'],
      justificativa: ['Todas são quadriláteros: polígonos com 4 lados, 4 vértices, 4 ângulos internos.'],
      dificuldades: ['Alunos podem achar que “quadrado não é retângulo”; isso será trabalhado na Tela 11.'],
      avaliacao: 'Contextualiza a avaliação: todos os exercícios envolvem reconhecer a figura antes de escolher a propriedade.',
    },
  },
  {
    id: 't1',
    block: 1,
    num: 1,
    title: 'Soma dos ângulos internos do triângulo',
    minutes: 1.5,
    steps: [
      'Triângulo ABC (vértice C arrastável)',
      'Destaca os três ângulos internos com medidas',
      'Revela Â + B̂ + Ĉ = 180°',
      'Exemplo: ângulos de 50° e 60°',
      'Equação 50° + 60° + x = 180°',
      'Resultado x = 70°',
    ],
    Component: T1,
    notes: {
      objetivo: 'Relembrar que a soma dos ângulos internos de qualquer triângulo é 180°.',
      previos: ['Medida de ângulo em graus.', 'Resolver equação do 1º grau simples.'],
      orientacoes: [
        'Na etapa 2, arraste o vértice C: as medidas mudam, mas a soma continua 180°.',
        'No exemplo, peça a resposta antes de revelar a equação.',
      ],
      perguntas: ['Se aumentarmos um ângulo, o que acontece com os outros?', 'Um triângulo pode ter dois ângulos obtusos?'],
      justificativa: [
        'Traçando por C a paralela a AB, os ângulos Â e B̂ reaparecem em C como alternos internos; os três formam um ângulo raso (180°). Retome essa ideia depois da Tela 3.',
      ],
      dificuldades: ['Confundir ângulo interno com externo.', 'Esquecer de isolar x (fazer 50 + 60 e parar).'],
      avaliacao: 'Base para a soma dos ângulos internos do quadrilátero (360°), usada em exercícios de cálculo de ângulos.',
    },
  },
  {
    id: 't2',
    block: 1,
    num: 2,
    title: 'Ângulos suplementares',
    minutes: 1.5,
    steps: [
      'Reta com dois ângulos adjacentes (raio arrastável)',
      'Destaca α e β com medidas',
      'Mostra o ângulo raso e α + β = 180°',
      'Exemplo: um ângulo de 120°',
      'Revela β = 60°',
    ],
    Component: T2,
    notes: {
      objetivo: 'Reconhecer ângulos suplementares (soma 180°) formando um ângulo raso.',
      previos: ['Ângulo raso = meia-volta = 180°.'],
      orientacoes: ['Arraste o raio: α cresce, β diminui na mesma quantidade.', 'Enfatize a palavra “suplementares”.'],
      perguntas: ['Se α = 90°, quanto vale β?', 'Dois ângulos agudos podem ser suplementares?'],
      justificativa: ['α e β juntos ocupam o ângulo raso formado pela reta, logo α + β = 180°.'],
      dificuldades: ['Confundir suplementares (180°) com complementares (90°).'],
      avaliacao: 'Usado nos ângulos consecutivos do paralelogramo e nos ângulos adjacentes aos lados não paralelos do trapézio.',
    },
  },
  {
    id: 't3',
    block: 1,
    num: 3,
    title: 'Retas paralelas e transversal',
    minutes: 1.5,
    steps: [
      'Retas r ∥ s e transversal t (inclinação arrastável)',
      'Destaca um par de alternos internos',
      'Mostra que as medidas são iguais',
      'Segundo par de alternos internos (soma 180° com o primeiro)',
      'Convite para mudar a inclinação',
    ],
    Component: T3,
    notes: {
      objetivo: 'Identificar ângulos alternos internos e reconhecer que são congruentes quando as retas são paralelas.',
      previos: ['Retas paralelas: não se cruzam.', 'Ângulos suplementares (Tela 2).'],
      orientacoes: [
        'Mostre com as mãos: “alternos” = lados opostos da transversal; “internos” = entre as paralelas.',
        'Gire a transversal pela alça laranja: r e s continuam paralelas e os pares continuam iguais.',
      ],
      perguntas: ['Onde está o outro ângulo com a mesma cor?', 'O que acontece se a transversal ficar perpendicular?'],
      justificativa: [
        'Propriedade das paralelas: uma transversal forma ângulos alternos internos congruentes. O verde e o rosa em um mesmo ponto são suplementares (formam um raso).',
      ],
      dificuldades: ['Achar que ângulos “parecidos” são iguais mesmo sem paralelismo.'],
      avaliacao: 'Chave para os exercícios com bissetriz no paralelogramo e para os ângulos do trapézio.',
    },
  },
  {
    id: 't4',
    block: 1,
    num: 4,
    title: 'Bissetriz',
    minutes: 1.5,
    steps: [
      'Ângulo AÔB (lado arrastável)',
      'Mostra a medida do ângulo',
      'Construção com compasso',
      'Traça a bissetriz e mostra as duas metades',
      'Exemplo: 80° → 40° + 40°',
    ],
    Component: T4,
    notes: {
      objetivo: 'Compreender que a bissetriz divide um ângulo em dois ângulos congruentes.',
      previos: ['Medida de ângulos.', 'Divisão por 2.'],
      orientacoes: [
        'A construção com compasso é opcional: comente rapidamente, o essencial é “metade + metade”.',
        'Arraste o lado para ver que a bissetriz acompanha o ângulo.',
      ],
      perguntas: ['Se o ângulo mede 130°, quanto mede cada metade?', 'A bissetriz é uma reta, segmento ou semirreta?'],
      justificativa: ['Os pontos marcados pelo compasso formam triângulos congruentes (LLL), então os dois ângulos em O são iguais.'],
      dificuldades: ['Confundir bissetriz com mediana (que divide o lado ao meio).'],
      avaliacao: 'Aparece em exercícios em que a bissetriz de um ângulo do paralelogramo corta o lado oposto.',
    },
  },
  {
    id: 't5',
    block: 1,
    num: 5,
    title: 'Triângulo isósceles',
    minutes: 2,
    steps: [
      'Triângulo ABC (vértice A arrastável, mantendo AB = AC)',
      'Lados congruentes AB ≅ AC',
      'Ângulos da base congruentes',
      'Eixo de simetria e propriedade',
      'Recíproca: ângulos congruentes ⇒ lados opostos congruentes',
    ],
    Component: T5,
    notes: {
      objetivo: 'Relacionar lados e ângulos congruentes no triângulo isósceles, nos dois sentidos.',
      previos: ['Classificação de triângulos quanto aos lados.'],
      orientacoes: [
        'Mova o vértice A: o triângulo continua isósceles e os ângulos da base continuam iguais.',
        'Dê destaque especial à recíproca: ela será usada na Tela 17 e no Problema 3.',
      ],
      perguntas: ['Qual lado é oposto ao ângulo B̂?', 'Se B̂ = 70°, quanto mede Â?'],
      justificativa: [
        'A bissetriz de  divide ABC em dois triângulos congruentes (LAL: AB = AC, ângulos iguais em A, lado comum), logo B̂ = Ĉ.',
        'Recíproca: se B̂ = Ĉ, os triângulos formados pela bissetriz de  são congruentes (LAA₀), logo AB = AC.',
      ],
      dificuldades: ['Identificar o lado “oposto” a um ângulo.', 'Achar que a base é sempre o lado de baixo.'],
      avaliacao: 'Prepara os problemas de bissetriz no paralelogramo (triângulo isósceles formado).',
    },
  },
]
