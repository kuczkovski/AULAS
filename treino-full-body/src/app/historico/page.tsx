"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ColumnChart, HBarChart, LineChart } from "@/components/charts";
import { HealthNotice } from "@/components/HealthNotice";
import { Badge, Card, EmptyState, Field, Page, PageHeader, Segmented, Select, StatTile } from "@/components/ui";
import { useDiscomforts, useExerciseMap, useProfile, useSessions } from "@/lib/hooks";
import { exerciseHistory } from "@/lib/progression";
import {
  averageDurationMs,
  daysAgo,
  discomfortSummary,
  finishedSessions,
  formatDate,
  formatDuration,
  formatNumber,
  needsProfessionalNotice,
  volumeByGroup,
  weeklyFrequency,
} from "@/lib/stats";
import { MUSCLE_LABELS } from "@/lib/types";

export default function HistoryPage() {
  const sessions = useSessions();
  const discomforts = useDiscomforts();
  const exMap = useExerciseMap();
  const profile = useProfile();
  const [range, setRange] = useState<"7" | "28">("7");
  const [metric, setMetric] = useState<"sets" | "tonnage">("sets");
  const [exId, setExId] = useState<string>("");

  const finished = useMemo(() => finishedSessions(sessions ?? []), [sessions]);
  const performed = useMemo(() => {
    const ids = new Map<string, string>();
    for (const s of finished) for (const e of s.exercises) if (e.sets.some((x) => x.completedAt)) ids.set(e.exerciseId, e.exerciseName);
    return [...ids.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [finished]);

  if (!sessions || !discomforts || !exMap) return <Page><PageHeader title="Histórico" /></Page>;

  const freq = weeklyFrequency(sessions, 8);
  const last4 = freq.slice(-4).reduce((a, b) => a + b.count, 0) / 4;
  const avg = averageDurationMs(sessions);
  const dSum = discomfortSummary(discomforts);
  const volume = volumeByGroup(sessions, daysAgo(Number(range)));
  const selected = exId || performed[0]?.[0] || "";
  const history = selected ? exerciseHistory(selected, finished) : [];
  const loadPoints = history.filter((h) => h.topLoad !== null).map((h) => ({ x: h.date, y: h.topLoad as number }));
  const repsPoints = history.map((h) => ({ x: h.date, y: h.totalReps }));
  const selectedUnit = exMap.get(selected)?.repUnit === "seconds" ? "s" : "reps";

  return (
    <Page>
      <PageHeader title="Histórico" subtitle="Sua evolução individual" />

      {finished.length === 0 ? (
        <EmptyState title="Nenhuma sessão concluída ainda">Os indicadores aparecem depois do primeiro treino registrado.</EmptyState>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Sessões" value={String(finished.length)} detail="realizadas" />
            <StatTile label="Frequência" value={`${formatNumber(last4, 1)}/sem`} detail="média das últimas 4 semanas (meta: 4)" />
            <StatTile label="Tempo médio" value={avg ? formatDuration(avg) : "—"} detail="por sessão" />
            <StatTile label="Desconfortos" value={String(dSum.last30)} detail="nos últimos 30 dias" />
          </div>

          <Card>
            <h2 className="font-semibold">Frequência semanal</h2>
            <p className="mb-4 text-xs text-muted">Sessões por semana, últimas 8 semanas</p>
            <ColumnChart
              label="Sessões por semana"
              items={freq.map((b) => ({
                key: String(b.weekStart),
                label: formatDate(b.weekStart, { day: "2-digit", month: "2-digit" }),
                title: `Semana de ${formatDate(b.weekStart, { day: "2-digit", month: "long" })}`,
                value: b.count,
              }))}
            />
          </Card>

          <Card className="space-y-4">
            <div>
              <h2 className="font-semibold">Volume por grupo muscular</h2>
              <p className="text-xs text-muted">Grupo principal de cada exercício</p>
            </div>
            <div className="grid gap-2 min-[400px]:grid-cols-2">
              <Segmented label="Período" value={range} onChange={setRange} options={[{ value: "7", label: "7 dias" }, { value: "28", label: "28 dias" }]} />
              <Segmented label="Métrica" value={metric} onChange={setMetric} options={[{ value: "sets", label: "Séries" }, { value: "tonnage", label: "Carga" }]} />
            </div>
            {volume.length === 0 ? (
              <p className="text-sm text-muted">Sem séries no período.</p>
            ) : (
              <HBarChart
                label="Volume por grupo muscular"
                unit={metric === "sets" ? "séries" : profile.loadUnit}
                items={volume.map((v) => ({
                  key: v.group,
                  label: MUSCLE_LABELS[v.group],
                  value: metric === "sets" ? v.sets : Math.round(v.tonnage),
                  detail: `${v.sets} séries · ${formatNumber(Math.round(v.tonnage))} ${profile.loadUnit} (carga × repetições)`,
                }))}
              />
            )}
          </Card>

          <Card className="space-y-4">
            <div>
              <h2 className="font-semibold">Evolução por exercício</h2>
              <p className="text-xs text-muted">Carga mais alta e repetições totais por sessão</p>
            </div>
            <Field label="Exercício" htmlFor="hist-ex">
              <Select id="hist-ex" value={selected} onChange={(e) => setExId(e.target.value)}>
                {performed.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </Select>
            </Field>
            {loadPoints.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">Carga mais alta ({profile.loadUnit})</p>
                <LineChart points={loadPoints} unit={profile.loadUnit} label="Evolução da carga" />
              </div>
            )}
            <div>
              <p className="mb-2 text-sm font-medium">{selectedUnit === "s" ? "Tempo total (s)" : "Repetições totais"}</p>
              <LineChart points={repsPoints} unit={selectedUnit} label="Evolução das repetições" />
            </div>
            {selected && (
              <Link href={`/programa/exercicio/?id=${selected}`} className="inline-block text-sm font-semibold text-accent">
                Abrir histórico completo do exercício
              </Link>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold">Sessões</h2>
            <ul className="divide-y divide-line">
              {[...finished].reverse().slice(0, 30).map((s) => (
                <li key={s.id}>
                  <Link href={`/historico/sessao/?id=${s.id}`} className="flex min-h-14 items-center gap-3 py-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-3 font-bold">{s.templateId}</span>
                    <span className="flex-1">
                      <span className="block font-medium">{s.templateName}</span>
                      <span className="block text-xs text-muted">
                        {formatDate(s.startedAt, { weekday: "short", day: "2-digit", month: "short" })}
                        {s.endedAt ? ` · ${formatDuration(s.endedAt - s.startedAt)}` : ""}
                      </span>
                    </span>
                    {s.status === "interrupted" && <Badge tone="warn">Interrompida</Badge>}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      <section className="mt-5 space-y-3">
        <h2 className="text-lg font-semibold">Registros de desconforto</h2>
        {dSum.warningCount > 0 && <HealthNotice emphasis />}
        {discomforts.length === 0 ? (
          <EmptyState title="Nenhum desconforto registrado" />
        ) : (
          <ul className="space-y-2">
            {discomforts.slice(0, 20).map((d) => (
              <li key={d.id} className="rounded-2xl border border-line bg-surface p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">
                    {d.region} <span className="tabular text-muted">· {d.intensity}/10</span>
                  </p>
                  <span className="text-xs text-muted">{formatDate(d.createdAt, { day: "2-digit", month: "short" })}</span>
                </div>
                <p className="text-sm text-muted">
                  {d.exerciseName ?? "Fora do treino"}
                  {d.action === "interrompeu_sessao" ? " · sessão interrompida" : d.action === "pulou_exercicio" ? " · exercício pulado" : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {d.characters.map((c) => (
                    <Badge key={c} tone={c === "pontual" ? "neutral" : "warn"}>
                      {c === "piora" ? "piorando" : c}
                    </Badge>
                  ))}
                  {needsProfessionalNotice(d) && <Badge tone="danger">Procure avaliação</Badge>}
                </div>
                {d.note && <p className="mt-2 text-sm">{d.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </Page>
  );
}
