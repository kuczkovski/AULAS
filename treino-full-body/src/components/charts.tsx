"use client";

import { useEffect, useRef, useState } from "react";
import { formatDate, formatNumber } from "@/lib/stats";

// Gráficos leves em SVG. Série única (cor --color-series), grade discreta,
// tooltip com linha-guia e alternativa em tabela para acessibilidade.

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(320);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => e && setW(Math.max(200, Math.floor(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, w };
}

function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) {
    const pad = Math.max(1, Math.abs(min) * 0.1);
    min -= pad;
    max += pad;
  }
  const span = max - min;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count) ?? raw;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.5; v += step) ticks.push(Number(v.toFixed(6)));
  return ticks;
}

export interface LinePoint {
  x: number;
  y: number;
  note?: string;
}

export function LineChart({ points, unit, label, height = 200 }: { points: LinePoint[]; unit: string; label: string; height?: number }) {
  const { ref, w } = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);

  if (points.length === 0) return null;

  const padL = 44;
  const padR = 14;
  const padT = 12;
  const padB = 26;
  const ys = points.map((p) => p.y);
  const ticks = niceTicks(Math.min(...ys), Math.max(...ys));
  const yMin = ticks[0]!;
  const yMax = ticks[ticks.length - 1]!;
  const plotW = w - padL - padR;
  const plotH = height - padT - padB;
  const xAt = (i: number) => padL + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const yAt = (v: number) => padT + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH;
  const path = points.map((p, i) => `${i ? "L" : "M"}${xAt(i).toFixed(1)},${yAt(p.y).toFixed(1)}`).join(" ");
  const active = hover !== null ? points[hover] : null;

  function pick(clientX: number, rect: DOMRect) {
    const x = clientX - rect.left;
    let best = 0;
    let dist = Infinity;
    points.forEach((_, i) => {
      const d = Math.abs(xAt(i) - x);
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    setHover(best);
  }

  return (
    <figure className="space-y-2">
      <div ref={ref} className="relative w-full">
        {table ? (
          <table className="w-full text-sm">
            <caption className="sr-only">{label}</caption>
            <thead>
              <tr className="text-left text-muted">
                <th className="py-1 font-medium">Data</th>
                <th className="py-1 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p, i) => (
                <tr key={i} className="border-t border-line">
                  <td className="py-1.5">{formatDate(p.x, { day: "2-digit", month: "short", year: "2-digit" })}</td>
                  <td className="tabular py-1.5 text-right">
                    {formatNumber(p.y)} {unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <svg
            width={w}
            height={height}
            role="img"
            aria-label={`${label}. ${points.length} registros, de ${formatNumber(points[0]!.y)} a ${formatNumber(points.at(-1)!.y)} ${unit}.`}
            tabIndex={0}
            className="touch-pan-y select-none"
            onPointerMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
            onPointerDown={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
            onPointerLeave={() => setHover(null)}
            onBlur={() => setHover(null)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") setHover((h) => Math.min(points.length - 1, (h ?? -1) + 1));
              if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? points.length) - 1));
            }}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line x1={padL} x2={w - padR} y1={yAt(t)} y2={yAt(t)} stroke="var(--color-line)" strokeWidth={1} opacity={0.6} />
                <text x={padL - 8} y={yAt(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--color-faint)" className="tabular">
                  {formatNumber(t, 1)}
                </text>
              </g>
            ))}
            <text x={padL} y={height - 6} fontSize={11} fill="var(--color-faint)">
              {formatDate(points[0]!.x)}
            </text>
            {points.length > 1 && (
              <text x={w - padR} y={height - 6} textAnchor="end" fontSize={11} fill="var(--color-faint)">
                {formatDate(points.at(-1)!.x)}
              </text>
            )}
            {active && hover !== null && (
              <line x1={xAt(hover)} x2={xAt(hover)} y1={padT} y2={padT + plotH} stroke="var(--color-muted)" strokeWidth={1} strokeDasharray="3 3" />
            )}
            <path d={path} fill="none" stroke="var(--color-series)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {points.map((p, i) => (
              <circle
                key={i}
                cx={xAt(i)}
                cy={yAt(p.y)}
                r={hover === i ? 5.5 : 4}
                fill="var(--color-series)"
                stroke="var(--color-surface)"
                strokeWidth={2}
              />
            ))}
          </svg>
        )}
        {!table && active && hover !== null && (
          <div
            className="pointer-events-none absolute top-0 rounded-lg border border-line bg-surface-3 px-2.5 py-1.5 text-xs shadow-lg"
            style={{ left: Math.min(Math.max(xAt(hover) - 60, 0), w - 120), width: 120 }}
          >
            <p className="tabular text-sm font-bold text-ink">
              {formatNumber(active.y)} {unit}
            </p>
            <p className="text-muted">{formatDate(active.x, { day: "2-digit", month: "short", year: "2-digit" })}</p>
            {active.note && <p className="text-faint">{active.note}</p>}
          </div>
        )}
      </div>
      {points.length === 1 && <p className="text-xs text-faint">A tendência aparece a partir do segundo registro.</p>}
      <button type="button" onClick={() => setTable((t) => !t)} className="text-xs font-semibold text-accent">
        {table ? "Ver gráfico" : "Ver tabela"}
      </button>
    </figure>
  );
}

export function HBarChart({ items, unit, label }: { items: { key: string; label: string; value: number; detail?: string }[]; unit: string; label: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul aria-label={label} className="space-y-2.5">
      {items.map((i) => (
        <li key={i.key} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3 text-sm" title={i.detail}>
          <span className="truncate text-muted">{i.label}</span>
          <span className="h-3 overflow-hidden rounded-r bg-surface-3/40">
            <span className="block h-full rounded-r" style={{ width: `${(i.value / max) * 100}%`, background: "var(--color-series)" }} />
          </span>
          <span className="tabular min-w-12 text-right font-semibold">
            {formatNumber(i.value)}
            <span className="ml-1 text-xs font-normal text-faint">{unit}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ColumnChart({ items, label, height = 110 }: { items: { key: string; label: string; value: number; title: string }[]; label: string; height?: number }) {
  const max = Math.max(4, ...items.map((i) => i.value));
  return (
    <div role="img" aria-label={`${label}: ${items.map((i) => `${i.title}, ${i.value}`).join("; ")}`}>
      <div className="flex items-end gap-1.5" style={{ height }} aria-hidden="true">
        {items.map((i) => (
          <div key={i.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${i.title}: ${i.value}`}>
            <span className="tabular text-xs font-semibold text-ink">{i.value > 0 ? i.value : ""}</span>
            <span
              className="w-full max-w-8 rounded-t"
              style={{ height: `${(i.value / max) * (height - 22)}px`, minHeight: i.value > 0 ? 4 : 2, background: i.value > 0 ? "var(--color-series)" : "var(--color-surface-3)" }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5" aria-hidden="true">
        {items.map((i) => (
          <span key={i.key} className="flex-1 text-center text-[10px] text-faint">
            {i.label}
          </span>
        ))}
      </div>
    </div>
  );
}
