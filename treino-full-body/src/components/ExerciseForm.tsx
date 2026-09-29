"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "./Toast";
import { Button, Field, Page, PageHeader, Segmented, Select, Sheet, TextArea, TextInput } from "./ui";
import { useExerciseMap, useExercises, useTemplates } from "@/lib/hooks";
import { newId } from "@/lib/id";
import { saveExercise, softDelete } from "@/lib/repo";
import { EQUIPMENT, EQUIPMENT_LABELS, MUSCLE_GROUPS, MUSCLE_LABELS, type Exercise, type MuscleGroup, type RepUnit } from "@/lib/types";
import { exerciseFormSchema, firstError } from "@/lib/validation";

interface FormState {
  name: string;
  muscleGroup: MuscleGroup | "";
  secondaryGroups: MuscleGroup[];
  equipment: Exercise["equipment"] | "";
  repUnit: RepUnit;
  defaultSets: string;
  repMin: string;
  repMax: string;
  restSeconds: string;
  targetRir: string;
  cues: string;
  mediaUrl: string;
  alternativeIds: string[];
}

const EMPTY: FormState = {
  name: "",
  muscleGroup: "",
  secondaryGroups: [],
  equipment: "",
  repUnit: "reps",
  defaultSets: "3",
  repMin: "8",
  repMax: "12",
  restSeconds: "90",
  targetRir: "2",
  cues: "",
  mediaUrl: "",
  alternativeIds: [],
};

function fromExercise(e: Exercise): FormState {
  return {
    name: e.name,
    muscleGroup: e.muscleGroup,
    secondaryGroups: e.secondaryGroups,
    equipment: e.equipment,
    repUnit: e.repUnit,
    defaultSets: String(e.defaultSets),
    repMin: String(e.repMin),
    repMax: String(e.repMax),
    restSeconds: String(e.restSeconds),
    targetRir: e.targetRir === null ? "" : String(e.targetRir),
    cues: e.cues.join("\n"),
    mediaUrl: e.mediaUrl ?? "",
    alternativeIds: e.alternativeIds,
  };
}

const num = (s: string) => (s.trim() === "" ? Number.NaN : Number(s.replace(",", ".")));

export function ExerciseForm() {
  const id = useSearchParams().get("id");
  const router = useRouter();
  const toast = useToast();
  const exMap = useExerciseMap();
  const exercises = useExercises();
  const templates = useTemplates();
  const existing = id ? exMap?.get(id) : undefined;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loaded, setLoaded] = useState(!id);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [altQuery, setAltQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (existing && !loaded) {
      setForm(fromExercise(existing));
      setLoaded(true);
    }
  }, [existing, loaded]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => {
      const n = { ...e };
      delete n[k];
      return n;
    });
  };

  if (!exMap || !exercises) return <Page><PageHeader title="Exercício" back="/programa/exercicios/" /></Page>;
  if (id && !existing) {
    return (
      <Page>
        <PageHeader title="Exercício não encontrado" back="/programa/exercicios/" />
      </Page>
    );
  }

  const inUse = id ? (templates ?? []).some((t) => t.items.some((i) => i.exerciseId === id)) : false;
  const candidates = exercises.filter(
    (e) =>
      e.id !== id &&
      (form.alternativeIds.includes(e.id) ||
        (altQuery ? e.name.toLowerCase().includes(altQuery.toLowerCase()) : e.muscleGroup === form.muscleGroup)),
  );

  async function save() {
    const parsed = exerciseFormSchema.safeParse({
      name: form.name,
      muscleGroup: form.muscleGroup || undefined,
      secondaryGroups: form.secondaryGroups.filter((g) => g !== form.muscleGroup),
      equipment: form.equipment || undefined,
      repUnit: form.repUnit,
      defaultSets: num(form.defaultSets),
      repMin: num(form.repMin),
      repMax: num(form.repMax),
      restSeconds: num(form.restSeconds),
      targetRir: form.targetRir.trim() === "" ? null : num(form.targetRir),
      cues: form.cues.split("\n").map((c) => c.trim()).filter(Boolean),
      mediaUrl: form.mediaUrl.trim() || null,
      alternativeIds: form.alternativeIds,
    });
    if (!parsed.success) {
      setErrors(firstError(parsed.error));
      toast("Revise os campos destacados", "error");
      return;
    }
    const dup = exercises!.find((e) => e.id !== id && e.name.trim().toLowerCase() === parsed.data.name.toLowerCase());
    if (dup) {
      setErrors({ name: "Já existe um exercício com este nome" });
      return;
    }
    setSaving(true);
    try {
      const saved = await saveExercise(
        existing
          ? { ...existing, ...parsed.data }
          : { id: newId(), custom: true, updatedAt: Date.now(), deletedAt: null, ...parsed.data },
      );
      // Mantém as alternativas recíprocas.
      const before = new Set(existing?.alternativeIds ?? []);
      const after = new Set(parsed.data.alternativeIds);
      for (const altId of new Set([...before, ...after])) {
        const alt = exMap!.get(altId);
        if (!alt) continue;
        const has = alt.alternativeIds.includes(saved.id);
        if (after.has(altId) && !has) await saveExercise({ ...alt, alternativeIds: [...alt.alternativeIds, saved.id] });
        if (!after.has(altId) && has) await saveExercise({ ...alt, alternativeIds: alt.alternativeIds.filter((x) => x !== saved.id) });
      }
      toast("Exercício salvo", "ok");
      router.replace(`/programa/exercicio/?id=${saved.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Falha ao salvar", "error");
    } finally {
      setSaving(false);
    }
  }

  const numField = (k: "defaultSets" | "repMin" | "repMax" | "restSeconds" | "targetRir", label: string, hint?: string) => (
    <Field label={label} htmlFor={`ef-${k}`} error={errors[k]} hint={hint}>
      <TextInput id={`ef-${k}`} inputMode="numeric" value={form[k]} aria-invalid={Boolean(errors[k])} onChange={(e) => set(k, e.target.value)} />
    </Field>
  );

  return (
    <Page>
      <PageHeader title={existing ? "Editar exercício" : "Novo exercício"} back={existing ? `/programa/exercicio/?id=${existing.id}` : "/programa/exercicios/"} />
      <form
        className="space-y-5"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <Field label="Nome" htmlFor="ef-name" error={errors.name}>
          <TextInput id="ef-name" value={form.name} maxLength={80} aria-invalid={Boolean(errors.name)} onChange={(e) => set("name", e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Grupo muscular" htmlFor="ef-group" error={errors.muscleGroup}>
            <Select id="ef-group" value={form.muscleGroup} aria-invalid={Boolean(errors.muscleGroup)} onChange={(e) => set("muscleGroup", e.target.value as MuscleGroup)}>
              <option value="">Selecione</option>
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {MUSCLE_LABELS[g]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Equipamento" htmlFor="ef-eq" error={errors.equipment}>
            <Select id="ef-eq" value={form.equipment} aria-invalid={Boolean(errors.equipment)} onChange={(e) => set("equipment", e.target.value as Exercise["equipment"])}>
              <option value="">Selecione</option>
              {EQUIPMENT.map((q) => (
                <option key={q} value={q}>
                  {EQUIPMENT_LABELS[q]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-muted">Grupos auxiliares</legend>
          <div className="flex flex-wrap gap-2">
            {MUSCLE_GROUPS.filter((g) => g !== form.muscleGroup).map((g) => {
              const on = form.secondaryGroups.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set("secondaryGroups", on ? form.secondaryGroups.filter((x) => x !== g) : [...form.secondaryGroups, g])}
                  className={`min-h-10 rounded-full border px-3 text-sm ${on ? "border-accent bg-accent-soft" : "border-line bg-surface-2 text-muted"}`}
                >
                  {MUSCLE_LABELS[g]}
                </button>
              );
            })}
          </div>
          {errors.secondaryGroups && <p className="mt-1 text-sm text-danger">Selecione no máximo 4</p>}
        </fieldset>

        <Field label="Medida" htmlFor="ef-unit">
          <Segmented
            label="Medida"
            value={form.repUnit}
            onChange={(v) => set("repUnit", v)}
            options={[
              { value: "reps", label: "Repetições" },
              { value: "seconds", label: "Tempo (s)" },
            ]}
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          {numField("defaultSets", "Séries")}
          {numField("repMin", "Faixa mín.")}
          {numField("repMax", "Faixa máx.")}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {numField("restSeconds", "Descanso (s)")}
          {numField("targetRir", "RIR alvo", "Opcional (0–10)")}
        </div>

        <Field label="Observações de execução" htmlFor="ef-cues" hint="Um ponto técnico por linha" error={errors.cues}>
          <TextArea id="ef-cues" rows={4} value={form.cues} onChange={(e) => set("cues", e.target.value)} />
        </Field>

        <Field label="Mídia de demonstração (opcional)" htmlFor="ef-media" hint="Endereço https de imagem, GIF ou vídeo" error={errors.mediaUrl}>
          <TextInput id="ef-media" type="url" inputMode="url" value={form.mediaUrl} aria-invalid={Boolean(errors.mediaUrl)} onChange={(e) => set("mediaUrl", e.target.value)} />
        </Field>

        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium text-muted">Alternativas para substituição ({form.alternativeIds.length})</legend>
          <TextInput type="search" aria-label="Buscar alternativas" placeholder="Buscar em todo o catálogo" value={altQuery} onChange={(e) => setAltQuery(e.target.value)} />
          <ul className="max-h-72 space-y-1.5 overflow-y-auto">
            {candidates.map((c) => {
              const on = form.alternativeIds.includes(c.id);
              return (
                <li key={c.id}>
                  <label className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 ${on ? "border-accent bg-accent-soft" : "border-line bg-surface-2"}`}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => set("alternativeIds", on ? form.alternativeIds.filter((x) => x !== c.id) : [...form.alternativeIds, c.id])}
                      className="h-5 w-5 accent-[var(--color-accent)]"
                    />
                    <span className="flex-1 text-sm">{c.name}</span>
                    <span className="text-xs text-faint">{MUSCLE_LABELS[c.muscleGroup]}</span>
                  </label>
                </li>
              );
            })}
            {candidates.length === 0 && <li className="text-sm text-faint">Escolha o grupo muscular ou busque pelo nome.</li>}
          </ul>
        </fieldset>

        <Button type="submit" block size="xl" disabled={saving}>
          Salvar exercício
        </Button>
        {existing?.custom && (
          <Button block variant="danger" onClick={() => setConfirmDelete(true)} disabled={inUse}>
            {inUse ? "Em uso no programa (não pode excluir)" : "Excluir exercício"}
          </Button>
        )}
      </form>

      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Excluir exercício?">
        <p className="mb-4 text-muted">O histórico de sessões anteriores é preservado.</p>
        <Button
          block
          variant="danger"
          onClick={async () => {
            try {
              await softDelete("exercises", existing!.id);
              router.replace("/programa/exercicios/");
            } catch (err) {
              toast(err instanceof Error ? err.message : "Falha ao excluir", "error");
            }
          }}
        >
          Excluir
        </Button>
      </Sheet>
    </Page>
  );
}
