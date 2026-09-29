"use client";

import { useId, useState } from "react";
import { IconCheck, IconMinus, IconPlus } from "../icons";
import { Button } from "../ui";
import { formatNumber } from "@/lib/stats";
import { parseDecimal, validateSetInput, type ParsedSet, type SetErrors, type SetInput } from "@/lib/validation";
import type { RepUnit } from "@/lib/types";

interface Props {
  setNumber: number;
  totalSets: number;
  repMin: number;
  repMax: number;
  targetRir: number | null;
  repUnit: RepUnit;
  loadUnit: string;
  loadStep: number;
  draft: SetInput;
  onDraft: (d: SetInput) => void;
  /** Carga usada na mesma série da última sessão (apenas referência). */
  lastLoad: number | null;
  /** Carga da série anterior nesta sessão. */
  prevLoad: number | null;
  onComplete: (v: ParsedSet) => void;
}

function roundTo(v: number, step: number) {
  return Math.round(v / step) * step;
}

function Stepper({
  id,
  value,
  onChange,
  step,
  suffix,
  inputMode,
  invalid,
  describedBy,
  label,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  step: number;
  suffix: string;
  inputMode: "decimal" | "numeric";
  invalid: boolean;
  describedBy?: string;
  label: string;
}) {
  const bump = (dir: 1 | -1) => {
    const cur = parseDecimal(value);
    const base = cur === null || Number.isNaN(cur) ? 0 : cur;
    const next = Math.max(0, roundTo(base + dir * step, step));
    onChange(String(Number(next.toFixed(2))).replace(".", ","));
  };
  return (
    <div className="flex items-stretch gap-2">
      <button type="button" onClick={() => bump(-1)} aria-label={`Diminuir ${label}`} className="flex w-14 items-center justify-center rounded-xl bg-surface-3 active:bg-line">
        <IconMinus />
      </button>
      <div className="relative flex-1">
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode={inputMode}
          autoComplete="off"
          enterKeyHint="done"
          aria-invalid={invalid}
          aria-describedby={describedBy}
          placeholder="—"
          className="tabular h-16 w-full rounded-xl border border-line bg-surface-2 pr-12 text-center text-3xl font-bold text-ink placeholder:text-faint focus:border-accent focus:outline-none aria-[invalid=true]:border-danger"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted">{suffix}</span>
      </div>
      <button type="button" onClick={() => bump(1)} aria-label={`Aumentar ${label}`} className="flex w-14 items-center justify-center rounded-xl bg-surface-3 active:bg-line">
        <IconPlus />
      </button>
    </div>
  );
}

const RIR_OPTIONS = [0, 1, 2, 3, 4, 5];

export function SetEditor(p: Props) {
  const uid = useId();
  const [errors, setErrors] = useState<SetErrors>({});
  const unitLabel = p.repUnit === "seconds" ? "s" : "reps";

  function update(patch: Partial<SetInput>) {
    p.onDraft({ ...p.draft, ...patch });
    setErrors((e) => {
      const n = { ...e };
      for (const k of Object.keys(patch)) delete n[k as keyof SetInput];
      return n;
    });
  }

  function submit() {
    const r = validateSetInput(p.draft);
    if (!r.ok) {
      setErrors(r.errors);
      return;
    }
    setErrors({});
    p.onComplete(r.value);
  }

  const loadChips: { label: string; value: number }[] = [];
  if (p.prevLoad !== null) loadChips.push({ label: `Igual à anterior (${formatNumber(p.prevLoad)} ${p.loadUnit})`, value: p.prevLoad });
  if (p.lastLoad !== null && p.lastLoad !== p.prevLoad) loadChips.push({ label: `Última sessão (${formatNumber(p.lastLoad)} ${p.loadUnit})`, value: p.lastLoad });

  return (
    <div className="space-y-4 rounded-2xl border border-accent bg-surface p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-lg font-bold">
          Série {p.setNumber} <span className="text-muted">de {p.totalSets}</span>
        </p>
        <p className="tabular text-sm text-muted">
          meta {p.repMin}–{p.repMax} {unitLabel}
          {p.targetRir !== null ? ` · RIR ${p.targetRir}` : ""}
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor={`${uid}-load`} className="text-sm font-medium text-muted">
          Carga
        </label>
        <Stepper
          id={`${uid}-load`}
          label="carga"
          value={p.draft.load}
          onChange={(v) => update({ load: v })}
          step={p.loadStep}
          suffix={p.loadUnit}
          inputMode="decimal"
          invalid={Boolean(errors.load)}
          describedBy={errors.load ? `${uid}-load-err` : undefined}
        />
        {errors.load && (
          <p id={`${uid}-load-err`} role="alert" className="text-sm font-medium text-danger">
            {errors.load}
          </p>
        )}
        {loadChips.length > 0 && p.draft.load.trim() === "" && (
          <div className="flex flex-wrap gap-2">
            {loadChips.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => update({ load: String(c.value).replace(".", ",") })}
                className="min-h-10 rounded-full border border-line bg-surface-2 px-3 text-sm text-ink"
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
        {p.draft.load.trim() === "" && <p className="text-xs text-faint">Deixe vazio para exercícios só com o peso corporal.</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor={`${uid}-reps`} className="text-sm font-medium text-muted">
          {p.repUnit === "seconds" ? "Tempo realizado" : "Repetições realizadas"}
        </label>
        <Stepper
          id={`${uid}-reps`}
          label={p.repUnit === "seconds" ? "tempo" : "repetições"}
          value={p.draft.reps}
          onChange={(v) => update({ reps: v })}
          step={p.repUnit === "seconds" ? 5 : 1}
          suffix={unitLabel}
          inputMode="numeric"
          invalid={Boolean(errors.reps)}
          describedBy={errors.reps ? `${uid}-reps-err` : undefined}
        />
        {errors.reps && (
          <p id={`${uid}-reps-err`} role="alert" className="text-sm font-medium text-danger">
            {errors.reps}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <p id={`${uid}-rir`} className="text-sm font-medium text-muted">
          Repetições em reserva (RIR) <span className="text-faint">— opcional</span>
        </p>
        <div role="radiogroup" aria-labelledby={`${uid}-rir`} className="grid grid-cols-6 gap-1.5">
          {RIR_OPTIONS.map((n) => {
            const selected = p.draft.rir === String(n);
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => update({ rir: selected ? "" : String(n) })}
                className={`tabular min-h-12 rounded-xl text-lg font-bold ${selected ? "bg-accent text-accent-ink" : "bg-surface-3 text-ink"}`}
              >
                {n === 5 ? "5+" : n}
              </button>
            );
          })}
        </div>
        {errors.rir && (
          <p role="alert" className="text-sm font-medium text-danger">
            {errors.rir}
          </p>
        )}
      </div>

      <Button block size="xl" onClick={submit}>
        <IconCheck /> Concluir série
      </Button>
    </div>
  );
}
