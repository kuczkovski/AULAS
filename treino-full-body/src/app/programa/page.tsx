"use client";

import Link from "next/link";
import { useState } from "react";
import { WEEK_PLAN } from "@/data/catalog";
import { useToast } from "@/components/Toast";
import { IconRight } from "@/components/icons";
import { Badge, Button, Card, Field, LinkButton, Page, PageHeader, Select, Sheet, TextInput } from "@/components/ui";
import { useExerciseMap, useExercises, useTemplates } from "@/lib/hooks";
import { saveTemplate } from "@/lib/repo";
import { estimateMinutes } from "@/lib/session";
import { MUSCLE_LABELS, type Exercise, type TemplateItem, type WorkoutTemplate } from "@/lib/types";
import { firstError, prescriptionSchema } from "@/lib/validation";

export default function ProgramPage() {
  const templates = useTemplates();
  const exMap = useExerciseMap();
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ template: WorkoutTemplate; item: TemplateItem } | null>(null);

  return (
    <Page>
      <PageHeader title="Programa" subtitle="Full Body · 4 dias por semana · ~60 min" />

      <Card className="mb-4">
        <h2 className="mb-3 font-semibold">Semana</h2>
        <ul className="space-y-1.5">
          {WEEK_PLAN.map((d) => {
            const t = templates?.find((x) => x.id === d.templateId);
            return (
              <li key={d.weekday} className="flex items-center gap-3 text-sm">
                <span className="w-20 text-muted">{d.label}</span>
                {t ? (
                  <span className="font-medium">
                    {t.name} <span className="text-muted">— {t.focus}</span>
                  </span>
                ) : (
                  <span className="text-faint">Recuperação</span>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="space-y-3">
        {templates?.map((t) => {
          const expanded = open === t.id;
          return (
            <Card key={t.id} className="!p-0">
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : t.id)}
                className="flex w-full items-center gap-4 p-4 text-left"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-3 text-xl font-bold">{t.id}</span>
                <span className="flex-1">
                  <span className="block font-semibold">{t.name}</span>
                  <span className="block text-sm text-muted">{t.focus}</span>
                  <span className="block text-xs text-faint">
                    {t.items.length} exercícios · ~{estimateMinutes(t)} min
                  </span>
                </span>
                <IconRight className={`text-muted transition ${expanded ? "rotate-90" : ""}`} />
              </button>
              {expanded && (
                <ol className="border-t border-line">
                  {t.items.map((item, i) => {
                    const ex = exMap?.get(item.exerciseId);
                    return (
                      <li key={item.slotId} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
                        <span className="tabular w-5 text-faint">{i + 1}</span>
                        <Link href={`/programa/exercicio/?id=${item.exerciseId}`} className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{ex?.name ?? item.exerciseId}</span>
                          <span className="tabular block text-xs text-muted">
                            {item.sets}×{item.repMin}–{item.repMax}
                            {ex?.repUnit === "seconds" ? "s" : ""} · {item.restSeconds}s
                            {item.targetRir !== null ? ` · RIR ${item.targetRir}` : ""}
                            {ex ? ` · ${MUSCLE_LABELS[ex.muscleGroup]}` : ""}
                          </span>
                        </Link>
                        <Button variant="secondary" size="md" onClick={() => setEditing({ template: t, item })}>
                          Editar
                        </Button>
                      </li>
                    );
                  })}
                </ol>
              )}
            </Card>
          );
        })}
      </div>

      <LinkButton href="/programa/exercicios/" variant="secondary" block className="mt-5">
        Catálogo de exercícios
      </LinkButton>

      {editing && exMap && <ItemEditor key={editing.item.slotId} {...editing} exMap={exMap} onClose={() => setEditing(null)} />}
    </Page>
  );
}

function ItemEditor({
  template,
  item,
  exMap,
  onClose,
}: {
  template: WorkoutTemplate;
  item: TemplateItem;
  exMap: Map<string, Exercise>;
  onClose: () => void;
}) {
  const toast = useToast();
  const exercises = useExercises();
  const [exerciseId, setExerciseId] = useState(item.exerciseId);
  const [form, setForm] = useState({
    sets: String(item.sets),
    repMin: String(item.repMin),
    repMax: String(item.repMax),
    restSeconds: String(item.restSeconds),
    targetRir: item.targetRir === null ? "" : String(item.targetRir),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const current = exMap.get(item.exerciseId);
  const group = exMap.get(exerciseId)?.muscleGroup ?? current?.muscleGroup;

  // Alternativas cadastradas primeiro, depois os demais do mesmo grupo muscular.
  const alternatives = new Set(current?.alternativeIds ?? []);
  const options = (exercises ?? [])
    .filter((e) => e.id === item.exerciseId || alternatives.has(e.id) || e.muscleGroup === group)
    .sort((a, b) => Number(alternatives.has(b.id)) - Number(alternatives.has(a.id)));

  async function save() {
    const num = (s: string) => (s.trim() === "" ? Number.NaN : Number(s));
    const parsed = prescriptionSchema.safeParse({
      sets: num(form.sets),
      repMin: num(form.repMin),
      repMax: num(form.repMax),
      restSeconds: num(form.restSeconds),
      targetRir: form.targetRir.trim() === "" ? null : num(form.targetRir),
    });
    if (!parsed.success) {
      setErrors(firstError(parsed.error));
      return;
    }
    try {
      await saveTemplate({
        ...template,
        items: template.items.map((i) => (i.slotId === item.slotId ? { ...i, ...parsed.data, exerciseId } : i)),
      });
      toast("Programa atualizado", "ok");
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Falha ao salvar", "error");
    }
  }

  const input = (key: keyof typeof form, label: string, hint?: string) => (
    <Field label={label} htmlFor={`pi-${key}`} error={errors[key]} hint={hint}>
      <TextInput
        id={`pi-${key}`}
        inputMode="numeric"
        value={form[key]}
        aria-invalid={Boolean(errors[key])}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    </Field>
  );

  return (
    <Sheet open onClose={onClose} title={`${template.name} · posição ${template.items.indexOf(item) + 1}`}>
      <div className="space-y-4">
        <Field label="Exercício" htmlFor="pi-ex" hint="Sessões anteriores mantêm o exercício que foi executado.">
          <Select id="pi-ex" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
                {alternatives.has(o.id) ? " (alternativa)" : ""}
              </option>
            ))}
          </Select>
        </Field>
        {exerciseId !== item.exerciseId && <Badge tone="info">O exercício desta posição será trocado</Badge>}
        <div className="grid grid-cols-3 gap-3">
          {input("sets", "Séries")}
          {input("repMin", "Mín.")}
          {input("repMax", "Máx.")}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {input("restSeconds", "Descanso (s)")}
          {input("targetRir", "RIR alvo", "Opcional")}
        </div>
        <Button block onClick={save}>
          Salvar
        </Button>
      </div>
    </Sheet>
  );
}
