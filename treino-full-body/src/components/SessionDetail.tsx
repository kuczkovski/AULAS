"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { HealthNotice } from "./HealthNotice";
import { useToast } from "./Toast";
import { ProgressionCard } from "./training/ProgressionCard";
import { Badge, Button, Card, EmptyState, LinkButton, Page, PageHeader, Sheet } from "./ui";
import { getDB } from "@/lib/db";
import { useExerciseMap, useProfile, useSession } from "@/lib/hooks";
import { evaluateDoubleProgression } from "@/lib/progression";
import { saveSession, softDelete } from "@/lib/repo";
import { sessionProgress, setExerciseField } from "@/lib/session";
import { formatDate, formatDuration, formatNumber, needsProfessionalNotice } from "@/lib/stats";

export function SessionDetail() {
  const id = useSearchParams().get("id");
  const router = useRouter();
  const toast = useToast();
  const session = useSession(id);
  const exMap = useExerciseMap();
  const profile = useProfile();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const discomforts = useLiveQuery(async () => (id ? (await getDB().discomforts.where("sessionId").equals(id).toArray()).filter((d) => !d.deletedAt) : []), [id]);

  if (session === undefined || !exMap) return <Page><PageHeader title="Sessão" back="/historico/" /></Page>;
  if (session === null || session.deletedAt) {
    return (
      <Page>
        <PageHeader title="Sessão" back="/historico/" />
        <EmptyState title="Sessão não encontrada" />
      </Page>
    );
  }

  const prog = sessionProgress(session);
  const statusLabel = session.status === "completed" ? "Concluída" : session.status === "interrupted" ? "Interrompida" : "Em andamento";

  return (
    <Page>
      <PageHeader
        title={session.templateName}
        subtitle={formatDate(session.startedAt, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
        back="/historico/"
      />
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={session.status === "completed" ? "ok" : session.status === "interrupted" ? "warn" : "accent"}>{statusLabel}</Badge>
          {session.endedAt && <Badge>{formatDuration(session.endedAt - session.startedAt)}</Badge>}
          <Badge>
            {prog.done}/{prog.total} séries
          </Badge>
        </div>
        {session.interruptionReason && <p className="text-sm text-muted">Motivo: {session.interruptionReason}</p>}
        {session.status === "in_progress" && (
          <LinkButton href={`/treino/?id=${session.id}`} block>
            Continuar treino
          </LinkButton>
        )}

        {discomforts && discomforts.length > 0 && (
          <Card className="space-y-2 border-warn">
            <p className="font-semibold">Desconfortos nesta sessão</p>
            {discomforts.map((d) => (
              <p key={d.id} className="text-sm">
                {d.region} ({d.intensity}/10) — {d.exerciseName}
              </p>
            ))}
            {discomforts.some(needsProfessionalNotice) && <HealthNotice emphasis />}
          </Card>
        )}

        {session.exercises.map((e, i) => {
          const done = e.sets.filter((s) => s.completedAt !== null);
          const unit = e.repUnit === "seconds" ? "s" : "";
          return (
            <Card key={e.slotId} className="space-y-3">
              <div>
                <p className="text-xs text-faint">{i + 1}</p>
                <p className="text-lg font-semibold">{e.exerciseName}</p>
                {e.substitution && (
                  <p className="text-sm text-info">
                    Substituiu {exMap.get(e.substitution.fromExerciseId)?.name ?? "o planejado"}
                    {e.substitution.reason ? ` — ${e.substitution.reason}` : ""}
                  </p>
                )}
                {e.skipped && <Badge tone="warn">Pulado</Badge>}
              </div>
              {done.length > 0 && (
                <ol className="space-y-1">
                  {done.map((s) => (
                    <li key={s.index} className="tabular flex gap-3 text-sm">
                      <span className="w-12 text-faint">Série {s.index + 1}</span>
                      <span className="font-medium">
                        {s.load !== null ? `${formatNumber(s.load)} ${profile.loadUnit}` : "Peso corporal"} × {s.reps}
                        {unit}
                      </span>
                      {s.rir !== null && <span className="text-muted">RIR {s.rir}</span>}
                    </li>
                  ))}
                </ol>
              )}
              {e.notes && <p className="text-sm text-muted">Obs.: {e.notes}</p>}
              {done.length > 0 && (
                <ProgressionCard
                  result={evaluateDoubleProgression(e)}
                  decision={e.loadDecision}
                  onDecide={(d) =>
                    saveSession(setExerciseField(session, i, "loadDecision", d)).catch((err: unknown) =>
                      toast(err instanceof Error ? err.message : "Falha ao salvar", "error"),
                    )
                  }
                />
              )}
            </Card>
          );
        })}

        <Button block variant="danger" onClick={() => setConfirmDelete(true)}>
          Excluir sessão
        </Button>
      </div>

      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Excluir sessão?">
        <p className="mb-4 text-muted">Os registros desta sessão deixam de aparecer no histórico e nos indicadores.</p>
        <Button
          block
          variant="danger"
          onClick={async () => {
            try {
              await softDelete("sessions", session.id);
              router.replace("/historico/");
            } catch (err) {
              toast(err instanceof Error ? err.message : "Falha ao excluir", "error");
            }
          }}
        >
          Excluir definitivamente
        </Button>
      </Sheet>
    </Page>
  );
}
