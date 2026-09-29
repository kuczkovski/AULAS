"use client";

import { useState } from "react";
import { HealthNotice } from "../HealthNotice";
import { Button, Field, Sheet, TextArea, TextInput } from "../ui";
import { needsProfessionalNotice } from "@/lib/stats";
import { discomfortSchema, firstError } from "@/lib/validation";
import type { DiscomfortAction, DiscomfortCharacter } from "@/lib/types";

const REGIONS = ["Ombro", "Cotovelo", "Punho", "Pescoço", "Lombar", "Quadril", "Joelho", "Tornozelo", "Peito"];

const CHARACTERS: { value: DiscomfortCharacter; label: string }[] = [
  { value: "pontual", label: "Pontual, passou logo" },
  { value: "persistente", label: "Persistente" },
  { value: "irradiada", label: "Irradia / se espalha" },
  { value: "piora", label: "Piorando" },
];

const ACTIONS: { value: DiscomfortAction; label: string; hint: string }[] = [
  { value: "continuou", label: "Registrar e continuar", hint: "Apenas anota o desconforto" },
  { value: "pulou_exercicio", label: "Pular este exercício", hint: "Segue para o próximo" },
  { value: "interrompeu_sessao", label: "Interromper a sessão", hint: "Encerra o treino agora" },
];

export interface DiscomfortInput {
  region: string;
  intensity: number;
  characters: DiscomfortCharacter[];
  action: DiscomfortAction;
  note: string;
}

export function DiscomfortSheet({
  open,
  onClose,
  exerciseName,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  exerciseName: string | null;
  onSave: (v: DiscomfortInput) => Promise<void>;
}) {
  const [region, setRegion] = useState("");
  const [intensity, setIntensity] = useState(3);
  const [characters, setCharacters] = useState<DiscomfortCharacter[]>([]);
  const [action, setAction] = useState<DiscomfortAction>("continuou");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const warn = needsProfessionalNotice({ characters, intensity });

  function reset() {
    setRegion("");
    setIntensity(3);
    setCharacters([]);
    setAction("continuou");
    setNote("");
    setErrors({});
  }

  async function submit() {
    const parsed = discomfortSchema.safeParse({ region, intensity, characters, action, note });
    if (!parsed.success) {
      setErrors(firstError(parsed.error));
      return;
    }
    setSaving(true);
    try {
      await onSave(parsed.data);
      reset();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Registrar desconforto">
      <div className="space-y-5">
        {exerciseName && <p className="text-sm text-muted">Durante: {exerciseName}</p>}

        <Field label="Região" htmlFor="dc-region" error={errors.region}>
          <div className="flex flex-wrap gap-2 pb-1">
            {REGIONS.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={region === r}
                onClick={() => setRegion(r)}
                className={`min-h-10 rounded-full border px-3 text-sm ${region === r ? "border-accent bg-accent-soft text-ink" : "border-line bg-surface-2 text-muted"}`}
              >
                {r}
              </button>
            ))}
          </div>
          <TextInput id="dc-region" value={region} maxLength={60} onChange={(e) => setRegion(e.target.value)} placeholder="Ou descreva a região" aria-invalid={Boolean(errors.region)} />
        </Field>

        <Field label={`Intensidade percebida: ${intensity}/10`} htmlFor="dc-intensity">
          <input
            id="dc-intensity"
            type="range"
            min={0}
            max={10}
            step={1}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="h-10 w-full accent-[var(--color-accent)]"
          />
          <div className="flex justify-between text-xs text-faint">
            <span>leve</span>
            <span>intensa</span>
          </div>
        </Field>

        <fieldset className="space-y-2">
          <legend className="mb-1.5 text-sm font-medium text-muted">Características</legend>
          {CHARACTERS.map((c) => {
            const on = characters.includes(c.value);
            return (
              <label key={c.value} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 ${on ? "border-accent bg-accent-soft" : "border-line bg-surface-2"}`}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => setCharacters((l) => (on ? l.filter((x) => x !== c.value) : [...l, c.value]))}
                  className="h-5 w-5 accent-[var(--color-accent)]"
                />
                {c.label}
              </label>
            );
          })}
        </fieldset>

        {warn && <HealthNotice emphasis />}

        <fieldset className="space-y-2">
          <legend className="mb-1.5 text-sm font-medium text-muted">O que fazer agora</legend>
          {ACTIONS.map((a) => (
            <label key={a.value} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 ${action === a.value ? "border-accent bg-accent-soft" : "border-line bg-surface-2"}`}>
              <input type="radio" name="dc-action" checked={action === a.value} onChange={() => setAction(a.value)} className="h-5 w-5 accent-[var(--color-accent)]" />
              <span>
                <span className="block font-medium">{a.label}</span>
                <span className="block text-xs text-muted">{a.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <Field label="Observação (opcional)" htmlFor="dc-note" error={errors.note}>
          <TextArea id="dc-note" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
        </Field>

        <Button block size="xl" variant={action === "interrompeu_sessao" ? "danger" : "primary"} onClick={submit} disabled={saving}>
          {action === "interrompeu_sessao" ? "Registrar e interromper" : "Registrar"}
        </Button>
      </div>
    </Sheet>
  );
}
