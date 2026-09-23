import { AnimatePresence, motion } from 'framer-motion'
import { EyeOff } from 'lucide-react'
import type { ReactNode } from 'react'
import { P, add, mid, polar, quadFromAngles } from '../../geo/math'
import { Angle, C, Fig, ParArrows, Poly, RightMark, Seg, SegLabel, Show, Ticks, Txt, VLabels } from '../../geo/svg'
import { Ask, Body, Card, Chain, Formula, M } from '../../ui/comic'
import type { ScreenDef, ScreenProps } from '../types'

const NAMES = ['A', 'B', 'C', 'D']
const AUX = 4

/* ─────────────── Problema 1 — Ângulos de um quadrilátero ─────────────── */

function P1({ step }: ScreenProps) {
  const pts = quadFromAngles(P(170, 730), 760, 400, 75, 110, 80)
  const [A, B, Cc, D] = pts
  return (
    <Body
      fig={
        <Fig>
          <Poly pts={pts} fill="#f8fafc" />
          <g className={step === 1 ? 'pulse' : undefined}>
            <Angle v={A} a={B} b={D} r={80} color={C.green} label="75°" />
            <Angle v={B} a={Cc} b={A} r={80} color={C.sky} label="110°" />
            <Angle v={Cc} a={D} b={B} r={80} color={C.orange} label={step >= 4 ? '80°' : 'x'} labelSize={step >= 4 ? 40 : 52} />
            <Angle v={D} a={A} b={Cc} r={80} color={C.pink} label="95°" />
          </g>
          <VLabels pts={pts} names={NAMES} />
        </Fig>
      }
      side={
        <>
          <Ask>Os ângulos internos medem 75°, 95°, 110° e x. Qual é a medida do quarto ângulo?</Ask>
          <Card show={step >= 1} tone="green" size="sm" title="Propriedade utilizada">
            Soma dos ângulos internos do quadrilátero: <b>360°</b>
          </Card>
          <Card show={step >= 2} tone="pink" title="Resolução">
            <Formula tex={'75^\\circ+95^\\circ+110^\\circ+x=360^\\circ'} size={42} />
            {step >= 3 && <Formula tex={'280^\\circ+x=360^\\circ'} size={42} />}
            {step >= 4 && <Formula tex={'x=80^\\circ'} boxed size={50} />}
          </Card>
        </>
      }
    />
  )
}

/* ─────────────── Problema 2 — Trapézio e triângulo retângulo ─────────────── */

function P2({ step }: ScreenProps) {
  // Escala: 1 cm = 60 px. Bases 16 cm e 10 cm, altura 4 cm.
  const A = P(90, 640)
  const B = P(1050, 640)
  const Cc = P(870, 400)
  const D = P(270, 400)
  const D1 = P(270, 640)
  const C1 = P(870, 640)
  const Mm = mid(A, D)
  const Nn = mid(B, Cc)
  const pts = [A, B, Cc, D]
  return (
    <Body
      fig={
        <Fig>
          <Show when={step >= 5}>
            <Poly pts={[A, D1, D]} fill={C.yellowL} stroke="none" />
          </Show>
          <Poly pts={pts} fill={step >= 5 ? 'none' : '#f8fafc'} />
          <Show when={step < 3}>
            <Seg a={P(570, 400)} b={P(570, 640)} color={C.gray} width={AUX} dash />
            <RightMark v={P(570, 640)} a={P(700, 640)} b={P(570, 400)} />
            <Txt p={P(605, 520)} color={C.gray} anchor="start" size={40}>
              4 cm
            </Txt>
          </Show>
          <SegLabel a={B} b={A} off={-52} color={C.greenD}>
            16 cm
          </SegLabel>
          <SegLabel a={D} b={Cc} off={-52} color={C.greenD}>
            10 cm
          </SegLabel>
          <Show when={step >= 1}>
            <Seg a={A} b={B} color={C.green} width={13} opacity={0.4} />
            <Seg a={D} b={Cc} color={C.green} width={13} opacity={0.4} />
            <ParArrows a={A} b={B} at={0.62} />
            <ParArrows a={D} b={Cc} at={0.62} />
          </Show>
          <Show when={step === 2}>
            <Seg a={Mm} b={Nn} color={C.orange} width={7} draw />
            <SegLabel a={Mm} b={Nn} off={-34} color={C.orange} size={40}>
              13 cm
            </SegLabel>
          </Show>
          <Show when={step >= 3}>
            <Seg a={D} b={D1} color={C.violet} width={AUX} dash />
            <Seg a={Cc} b={C1} color={C.violet} width={AUX} dash />
            <RightMark v={D1} a={B} b={D} color={C.violet} />
            <RightMark v={C1} a={A} b={Cc} color={C.violet} />
            <Txt p={add(D1, P(0, 50))} color={C.violet} size={40}>
              D’
            </Txt>
            <Txt p={add(C1, P(0, 50))} color={C.violet} size={40}>
              C’
            </Txt>
          </Show>
          <Show when={step >= 4}>
            <SegLabel a={C1} b={D1} off={48} color={C.greenD} size={36}>
              10
            </SegLabel>
            <SegLabel a={D1} b={A} off={-48} color={C.pink} size={40}>
              3
            </SegLabel>
            <SegLabel a={B} b={C1} off={-48} color={C.pink} size={40}>
              3
            </SegLabel>
          </Show>
          <Show when={step >= 5}>
            <SegLabel a={D1} b={D} off={36} color={C.violet} size={40}>
              4
            </SegLabel>
            <SegLabel a={A} b={D} off={-50} color={C.orange} size={44}>
              {step >= 8 ? '5 cm' : 'l'}
            </SegLabel>
          </Show>
          <Show when={step >= 8}>
            <Ticks a={A} b={D} color={C.orange} />
            <Ticks a={B} b={Cc} color={C.orange} />
            <SegLabel a={Cc} b={B} off={-50} color={C.orange} size={44}>
              5 cm
            </SegLabel>
          </Show>
          <VLabels pts={pts} names={NAMES} />
        </Fig>
      }
      side={
        <>
          <Card tone="white" size="sm" title="Trapézio isósceles">
            Bases 16 cm e 10 cm, altura 4 cm. Calcule a <b>base média</b> e o <b>lado não paralelo</b>.
          </Card>
          <AnimatePresence mode="popLayout" initial={false}>
            {step >= 2 && step < 3 && (
              <Card key="bm" tone="orange" title="Base média">
                <Formula tex={'m=\\dfrac{16+10}{2}=13\\text{ cm}'} boxed size={46} />
              </Card>
            )}
            {step >= 3 && (
              <motion.div key="chip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="done-chip">
                ✓ Base média: <M>{'m=13\\text{ cm}'}</M>
              </motion.div>
            )}
          </AnimatePresence>
          <Card show={step >= 4} tone="violet" size="sm" title="Projeções">
            <M>{'16-10=6\\qquad 6\\div2=3\\text{ cm}'}</M>
          </Card>
          <Card show={step >= 6} tone="pink" title="Pitágoras no triângulo AD’D">
            <Formula tex={'l^2=3^2+4^2'} size={44} />
            {step >= 7 && <Formula tex={'l^2=25'} size={44} />}
            {step >= 8 && <Formula tex={'l=5\\text{ cm}'} boxed size={48} />}
          </Card>
        </>
      }
    />
  )
}

/* ─────────────── Problema 3 — Paralelogramo com bissetriz ─────────────── */

const CHAIN3 = ['Paralelismo', 'Ângulos congruentes', 'Triângulo isósceles', 'Segmentos congruentes', 'Cálculo']

function P3({ step }: ScreenProps) {
  // Escala: 1 cm = 60 px. AB = 12 cm, AD = 7 cm.
  const A = P(150, 720)
  const B = P(870, 720)
  const D = polar(A, 420, 60)
  const Cc = add(D, P(720, 0))
  const Pp = add(D, P(420, 0))
  const pts = [A, B, Cc, D]
  const chain = step >= 7 ? 5 : step >= 5 ? 4 : step >= 4 ? 3 : step >= 3 ? 2 : step >= 1 ? 1 : 0
  return (
    <Body
      fig={
        <Fig>
          <Show when={step >= 4}>
            <Poly pts={[A, Pp, D]} fill={C.yellowL} stroke="none" />
          </Show>
          <Poly pts={pts} fill="none" />
          <Show when={step >= 1}>
            <Seg a={A} b={B} color={C.green} width={13} opacity={0.4} />
            <Seg a={D} b={Cc} color={C.green} width={13} opacity={0.4} />
            <ParArrows a={A} b={B} at={0.8} />
            <ParArrows a={D} b={Cc} at={0.88} />
          </Show>
          <Seg a={A} b={Pp} color={C.orange} width={6} />
          <Show when={step >= 2}>
            <Angle v={A} a={B} b={Pp} r={90} color={C.pink} label="α" />
            <Angle v={A} a={Pp} b={D} r={90} color={C.pink} label="α" />
          </Show>
          <Show when={step >= 3}>
            <Angle v={Pp} a={D} b={A} r={80} color={C.pink} label="α" />
          </Show>
          <SegLabel a={B} b={A} off={-50} color={C.greenD}>
            12 cm
          </SegLabel>
          <SegLabel a={A} b={D} off={50} color={C.violet}>
            7 cm
          </SegLabel>
          <Show when={step >= 5}>
            <Ticks a={A} b={D} n={2} color={C.violet} />
            <Ticks a={D} b={Pp} n={2} color={C.violet} />
            <SegLabel a={Pp} b={D} off={44} color={C.violet}>
              7 cm
            </SegLabel>
          </Show>
          <Show when={step >= 8}>
            <Seg a={Pp} b={Cc} color={C.orange} width={12} opacity={0.5} />
            <SegLabel a={Cc} b={Pp} off={44} color={C.orange}>
              5 cm
            </SegLabel>
          </Show>
          <circle cx={Pp.x} cy={Pp.y} r={9} fill={C.ink} />
          <Txt p={add(Pp, P(10, -50))}>P</Txt>
          <VLabels pts={pts} names={NAMES} />
        </Fig>
      }
      side={
        <>
          <Card show={step >= 1} tone="green" size="sm" title="Sequência lógica">
            <Chain items={CHAIN3} active={chain} />
          </Card>
          <Card show={step >= 3} tone="white" size="sm">
            Determine <b>DP</b> e <b>PC</b>.
          </Card>
          <Ask show={step < 3}>
            A bissetriz de <M>{'\\widehat{A}'}</M> encontra <M>{'\\overline{CD}'}</M> em P. Quanto medem DP e PC?
          </Ask>
          <Card show={step >= 3} tone="pink" size="sm">
            <M>{'\\widehat{DPA}\\cong\\widehat{PAB}'}</M> (alternos internos)
          </Card>
          <Card show={step >= 5} tone="violet" size="sm">
            <M>{'\\triangle ADP'}</M> isósceles <M>{'\\Rightarrow DP=AD=7\\text{ cm}'}</M>
          </Card>
          <Card show={step >= 6} tone="pink" title="Cálculo" size="sm">
            <M>{'CD=AB=12\\text{ cm}'}</M>
            {step >= 7 && <Formula tex={'PC=12-7'} size={42} />}
            {step >= 8 && <Formula tex={'PC=5\\text{ cm}'} boxed size={46} />}
          </Card>
        </>
      }
    />
  )
}

/* ─────────────── Verificação da aprendizagem ─────────────── */

function QA({ q, a, showQ, showA }: { q: ReactNode; a: ReactNode; showQ: boolean; showA: boolean }) {
  return (
    <AnimatePresence initial={false}>
      {showQ && (
        <motion.div
          layout="position"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="qa"
        >
          <div className="qa-q">{q}</div>
          <AnimatePresence initial={false}>
            {showA && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="qa-a">
                {a}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Verif({ step, goToStep }: ScreenProps) {
  // Escala: 1 cm = 50 px. Bases 18 cm e 10 cm.
  const A = P(120, 700)
  const B = P(1020, 700)
  const Cc = P(820, 360)
  const D = P(320, 360)
  const Mm = mid(A, D)
  const Nn = mid(B, Cc)
  const pts = [A, B, Cc, D]
  return (
    <Body
      fig={
        <Fig>
          <Poly pts={pts} fill="#f8fafc" />
          <Show when={step >= 2}>
            <Ticks a={A} b={D} color={C.pink} />
            <Ticks a={B} b={Cc} color={C.pink} />
          </Show>
          <Show when={step >= 4}>
            <Seg a={A} b={B} color={C.green} width={13} opacity={0.4} />
            <Seg a={D} b={Cc} color={C.green} width={13} opacity={0.4} />
            <ParArrows a={A} b={B} at={0.7} />
            <ParArrows a={D} b={Cc} at={0.7} />
          </Show>
          <SegLabel a={B} b={A} off={-52} color={C.greenD}>
            18 cm
          </SegLabel>
          <SegLabel a={D} b={Cc} off={-52} color={C.greenD}>
            10 cm
          </SegLabel>
          <Seg a={Mm} b={Nn} color={C.orange} width={6} dash={step < 8} />
          <circle cx={Mm.x} cy={Mm.y} r={10} fill={C.ink} />
          <circle cx={Nn.x} cy={Nn.y} r={10} fill={C.ink} />
          <Txt p={add(Mm, P(-44, 0))}>M</Txt>
          <Txt p={add(Nn, P(44, 0))}>N</Txt>
          <SegLabel a={Mm} b={Nn} off={-40} color={C.orange} size={step >= 8 ? 46 : 52}>
            {step >= 8 ? '14 cm' : '?'}
          </SegLabel>
          <VLabels pts={pts} names={NAMES} />
        </Fig>
      }
      side={
        <>
          <Card tone="violet" size="sm" title="Desafio">
            M e N são pontos médios dos lados não paralelos. Quanto mede <M>{'\\overline{MN}'}</M>?
          </Card>
          <QA showQ={step >= 1} showA={step >= 2} q="Qual quadrilátero está representado?" a="Trapézio isósceles" />
          <QA showQ={step >= 3} showA={step >= 4} q="Quais são as bases?" a="AB = 18 cm e CD = 10 cm" />
          <QA showQ={step >= 5} showA={step >= 6} q="Qual propriedade usar?" a="A base média do trapézio" />
          <Card show={step >= 7} tone="green" size="sm" title="Cálculo">
            <Formula tex={'m=\\dfrac{18+10}{2}'} size={42} />
            {step >= 8 && <Formula tex={'m=14\\text{ cm}'} boxed size={46} />}
            <button className="hide-answer" onClick={() => goToStep(0)}>
              <EyeOff size={22} /> ocultar respostas
            </button>
          </Card>
        </>
      }
    />
  )
}

/* ───────────────────────── Definições ───────────────────────── */

export const bloco4: ScreenDef[] = [
  {
    id: 'p1',
    block: 4,
    num: 18,
    title: 'Problema 1 — Ângulos de um quadrilátero',
    minutes: 3,
    steps: ['Enunciado e figura', 'Propriedade: soma = 360°', 'Equação', 'Simplificação: 280° + x = 360°', 'Resposta x = 80°'],
    Component: P1,
    notes: {
      objetivo: 'Aplicar a soma dos ângulos internos para encontrar um ângulo desconhecido.',
      previos: ['Soma dos ângulos internos do quadrilátero (Tela 7).', 'Equação do 1º grau.'],
      orientacoes: [
        'Dê 1 minuto para os alunos tentarem antes de revelar.',
        'Pergunte primeiro qual propriedade será usada, depois monte a equação.',
      ],
      perguntas: ['Que propriedade relaciona os quatro ângulos?', 'Como conferir a resposta?'],
      justificativa: ['Â + B̂ + Ĉ + D̂ = 360°, logo 280° + x = 360° e x = 80°. Conferência: 75 + 95 + 110 + 80 = 360.'],
      dificuldades: ['Usar 180° no lugar de 360°.', 'Erros de soma (75 + 95 + 110).'],
      avaliacao: 'Mesmo raciocínio dos exercícios de cálculo de ângulos, com valores diferentes.',
    },
  },
  {
    id: 'p2',
    block: 4,
    num: 19,
    title: 'Problema 2 — Trapézio e triângulo retângulo',
    minutes: 6,
    steps: [
      'Enunciado e figura',
      'Identifica as bases',
      'Base média m = 13 cm',
      'Traça as alturas a partir de D e C',
      'Diferença das bases: 6 cm → 3 cm de cada lado',
      'Destaca o triângulo retângulo AD’D',
      'Pitágoras: l² = 3² + 4²',
      'l² = 25',
      'l = 5 cm',
    ],
    Component: P2,
    notes: {
      objetivo: 'Combinar base média, decomposição do trapézio isósceles e teorema de Pitágoras.',
      previos: ['Base média (Tela 14).', 'Trapézio isósceles (Tela 12).', 'Teorema de Pitágoras.'],
      orientacoes: [
        'Separe o problema em duas partes: base média (rápida) e lado não paralelo.',
        'Insista na razão de dividir 6 por 2: a simetria do trapézio isósceles.',
      ],
      perguntas: ['Por que D’C’ mede 10 cm?', 'Por que as duas “sobras” são iguais?', 'Qual lado do triângulo é a hipotenusa?'],
      justificativa: [
        'DCC’D’ é retângulo, logo D’C’ = DC = 10 cm. Os triângulos AD’D e BC’C são congruentes (trapézio isósceles), logo AD’ = C’B = (16 − 10)/2 = 3 cm. Pitágoras: l² = 3² + 4² = 25, l = 5 cm.',
      ],
      dificuldades: ['Usar 6 (e não 3) como cateto.', 'Somar catetos em vez de somar quadrados.'],
      avaliacao: 'Prepara exercícios de trapézio que exigem traçar alturas e usar triângulos retângulos.',
    },
  },
  {
    id: 'p3',
    block: 4,
    num: 20,
    title: 'Problema 3 — Paralelogramo com bissetriz',
    minutes: 6,
    steps: [
      'Enunciado e figura',
      'Destaca AB ∥ CD',
      'Ângulos α determinados pela bissetriz',
      'Alternos internos: ângulo em P = α',
      'Triângulo ADP isósceles',
      'DP = AD = 7 cm',
      'CD = AB = 12 cm',
      'PC = 12 − 7',
      'PC = 5 cm',
    ],
    Component: P3,
    notes: {
      objetivo: 'Aplicar a sequência paralelismo → ângulos → triângulo isósceles → segmentos → cálculo.',
      previos: ['Tela 17 (bissetriz no paralelogramo).', 'Lados opostos do paralelogramo congruentes (Tela 13).'],
      orientacoes: [
        'Deixe os alunos dizerem cada passo da cadeia antes de revelar.',
        'A cadeia em verde na lateral mostra onde estamos no raciocínio.',
      ],
      perguntas: ['Qual é a transversal que corta AB e CD?', 'Por que CD também mede 12 cm?', 'Se AD fosse 5 cm, quanto mediria PC?'],
      justificativa: ['DPA = PAB = DAP = α ⇒ ΔADP isósceles ⇒ DP = AD = 7 cm. CD = AB = 12 cm ⇒ PC = 12 − 7 = 5 cm.'],
      dificuldades: ['Achar que P é o ponto médio de CD.', 'Usar AD no lugar de AB para o lado CD.'],
      avaliacao: 'Mesmo raciocínio dos exercícios em que a bissetriz divide um lado do paralelogramo.',
    },
  },
]

export const bloco5: ScreenDef[] = [
  {
    id: 'verif',
    block: 5,
    num: 21,
    title: 'Verificação — Base média',
    minutes: 5,
    steps: [
      'Figura e desafio (sem fórmula)',
      'Pergunta: qual quadrilátero?',
      'Resposta: trapézio isósceles',
      'Pergunta: quais são as bases?',
      'Resposta: AB e CD',
      'Pergunta: qual propriedade?',
      'Resposta: base média',
      'm = (18 + 10)/2',
      'm = 14 cm',
    ],
    Component: Verif,
    notes: {
      objetivo: 'Verificar se os alunos reconhecem a figura, selecionam a propriedade e a aplicam em situação nova.',
      previos: ['Base média do trapézio (Tela 14).'],
      orientacoes: [
        'Não revele a fórmula antes de ouvir os alunos; peça respostas com as mãos levantadas ou miniquadros.',
        'O botão “ocultar respostas” volta ao início para reaplicar com outra turma.',
      ],
      perguntas: ['Qual quadrilátero está representado?', 'Quais são as bases?', 'Qual propriedade permite determinar MN?'],
      justificativa: ['MN é a base média: MN = (18 + 10)/2 = 14 cm.'],
      dificuldades: ['Usar a diferença das bases (8) em vez da soma.', 'Esquecer de dividir por 2.'],
      avaliacao: 'Espelha o tipo de questão da avaliação processual com valores inéditos.',
    },
  },
]
