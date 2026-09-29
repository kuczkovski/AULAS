"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { WEEK_PLAN } from "@/data/catalog";
import { HealthNotice } from "@/components/HealthNotice";
import { IconCheck, IconPlay } from "@/components/icons";
import { useToast } from "@/components/Toast";
import { Badge, Button, Card, LinkButton, Page, PageHeader, ProgressBar, Sheet } from "@/components/ui";
import { useActiveSession, useExerciseMap, useProfile, useSessions, useTemplates } from "@/lib/hooks";
import { saveProfile, saveSession } from "@/lib/repo";
import { createSession, estimateMinutes, sessionProgress } from "@/lib/session";
import { finishedSessions, formatDate, startOfWeek } from "@/lib/stats";
import type { TemplateId, WorkoutTemplate } from "@/lib/types";

export default function TodayPage() {
  const router = useRouter();
  const toast = useToast();
  const profile = useProfile();
  const templates = useTemplates();
  const exMap = useExerciseMap();
  const sessions = useSessions();
  const active = useActiveSession();
  const [pickOpen, setPickOpen] = useState(false);
  const [starting, setStarting] = useState(false);

  const now = new Date();
  const todayPlan = WEEK_PLAN.find((d) => d.weekday === now.getDay());
  const todayTemplate = templates?.find((t) => t.id === todayPlan?.templateId) ?? null;

  const weekStart = startOfWeek(Date.now());
  const doneThisWeek = new Map<number, TemplateId>();
  for (const s of finishedSessions(sessions ?? [])) {
    if (s.startedAt >= weekStart) doneThisWeek.set(new Date(s.startedAt).getDay(), s.templateId);
  }
  const last = finishedSessions(sessions ?? []).at(-1);

  async function start(t: WorkoutTemplate) {
    if (!exMap || starting) return;
    if (active) {
      toast("Já existe uma sessão em andamento. Continue ou encerre-a primeiro.", "error");
      return;
    }
    setStarting(true);
    try {
      const s = await saveSession(createSession(t, exMap));
      router.push(`/treino/?id=${s.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao iniciar a sessão", "error");
      setStarting(false);
    }
  }

  const greeting = profile.displayName ? `Olá, ${profile.displayName}` : "Hoje";

  return (
    <Page>
      <PageHeader title={greeting} subtitle={new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(now)} />

      <div className="space-y-4">
        {!profile.acceptedNotice && (
          <div className="space-y-3">
            <HealthNotice emphasis />
            <Button block variant="secondary" onClick={() => saveProfile({ ...profile, acceptedNotice: true }).catch(() => undefined)}>
              Entendi
            </Button>
          </div>
        )}

        <WeekStrip today={now.getDay()} done={doneThisWeek} />

        {active ? (
          <Card className="border-accent">
            <div className="flex items-center justify-between gap-2">
              <Badge tone="accent">Em andamento</Badge>
              <span className="text-sm text-muted">desde {formatDate(active.startedAt, { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <h2 className="mt-3 text-xl font-bold">{active.templateName}</h2>
            <div className="mt-3">
              <ProgressBar value={sessionProgress(active).ratio} label="Progresso da sessão" />
              <p className="tabular mt-1 text-sm text-muted">
                {sessionProgress(active).done} de {sessionProgress(active).total} séries
              </p>
            </div>
            <LinkButton href={`/treino/?id=${active.id}`} block size="xl" className="mt-4">
              <IconPlay /> Continuar treino
            </LinkButton>
          </Card>
        ) : todayTemplate ? (
          <Card>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Treino do dia</p>
            <h2 className="mt-1 text-2xl font-bold">{todayTemplate.name}</h2>
            <p className="text-muted">Ênfase: {todayTemplate.focus}</p>
            <p className="mt-2 text-sm text-faint">
              {todayTemplate.items.length} exercícios · ~{estimateMinutes(todayTemplate)} min
            </p>
            <ol className="mt-4 space-y-2">
              {todayTemplate.items.map((i, idx) => (
                <li key={i.slotId} className="flex items-baseline gap-3 text-sm">
                  <span className="tabular w-5 text-faint">{idx + 1}</span>
                  <span className="flex-1">{exMap?.get(i.exerciseId)?.name ?? i.exerciseId}</span>
                  <span className="tabular text-muted">
                    {i.sets}×{i.repMin}–{i.repMax}
                    {exMap?.get(i.exerciseId)?.repUnit === "seconds" ? "s" : ""}
                  </span>
                </li>
              ))}
            </ol>
            <Button block size="xl" className="mt-5" onClick={() => start(todayTemplate)} disabled={!exMap || starting}>
              <IconPlay /> Iniciar treino
            </Button>
            <Button block variant="ghost" className="mt-2" onClick={() => setPickOpen(true)}>
              Fazer outro treino
            </Button>
          </Card>
        ) : (
          <Card>
            <p className="text-sm font-semibold uppercase tracking-wide text-info">Recuperação</p>
            <h2 className="mt-1 text-2xl font-bold">Dia de recuperação</h2>
            <p className="mt-2 text-muted">
              Descanso faz parte do programa. Se precisar repor um treino perdido, escolha a sessão abaixo.
            </p>
            <Button block variant="secondary" className="mt-4" onClick={() => setPickOpen(true)}>
              Escolher um treino
            </Button>
          </Card>
        )}

        {last && (
          <Card>
            <p className="text-sm text-muted">Última sessão</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="font-semibold">{last.templateName}</p>
              <span className="text-sm text-muted">{formatDate(last.startedAt, { weekday: "short", day: "2-digit", month: "short" })}</span>
            </div>
            <LinkButton href={`/historico/sessao/?id=${last.id}`} variant="ghost" size="md" className="-ml-4 mt-1">
              Ver detalhes
            </LinkButton>
          </Card>
        )}
      </div>

      <Sheet open={pickOpen} onClose={() => setPickOpen(false)} title="Escolher treino">
        <div className="space-y-3">
          {templates?.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setPickOpen(false);
                void start(t);
              }}
              className="flex w-full items-center gap-4 rounded-2xl border border-line bg-surface-2 p-4 text-left hover:border-accent"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-3 text-xl font-bold">{t.id}</span>
              <span className="flex-1">
                <span className="block font-semibold">{t.name}</span>
                <span className="block text-sm text-muted">{t.focus}</span>
              </span>
            </button>
          ))}
        </div>
      </Sheet>
    </Page>
  );
}

function WeekStrip({ today, done }: { today: number; done: Map<number, TemplateId> }) {
  return (
    <ol className="grid grid-cols-7 gap-1.5" aria-label="Semana">
      {WEEK_PLAN.map((d) => {
        const isToday = d.weekday === today;
        const completed = done.get(d.weekday);
        return (
          <li
            key={d.weekday}
            aria-current={isToday ? "date" : undefined}
            className={`flex flex-col items-center gap-1 rounded-xl border py-2 ${isToday ? "border-accent bg-accent-soft" : "border-line bg-surface"}`}
          >
            <span className="text-[11px] font-medium text-muted">{d.label.slice(0, 3)}</span>
            {completed ? (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ok text-bg" aria-label={`Treino ${completed} concluído`}>
                <IconCheck size={16} />
              </span>
            ) : (
              <span className={`flex h-7 items-center text-sm font-bold ${d.templateId ? "text-ink" : "text-faint"}`}>
                {d.templateId ?? "—"}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
