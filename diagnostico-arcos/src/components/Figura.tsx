import type { Figura } from "@/dominio/questoes";

const R = 70;
const C = 90;
const pt = (graus: number, r = R) => {
  const a = ((graus - 90) * Math.PI) / 180; // 0° no topo, sentido horário
  return [C + r * Math.cos(a), C + r * Math.sin(a)] as const;
};

/** Figuras das questões da ponte (D4). Mostram a divisão da circunferência sem revelar a medida pedida. */
export function FiguraQuestao({ figura }: { figura: Figura }) {
  const tracos = "stroke-tinta";
  return (
    <svg viewBox="0 0 180 180" role="img" className="mx-auto h-48 w-48 shrink-0 sm:h-56 sm:w-56"
      aria-label={descricao(figura)}>
      <circle cx={C} cy={C} r={R} fill="#fff" className={tracos} strokeWidth={2.5} />
      {figura.tipo === "partes" &&
        Array.from({ length: figura.n }, (_, i) => {
          const [x, y] = pt((360 / figura.n) * i);
          return <line key={i} x1={C} y1={C} x2={x} y2={y} className={tracos} strokeWidth={2.5} />;
        })}
      {figura.tipo === "metade" && (
        <>
          <path d={`M ${C - R} ${C} A ${R} ${R} 0 0 1 ${C + R} ${C}`} fill="none" strokeWidth={7} className="stroke-marca" />
          <line x1={C - R} y1={C} x2={C + R} y2={C} className={tracos} strokeWidth={2} strokeDasharray="5 4" />
        </>
      )}
      {figura.tipo === "angulo" && (() => {
        const [x1, y1] = pt(0);
        const [x2, y2] = pt(figura.graus);
        const [a1x, a1y] = pt(0, 22);
        const [a2x, a2y] = pt(figura.graus, 22);
        return (
          <>
            <line x1={C} y1={C} x2={x1} y2={y1} className={tracos} strokeWidth={2.5} />
            <line x1={C} y1={C} x2={x2} y2={y2} className={tracos} strokeWidth={2.5} />
            <path d={`M ${a1x} ${a1y} A 22 22 0 0 1 ${a2x} ${a2y}`} fill="none" strokeWidth={2} className="stroke-marca" />
            <text x={C + 26} y={C - 18} fontSize={14} className="fill-marca" fontWeight={600}>{figura.graus}°</text>
          </>
        );
      })()}
      <circle cx={C} cy={C} r={3.5} className="fill-tinta" />
      <text x={C - 14} y={C + 16} fontSize={12} className="fill-suave">centro</text>
    </svg>
  );
}

function descricao(f: Figura): string {
  if (f.tipo === "partes") return `Circunferência dividida em ${f.n} partes iguais por raios.`;
  if (f.tipo === "metade") return "Circunferência com uma de suas metades destacada.";
  return `Circunferência com dois raios que formam um ângulo de ${f.graus} graus no centro.`;
}
