import type { ReactNode } from "react";
import type { Figura } from "@/dominio/questoes";

const R = 70;
const C = 90;
const rad = (g: number) => (g * Math.PI) / 180;
/** Ponto à distância r do centro, no ângulo g (0° no topo, sentido horário). */
const pt = (g: number, r = R): [number, number] => [C + r * Math.sin(rad(g)), C - r * Math.cos(rad(g))];

const Rotulo = ({ x, y, children, forte = false }: { x: number; y: number; children: ReactNode; forte?: boolean }) => (
  <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={forte ? 15 : 13} fontWeight={forte ? 700 : 600}
    className={forte ? "fill-marca" : "fill-tinta"}>{children}</text>
);
const Ponto = ({ g, nome, folga = 13 }: { g: number; nome?: string; folga?: number }) => {
  const [x, y] = pt(g);
  const [lx, ly] = pt(g, R + folga);
  return (
    <>
      <circle cx={x} cy={y} r={3.5} className="fill-tinta" />
      {nome && <Rotulo x={lx} y={ly}>{nome}</Rotulo>}
    </>
  );
};
const Linha = ({ a, b, forte = false, tracejada = false }: { a: [number, number]; b: [number, number]; forte?: boolean; tracejada?: boolean }) => (
  <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={forte ? 4 : 2.5} strokeDasharray={tracejada ? "5 4" : undefined}
    strokeLinecap="round" className={forte ? "stroke-marca" : "stroke-tinta"} />
);
const Centro = ({ nome }: { nome?: string }) => (
  <>
    <circle cx={C} cy={C} r={3.5} className="fill-tinta" />
    {nome && <Rotulo x={C - 10} y={C + 11}>{nome}</Rotulo>}
  </>
);

/** Figuras de apoio das questões. Não mostram a resposta pedida: só a situação descrita no enunciado. */
export function FiguraQuestao({ figura }: { figura: Figura }) {
  return (
    <svg viewBox="0 0 180 180" role="img" className="mx-auto h-48 w-48 shrink-0 sm:h-56 sm:w-56" aria-label={descricao(figura)}>
      <circle cx={C} cy={C} r={R} fill="#fff" className="stroke-tinta" strokeWidth={2.5} />
      {corpo(figura)}
    </svg>
  );
}

function corpo(f: Figura): ReactNode {
  switch (f.tipo) {
    case "raio":
      return (<><Linha a={[C, C]} b={pt(50)} forte /><Centro nome="O" /><Ponto g={50} nome="A" /></>);
    case "corda":
      return (<><Linha a={pt(300)} b={pt(60)} /><Centro nome="O" /><Ponto g={300} nome="A" /><Ponto g={60} nome="B" /></>);
    case "tangente": {
      const [x, y] = pt(180);
      return (<><Linha a={[x - 55, y]} b={[x + 55, y]} /><Centro /><circle cx={x} cy={y} r={3.5} className="fill-tinta" /></>);
    }
    case "secante": {
      const [x1, y1] = pt(300);
      const [x2] = pt(60);
      return (<><Linha a={[8, y1]} b={[172, y1]} /><Centro /><circle cx={x1} cy={y1} r={3.5} className="fill-tinta" /><circle cx={x2} cy={y1} r={3.5} className="fill-tinta" /></>);
    }
    case "partes":
      return (<>{Array.from({ length: f.n }, (_, i) => <Linha key={i} a={[C, C]} b={pt((360 / f.n) * i)} />)}<Centro /></>);
    case "angulo": {
      const [a1x, a1y] = pt(0, 22);
      const [a2x, a2y] = pt(f.graus, 22);
      const [tx, ty] = pt(f.graus / 2, 36);
      return (
        <>
          <Linha a={[C, C]} b={pt(0)} />
          <Linha a={[C, C]} b={pt(f.graus)} />
          <path d={`M ${a1x} ${a1y} A 22 22 0 0 1 ${a2x} ${a2y}`} fill="none" strokeWidth={2} className="stroke-marca" />
          <Rotulo x={tx + 4} y={ty - 2} forte>{f.graus}°</Rotulo>
          <Centro nome="O" />
          <Ponto g={0} nome="A" />
          <Ponto g={f.graus} nome="B" />
        </>
      );
    }
    case "setores": {
      const limites = [0, ...f.angulos.reduce<number[]>((acc, a) => [...acc, (acc[acc.length - 1] ?? 0) + a], [])];
      const todos = [...f.angulos, 360 - f.angulos.reduce((s, a) => s + a, 0)];
      return (
        <>
          {limites.map(g => <Linha key={g} a={[C, C]} b={pt(g)} />)}
          {todos.map((a, i) => {
            const [x, y] = pt(limites[i]! + a / 2, R * 0.6);
            return <Rotulo key={i} x={x} y={y} forte={i === f.angulos.length}>{i === f.angulos.length ? "?" : `${a}°`}</Rotulo>;
          })}
          <Centro />
        </>
      );
    }
  }
}

function descricao(f: Figura): string {
  switch (f.tipo) {
    case "raio": return "Circunferência de centro O com um segmento ligando o centro ao ponto A, que está sobre a circunferência.";
    case "corda": return "Circunferência com um segmento ligando os pontos A e B, sobre a circunferência, sem passar pelo centro.";
    case "tangente": return "Circunferência e uma reta que a toca em um único ponto.";
    case "secante": return "Circunferência e uma reta que a cruza em dois pontos.";
    case "partes": return `Circunferência dividida em ${f.n} partes iguais por raios.`;
    case "angulo": return `Circunferência de centro O com os raios OA e OB formando um ângulo de ${f.graus} graus.`;
    case "setores": return `Circunferência dividida em quatro setores. Três medem ${f.angulos.join(", ")} graus e o quarto está marcado com um ponto de interrogação.`;
  }
}
