import { MUSCLE_LABELS, type MuscleGroup } from "@/lib/types";

// Mapa corporal esquemático (frente e costas). O grupo principal aparece
// em destaque e os secundários em tom mais fraco.

type Shape = { g: MuscleGroup | null; x: number; y: number; w: number; h: number; r?: number; ellipse?: boolean };

const FRONT: Shape[] = [
  { g: null, x: 44, y: 26, w: 12, h: 8, r: 3 },
  { g: "ombros", x: 23, y: 33, w: 16, h: 14, ellipse: true },
  { g: "ombros", x: 61, y: 33, w: 16, h: 14, ellipse: true },
  { g: "peitoral", x: 36, y: 34, w: 13.5, h: 17, r: 5 },
  { g: "peitoral", x: 50.5, y: 34, w: 13.5, h: 17, r: 5 },
  { g: "abdomen", x: 39, y: 53, w: 22, h: 29, r: 6 },
  { g: "biceps", x: 20, y: 48, w: 10, h: 22, r: 5 },
  { g: "biceps", x: 70, y: 48, w: 10, h: 22, r: 5 },
  { g: "antebracos", x: 17, y: 72, w: 9, h: 25, r: 4.5 },
  { g: "antebracos", x: 74, y: 72, w: 9, h: 25, r: 4.5 },
  { g: null, x: 38, y: 83, w: 24, h: 12, r: 5 },
  { g: "quadriceps", x: 36.5, y: 97, w: 12.5, h: 42, r: 6 },
  { g: "quadriceps", x: 51, y: 97, w: 12.5, h: 42, r: 6 },
  { g: null, x: 38, y: 142, w: 10, h: 38, r: 5 },
  { g: null, x: 52, y: 142, w: 10, h: 38, r: 5 },
];

const BACK: Shape[] = [
  { g: null, x: 44, y: 26, w: 12, h: 8, r: 3 },
  { g: "ombros", x: 23, y: 33, w: 16, h: 14, ellipse: true },
  { g: "ombros", x: 61, y: 33, w: 16, h: 14, ellipse: true },
  { g: "costas", x: 36, y: 34, w: 28, h: 36, r: 8 },
  { g: null, x: 40, y: 71.5, w: 20, h: 10, r: 4 },
  { g: "triceps", x: 20, y: 48, w: 10, h: 22, r: 5 },
  { g: "triceps", x: 70, y: 48, w: 10, h: 22, r: 5 },
  { g: "antebracos", x: 17, y: 72, w: 9, h: 25, r: 4.5 },
  { g: "antebracos", x: 74, y: 72, w: 9, h: 25, r: 4.5 },
  { g: "gluteos", x: 37.5, y: 83, w: 12, h: 16, r: 6 },
  { g: "gluteos", x: 50.5, y: 83, w: 12, h: 16, r: 6 },
  { g: "posteriores", x: 37, y: 101, w: 12, h: 38, r: 6 },
  { g: "posteriores", x: 51, y: 101, w: 12, h: 38, r: 6 },
  { g: "panturrilhas", x: 38, y: 142, w: 10, h: 38, r: 5 },
  { g: "panturrilhas", x: 52, y: 142, w: 10, h: 38, r: 5 },
];

function Figure({ shapes, dx, primary, secondary }: { shapes: Shape[]; dx: number; primary: MuscleGroup; secondary: MuscleGroup[] }) {
  return (
    <g transform={`translate(${dx} 0)`}>
      <circle cx={50} cy={15} r={10} fill="var(--color-surface-3)" stroke="var(--color-line)" />
      {shapes.map((s, i) => {
        const fill =
          s.g === primary ? "var(--color-accent)" : s.g && secondary.includes(s.g) ? "color-mix(in srgb, var(--color-accent) 40%, var(--color-surface-3))" : "var(--color-surface-3)";
        const common = { fill, stroke: "var(--color-bg)", strokeWidth: 1.5 };
        return s.ellipse ? (
          <ellipse key={i} cx={s.x + s.w / 2} cy={s.y + s.h / 2} rx={s.w / 2} ry={s.h / 2} {...common} />
        ) : (
          <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r ?? 4} {...common} />
        );
      })}
    </g>
  );
}

export function BodyMap({ primary, secondary, className = "" }: { primary: MuscleGroup; secondary: MuscleGroup[]; className?: string }) {
  const label = `Músculos trabalhados: ${MUSCLE_LABELS[primary]} (principal)${secondary.length ? ", " + secondary.map((g) => MUSCLE_LABELS[g]).join(", ") : ""}`;
  return (
    <svg viewBox="0 0 210 196" role="img" aria-label={label} className={className}>
      <Figure shapes={FRONT} dx={0} primary={primary} secondary={secondary} />
      <Figure shapes={BACK} dx={110} primary={primary} secondary={secondary} />
      <text x={50} y={193} textAnchor="middle" fontSize={9} fill="var(--color-muted)">
        Frente
      </text>
      <text x={160} y={193} textAnchor="middle" fontSize={9} fill="var(--color-muted)">
        Costas
      </text>
    </svg>
  );
}
