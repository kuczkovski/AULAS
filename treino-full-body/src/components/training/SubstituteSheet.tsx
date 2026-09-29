"use client";

import { useState } from "react";
import { EQUIPMENT_LABELS, MUSCLE_LABELS, type Exercise, type SessionExercise } from "@/lib/types";
import { Button, EmptyState, Field, Sheet, TextInput } from "../ui";

interface Props {
  open: boolean;
  onClose: () => void;
  entry: SessionExercise;
  exMap: Map<string, Exercise>;
  onConfirm: (alt: Exercise, reason: string | null) => void;
}

/** Lista apenas alternativas previamente cadastradas para o exercício. */
export function SubstituteSheet({ open, onClose, entry, exMap, onConfirm }: Props) {
  const [reason, setReason] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const planned = exMap.get(entry.plannedExerciseId);
  const ids = new Set<string>([...(planned?.alternativeIds ?? []), ...(exMap.get(entry.exerciseId)?.alternativeIds ?? [])]);
  if (entry.exerciseId !== entry.plannedExerciseId) ids.add(entry.plannedExerciseId);
  ids.delete(entry.exerciseId);
  const options = [...ids].map((id) => exMap.get(id)).filter((e): e is Exercise => Boolean(e && !e.deletedAt));
  const hasCompleted = entry.sets.some((s) => s.completedAt !== null);

  function close() {
    setSelected(null);
    setReason("");
    onClose();
  }

  return (
    <Sheet open={open} onClose={close} title="Substituir exercício">
      {hasCompleted ? (
        <p className="rounded-xl border border-warn bg-warn-soft p-3 text-sm">
          Já há séries concluídas em <strong>{entry.exerciseName}</strong>. Para preservar o histórico, reabra essas séries antes de
          substituir o exercício.
        </p>
      ) : options.length === 0 ? (
        <EmptyState title="Nenhuma alternativa cadastrada">
          Cadastre alternativas na página do exercício, em Programa → Exercícios.
        </EmptyState>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            A troca vale só para esta sessão e fica registrada no histórico. O programa não é alterado.
          </p>
          <div role="radiogroup" aria-label="Alternativas" className="space-y-2">
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={selected === o.id}
                onClick={() => setSelected(o.id)}
                className={`w-full rounded-2xl border p-4 text-left ${selected === o.id ? "border-accent bg-accent-soft" : "border-line bg-surface-2"}`}
              >
                <span className="block font-semibold">
                  {o.name}
                  {o.id === entry.plannedExerciseId && <span className="ml-2 text-xs text-accent">planejado</span>}
                </span>
                <span className="block text-sm text-muted">
                  {MUSCLE_LABELS[o.muscleGroup]} · {EQUIPMENT_LABELS[o.equipment]}
                </span>
              </button>
            ))}
          </div>
          <Field label="Motivo (opcional)" htmlFor="sub-reason">
            <TextInput id="sub-reason" value={reason} maxLength={120} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: equipamento ocupado" />
          </Field>
          <Button
            block
            disabled={!selected}
            onClick={() => {
              const alt = selected ? exMap.get(selected) : undefined;
              if (alt) onConfirm(alt, reason.trim() || null);
              close();
            }}
          >
            Confirmar substituição
          </Button>
        </div>
      )}
    </Sheet>
  );
}
