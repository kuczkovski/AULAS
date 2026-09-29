"use client";
import { useEffect, useRef, useState } from "react";

const W = 340, X0 = 16, X1 = W - 16;

/** Reta numérica em que o aluno toca (ou usa as setas) para marcar um ponto. */
export function RetaInterativa({
  reta,
  alvo,
  escolhida,
  onConfirmar,
}: {
  reta: { min: number; max: number; passo: number; tolerancia: number };
  alvo: number;
  /** Ponto enviado pelo aluno; definido quando já foi respondida. */
  escolhida?: number;
  onConfirmar: (valor: number) => void;
}) {
  const { min, max, passo } = reta;
  const travada = escolhida !== undefined;
  const [valor, setValor] = useState<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);

  const x = (v: number) => X0 + ((v - min) / (max - min)) * (X1 - X0);
  const snap = (v: number) => Math.min(max, Math.max(min, Math.round((v - min) / passo) * passo + min));
  const doPonteiro = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setValor(snap(min + ((px - X0) / (X1 - X0)) * (max - min)));
  };

  useEffect(() => {
    if (travada) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        setValor((v) => snap((v ?? (min + max) / 2) + (e.key === "ArrowRight" ? passo : -passo)));
      } else if (e.key === "Enter" && valor !== null) { e.preventDefault(); onConfirmar(valor); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [travada, valor, min, max, passo, onConfirmar]);

  const n = Math.round((max - min) / passo);
  const inteiro = (v: number) => Math.abs(v - Math.round(v)) < 1e-9;
  const mostrado = travada ? escolhida : valor;
  const errou = travada && Math.abs(escolhida - alvo) > reta.tolerancia + 1e-9;

  return (
    <div className="mx-auto max-w-xl">
      <svg
        ref={svg}
        viewBox={`0 0 ${W} 96`}
        className="w-full touch-none select-none rounded-2xl bg-fundo/60"
        role="slider"
        aria-label="Reta numérica. Use as setas para mover o ponto e Enter para confirmar"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={mostrado ?? undefined}
        tabIndex={0}
        onPointerDown={(e) => { if (!travada) { (e.target as Element).setPointerCapture?.(e.pointerId); doPonteiro(e); } }}
        onPointerMove={(e) => { if (!travada && e.buttons) doPonteiro(e); }}
      >
        <line x1={X0} x2={X1} y1={46} y2={46} stroke="#55527a" strokeWidth={3} strokeLinecap="round" />
        {Array.from({ length: n + 1 }, (_, i) => min + i * passo).map((t, i) => (
          <line key={i} x1={x(t)} x2={x(t)} y1={inteiro(t) ? 36 : 40} y2={inteiro(t) ? 56 : 52} stroke="#55527a" strokeWidth={inteiro(t) ? 2.5 : 1.5} />
        ))}
        {Array.from({ length: Math.floor(max - min) + 1 }, (_, i) => min + i)
          .filter((t) => max - min <= 4 || t % 2 === 0 || t === min || t === max)
          .map((t) => (
            <text key={t} x={x(t)} y={78} textAnchor="middle" fontSize={13} fontWeight={t === 0 ? 800 : 600} fill="#55527a">{String(t).replace("-", "−")}</text>
          ))}
        {travada && <circle cx={x(alvo)} cy={46} r={10} fill="#0e7c3f" stroke="#fff" strokeWidth={3} />}
        {mostrado !== null && (
          <circle cx={x(mostrado)} cy={46} r={travada && !errou ? 5 : 10} fill={travada ? (errou ? "#c4213f" : "#fff") : "#5b3df5"} stroke="#fff" strokeWidth={3} />
        )}
        {mostrado === null && <text x={W / 2} y={22} textAnchor="middle" fontSize={12} fontWeight={700} fill="#55527a">toque na reta</text>}
      </svg>
      {!travada && (
        <div className="mt-4 text-center">
          <button type="button" className="btn btn-marca" disabled={valor === null} onClick={() => valor !== null && onConfirmar(valor)}>Confirmar</button>
        </div>
      )}
    </div>
  );
}
