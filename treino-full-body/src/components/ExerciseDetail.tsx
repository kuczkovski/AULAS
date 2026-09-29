"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LineChart } from "./charts";
import { ExerciseDemo } from "./ExerciseDemo";
import { IconEdit } from "./icons";
import { ProgressionCard } from "./training/ProgressionCard";
import { Card, EmptyState, LinkButton, Page, PageHeader } from "./ui";
import { useExerciseMap, useProfile, useSessions, useTemplates } from "@/lib/hooks";
import { LOAD_DECISION_LABELS, exerciseHistory } from "@/lib/progression";
import { finishedSessions, formatDate, formatNumber } from "@/lib/stats";
import { MUSCLE_LABELS } from "@/lib/types";

export function ExerciseDetail() {
  const id = useSearchParams().get("id") ?? "";
  const exMap = useExerciseMap();
  const sessions = useSessions();
  const templates = useTemplates();
  const profile = useProfile();

  if (!exMap || !sessions) return <Page><PageHeader title="Exercício" back="/programa/exercicios/" /></Page>;
  const ex = exMap.get(id);
  if (!ex || ex.deletedAt) {
    return (
      <Page>
        <PageHeader title="Exercício" back="/programa/exercicios/" />
        <EmptyState title="Exercício não encontrado" />
      </Page>
    );
  }

  const history = exerciseHistory(id, finishedSessions(sessions));
  const last = history.at(-1);
  const usedIn = (templates ?? []).filter((t) => t.items.some((i) => i.exerciseId === id));
  const unit = ex.repUnit === "seconds" ? "s" : "reps";

  return (
    <Page>
      <PageHeader
        title={ex.name}
        subtitle={MUSCLE_LABELS[ex.muscleGroup]}
        back="/programa/exercicios/"
        action={
          <LinkButton href={`/programa/exercicio/editar/?id=${ex.id}`} variant="secondary" size="md">
            <IconEdit size={18} /> Editar
          </LinkButton>
        }
      />
      <div className="space-y-4">
        <Card>
          <ExerciseDemo exercise={ex} />
        </Card>

        <Card>
          <h2 className="mb-2 font-semibold">Prescrição padrão</h2>
          <p className="tabular text-muted">
            {ex.defaultSets} séries · {ex.repMin}–{ex.repMax} {unit} · descanso {ex.restSeconds}s{ex.targetRir !== null ? ` · RIR ${ex.targetRir}` : ""}
          </p>
          {usedIn.length > 0 && <p className="mt-2 text-sm text-faint">No programa: {usedIn.map((t) => t.name).join(", ")}</p>}
        </Card>

        <Card>
          <h2 className="mb-2 font-semibold">Alternativas para substituição</h2>
          {ex.alternativeIds.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma alternativa cadastrada. Adicione em Editar.</p>
          ) : (
            <ul className="space-y-1">
              {ex.alternativeIds.map((a) => {
                const alt = exMap.get(a);
                if (!alt || alt.deletedAt) return null;
                return (
                  <li key={a}>
                    <Link href={`/programa/exercicio/?id=${a}`} className="flex min-h-11 items-center text-accent">
                      {alt.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Histórico de desempenho</h2>
          {history.length === 0 ? (
            <EmptyState title="Ainda sem registros">O histórico aparece após a primeira sessão com este exercício.</EmptyState>
          ) : (
            <>
              {last && (
                <ProgressionCard result={last.evaluation} />
              )}
              {history.some((h) => h.topLoad !== null) && (
                <Card>
                  <p className="mb-2 text-sm font-medium">Carga mais alta ({profile.loadUnit})</p>
                  <LineChart
                    label={`Evolução da carga em ${ex.name}`}
                    unit={profile.loadUnit}
                    points={history.filter((h) => h.topLoad !== null).map((h) => ({ x: h.date, y: h.topLoad as number }))}
                  />
                </Card>
              )}
              <Card>
                <p className="mb-2 text-sm font-medium">{unit === "s" ? "Tempo total (s)" : "Repetições totais"}</p>
                <LineChart label={`Evolução das repetições em ${ex.name}`} unit={unit} points={history.map((h) => ({ x: h.date, y: h.totalReps }))} />
              </Card>
              <Card className="!p-0">
                <ul className="divide-y divide-line">
                  {[...history].reverse().map((h) => (
                    <li key={h.sessionId + h.entry.slotId} className="p-4">
                      <div className="flex items-center justify-between">
                        <Link href={`/historico/sessao/?id=${h.sessionId}`} className="font-medium text-accent">
                          {formatDate(h.date, { day: "2-digit", month: "short", year: "numeric" })}
                        </Link>
                        <span className="text-xs text-muted">{h.evaluation.title}</span>
                      </div>
                      <p className="tabular mt-1 text-sm">
                        {h.entry.sets
                          .filter((s) => s.completedAt !== null)
                          .map((s) => `${s.load !== null ? formatNumber(s.load) : "PC"}×${s.reps}${s.rir !== null ? ` @${s.rir}` : ""}`)
                          .join(" · ")}
                      </p>
                      {h.entry.loadDecision && <p className="text-xs text-faint">Decisão: {LOAD_DECISION_LABELS[h.entry.loadDecision]}</p>}
                      {h.entry.notes && <p className="text-xs text-faint">Obs.: {h.entry.notes}</p>}
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          )}
        </section>
      </div>
    </Page>
  );
}
