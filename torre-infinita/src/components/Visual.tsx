import type { Visual as VisualDados } from "@/engine/tipos";

/** Modelos visuais: fração em barra, multiplicação em área e reta numérica. */
export function Visual({ v }: { v: VisualDados }) {
  if (v.tipo === "barra") {
    const den = Math.min(v.den, 24), num = Math.min(v.num, den);
    const w = 300 / den;
    return (
      <svg viewBox="0 0 300 44" className="mx-auto w-full max-w-sm" role="img" aria-label={`Barra dividida em ${v.den} partes, ${v.num} pintadas`}>
        {Array.from({ length: den }, (_, i) => (
          <rect key={i} x={i * w + 1} y={2} width={w - 2} height={40} rx={6} fill={i < num ? "#5b3df5" : "#ece8ff"} stroke="#5b3df5" strokeWidth={1.5} />
        ))}
      </svg>
    );
  }
  if (v.tipo === "area") {
    const a = Math.min(v.a, 12), b = Math.min(v.b, 12), c = Math.min(22, 240 / Math.max(a, b));
    return (
      <svg viewBox={`0 0 ${b * c + 4} ${a * c + 4}`} className="mx-auto max-h-44 w-auto" role="img" aria-label={`Grade de ${v.a} por ${v.b}`}>
        {Array.from({ length: a * b }, (_, k) => (
          <rect key={k} x={(k % b) * c + 2} y={Math.floor(k / b) * c + 2} width={c - 3} height={c - 3} rx={4} fill={k % b < 5 ? "#5b3df5" : "#e08a00"} opacity={0.9} />
        ))}
      </svg>
    );
  }
  const { min, max, marca } = v, n = max - min, W = 320, x = (val: number) => 10 + ((val - min) / n) * (W - 20);
  const passo = n > 24 ? 5 : n > 12 ? 2 : 1;
  return (
    <svg viewBox={`0 0 ${W} 64`} className="mx-auto w-full max-w-md" role="img" aria-label={`Reta numérica com o ponto em ${marca}`}>
      <line x1={10} x2={W - 10} y1={30} y2={30} stroke="#55527a" strokeWidth={3} strokeLinecap="round" />
      {Array.from({ length: n + 1 }, (_, i) => min + i).filter((t) => t % passo === 0).map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={24} y2={36} stroke="#55527a" strokeWidth={t === 0 ? 3 : 1.5} />
          <text x={x(t)} y={56} textAnchor="middle" fontSize={11} fill="#55527a" fontWeight={t === 0 ? 800 : 500}>{String(t).replace("-", "−")}</text>
        </g>
      ))}
      <circle cx={x(marca)} cy={30} r={9} fill="#5b3df5" stroke="#fff" strokeWidth={3} />
    </svg>
  );
}
