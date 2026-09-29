"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ExerciseDemo } from "../ExerciseDemo";
import { IconAlert, IconCheck, IconEdit, IconLeft, IconRight, IconSwap } from "../icons";
import { RestTimerPanel, formatClock, useRestTimer } from "../RestTimer";
import { useToast } from "../Toast";
import { Badge, Button, LinkButton, ProgressBar, Sheet, TextArea, buttonClass } from "../ui";
import { DiscomfortSheet, type DiscomfortInput } from "./DiscomfortSheet";
import { EndSessionSheet } from "./EndSessionSheet";
import { ProgressionCard } from "./ProgressionCard";
import { SetEditor } from "./SetEditor";
import { SubstituteSheet } from "./SubstituteSheet";
import { useExerciseMap, useProfile, useSession, useSessions } from "@/lib/hooks";
import { LOAD_DECISION_LABELS, evaluateDoubleProgression, lastPerformance } from "@/lib/progression";
import { saveDiscomfort, saveSession, softDelete } from "@/lib/repo";
import {
  addSet,
  completeSet,
  finishSession,
  goTo,
  isExerciseDone,
  removeLastSet,
  reopenSet,
  sessionProgress,
  setExerciseField,
  substituteExercise,
} from "@/lib/session";
import { formatDate, formatNumber } from "@/lib/stats";
import { MUSCLE_LABELS, type WorkoutSession } from "@/lib/types";
import { newId } from "@/lib/id";
import type { SetInput } from "@/lib/validation";

const EMPTY: SetInput = { load: "", reps: "", rir: "" };
const draftKey = (id: string) => `treino:draft:${id}`;

function readDrafts(id: string): Record<string, SetInput> {
  try {
    return JSON.parse(localStorage.getItem(draftKey(id)) ?? "{}") as Record<string, SetInput>;
  } catch {
    return {};
  }
}

function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const request = () => {
      navigator.wakeLock
        .request("screen")
        .then((l) => (lock = l))
        .catch(() => undefined);
    };
    request();
    const onVis = () => document.visibilityState === "visible" && request();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      lock?.release().catch(() => undefined);
    };
  }, [enabled]);
}

export function TrainingScreen() {
  const params = useSearchParams();
  const id = params.get("id");
  const router = useRouter();
  const toast = useToast();
  const live = useSession(id);
  const exMap = useExerciseMap();
  const allSessions = useSessions();
  const profile = useProfile();

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const sessionRef = useRef<WorkoutSession | null>(null);
  const pending = useRef(0);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  const [drafts, setDrafts] = useState<Record<string, SetInput>>({});
  const [sheet, setSheet] = useState<null | "sub" | "pain" | "end" | "list">(null);
  const [showDemo, setShowDemo] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const timer = useRestTimer(id ?? "none", { sound: profile.soundOnRestEnd, vibrate: profile.vibrateOnRestEnd });
  useWakeLock(session?.status === "in_progress");

  // Sincroniza o estado local com o IndexedDB quando não há gravações pendentes.
  useEffect(() => {
    if (!live || pending.current > 0) return;
    if (!sessionRef.current || live.updatedAt >= sessionRef.current.updatedAt || live.id !== sessionRef.current.id) {
      sessionRef.current = live;
      setSession(live);
    }
  }, [live]);

  useEffect(() => {
    if (id) setDrafts(readDrafts(id));
  }, [id]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const commit = useCallback(
    (fn: (s: WorkoutSession) => WorkoutSession): WorkoutSession | null => {
      const cur = sessionRef.current;
      if (!cur) return null;
      let next: WorkoutSession;
      try {
        next = fn(cur);
      } catch (err) {
        toast(err instanceof Error ? err.message : "Operação inválida", "error");
        return null;
      }
      sessionRef.current = next;
      setSession(next);
      pending.current++;
      queue.current = queue.current
        .then(() => saveSession(next))
        .catch((err: unknown) => toast(err instanceof Error ? err.message : "Falha ao salvar", "error"))
        .finally(() => {
          pending.current--;
        });
      return next;
    },
    [toast],
  );

  const updateDraft = useCallback(
    (key: string, value: SetInput | null) => {
      if (!id) return;
      setDrafts((d) => {
        const next = { ...d };
        if (value) next[key] = value;
        else delete next[key];
        try {
          localStorage.setItem(draftKey(id), JSON.stringify(next));
        } catch {
          /* sem armazenamento: o rascunho fica só em memória */
        }
        return next;
      });
    },
    [id],
  );

  if (!id) return <Missing text="Nenhuma sessão informada." />;
  if (live === null) return <Missing text="Sessão não encontrada neste aparelho." />;
  if (!session || !exMap || !allSessions) return <div className="p-6 text-muted">Carregando sessão…</div>;
  if (session.deletedAt) return <Missing text="Esta sessão foi descartada." />;
  if (session.status !== "in_progress") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
        <h1 className="text-2xl font-bold">Sessão encerrada</h1>
        <LinkButton href={`/historico/sessao/?id=${session.id}`}>Ver resumo</LinkButton>
        <LinkButton href="/" variant="secondary">
          Voltar para Hoje
        </LinkButton>
      </main>
    );
  }

  const idx = Math.min(session.currentIndex, session.exercises.length - 1);
  const entry = session.exercises[idx]!;
  const exercise = exMap.get(entry.exerciseId);
  const last = lastPerformance(entry.exerciseId, allSessions, session.id);
  const activeSet = entry.sets.find((s) => s.completedAt === null) ?? null;
  const progress = sessionProgress(session);
  const unitLabel = entry.repUnit === "seconds" ? "s" : "";
  const exerciseDone = isExerciseDone(entry);
  const isLast = idx === session.exercises.length - 1;
  const allDone = session.exercises.every(isExerciseDone);

  function handleComplete(setIndex: number, v: { load: number | null; reps: number; rir: number | null }) {
    const next = commit((s) => completeSet(s, idx, setIndex, v));
    if (!next) return;
    updateDraft(`${entry.slotId}:${setIndex}`, null);
    timer.start(entry.restSeconds);
    if (next.exercises.every(isExerciseDone)) setSheet("end");
  }

  function handleReopen(setIndex: number) {
    const s = entry.sets[setIndex];
    if (!s) return;
    updateDraft(`${entry.slotId}:${setIndex}`, {
      load: s.load === null ? "" : String(s.load).replace(".", ","),
      reps: s.reps === null ? "" : String(s.reps),
      rir: s.rir === null ? "" : String(s.rir),
    });
    commit((x) => reopenSet(x, idx, setIndex));
  }

  function finish(status: "completed" | "interrupted", reason: string | null) {
    const next = commit((s) => finishSession(s, status, reason));
    if (!next) return;
    timer.stop();
    try {
      localStorage.removeItem(draftKey(next.id));
    } catch {
      /* ignorado */
    }
    void queue.current.then(() => router.replace(`/historico/sessao/?id=${next.id}`));
  }

  async function discard() {
    timer.stop();
    try {
      await queue.current;
      await softDelete("sessions", session!.id);
      router.replace("/");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Falha ao descartar", "error");
    }
  }

  async function saveDiscomfortLog(v: DiscomfortInput) {
    try {
      const t = Date.now();
      await saveDiscomfort({
        id: newId(),
        sessionId: session!.id,
        exerciseId: entry.exerciseId,
        exerciseName: entry.exerciseName,
        region: v.region,
        intensity: v.intensity,
        characters: v.characters,
        action: v.action,
        note: v.note,
        createdAt: t,
        updatedAt: t,
        deletedAt: null,
      });
      toast("Desconforto registrado", "ok");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Falha ao registrar", "error");
      throw err;
    }
    if (v.action === "pulou_exercicio") {
      timer.stop();
      commit((s) => goTo(setExerciseField(s, idx, "skipped", true), idx + 1));
    } else if (v.action === "interrompeu_sessao") {
      finish("interrupted", `Desconforto: ${v.region}`);
    }
  }

  const lastSummary = last
    ? last.entry.sets
        .filter((s) => s.completedAt !== null)
        .map((s) => `${s.load !== null ? formatNumber(s.load) : "PC"}×${s.reps}${unitLabel}`)
        .join("  ")
    : null;

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      {/* Cabeçalho com progresso da sessão */}
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="flex items-center gap-2">
          <Link href="/" className={buttonClass("ghost", "md", "-ml-3 !px-2")} aria-label="Sair (a sessão continua salva)">
            <IconLeft />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{session.templateName}</p>
            <p className="tabular text-xs text-muted">{formatClock(Math.floor((now - session.startedAt) / 1000))} de treino</p>
          </div>
          <Button variant="danger" size="md" onClick={() => setSheet("end")}>
            Encerrar
          </Button>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar value={progress.ratio} label="Progresso da sessão" />
          <span className="tabular shrink-0 text-xs text-muted">
            {progress.done}/{progress.total}
          </span>
        </div>
      </header>

      <main className={`flex-1 space-y-4 px-4 pt-4 ${timer.active ? "pb-52" : "pb-32"}`}>
        <button
          type="button"
          onClick={() => setSheet("list")}
          className="flex w-full items-center justify-between rounded-xl bg-surface px-3 py-2 text-sm text-muted"
        >
          <span>
            Exercício <strong className="text-ink">{idx + 1}</strong> de {session.exercises.length}
          </span>
          <span className="text-accent">ver lista</span>
        </button>

        <section aria-labelledby="ex-title" className="space-y-3">
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge>{MUSCLE_LABELS[entry.muscleGroup]}</Badge>
              {entry.substitution && <Badge tone="info">Substituído</Badge>}
              {entry.skipped && <Badge tone="warn">Pulado</Badge>}
            </div>
            <h1 id="ex-title" className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
              {entry.exerciseName}
            </h1>
            <p className="tabular mt-1 text-muted">
              {entry.sets.length} séries · {entry.repMin}–{entry.repMax} {entry.repUnit === "seconds" ? "s" : "reps"} · descanso{" "}
              {formatClock(entry.restSeconds)}
              {entry.targetRir !== null ? ` · RIR ${entry.targetRir}` : ""}
            </p>
            {entry.substitution && (
              <p className="mt-1 text-sm text-faint">
                No lugar de {exMap.get(entry.substitution.fromExerciseId)?.name ?? "exercício planejado"}
                {entry.substitution.reason ? ` — ${entry.substitution.reason}` : ""}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-line bg-surface p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-faint">Última sessão</p>
            {last ? (
              <>
                <p className="tabular mt-1 font-semibold">
                  {lastSummary} {last.topLoad !== null ? profile.loadUnit : ""}
                </p>
                <p className="text-xs text-muted">
                  {formatDate(last.date, { day: "2-digit", month: "short" })} · {last.evaluation.title}
                  {last.entry.loadDecision ? ` · decisão: ${LOAD_DECISION_LABELS[last.entry.loadDecision].toLowerCase()}` : ""}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-muted">Primeiro registro deste exercício. Escolha uma carga que permita boa técnica.</p>
            )}
          </div>

          {exercise && (
            <div>
              <button type="button" onClick={() => setShowDemo((v) => !v)} aria-expanded={showDemo} className="text-sm font-semibold text-accent">
                {showDemo ? "Ocultar demonstração" : "Ver demonstração e execução"}
              </button>
              {showDemo && (
                <div className="mt-3 rounded-2xl border border-line bg-surface p-4">
                  <ExerciseDemo exercise={exercise} />
                </div>
              )}
            </div>
          )}
        </section>

        {/* Séries */}
        <section aria-label="Séries" className="space-y-2">
          {entry.skipped ? (
            <div className="rounded-2xl border border-warn bg-warn-soft p-4">
              <p className="font-semibold">Exercício pulado</p>
              <Button variant="secondary" size="md" className="mt-3" onClick={() => commit((s) => setExerciseField(s, idx, "skipped", false))}>
                Retomar exercício
              </Button>
            </div>
          ) : (
            entry.sets.map((s) => {
              if (s.completedAt !== null) {
                return (
                  <div key={s.index} className="flex min-h-14 items-center gap-3 rounded-xl bg-surface px-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ok text-bg" aria-hidden="true">
                      <IconCheck size={16} />
                    </span>
                    <span className="tabular flex-1 font-semibold">
                      {s.load !== null ? `${formatNumber(s.load)} ${profile.loadUnit}` : "Peso corporal"} × {s.reps}
                      {unitLabel}
                      {s.rir !== null && <span className="ml-2 text-sm font-normal text-muted">RIR {s.rir}</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleReopen(s.index)}
                      aria-label={`Editar série ${s.index + 1}`}
                      className={buttonClass("ghost", "md", "!px-3")}
                    >
                      <IconEdit size={18} />
                    </button>
                  </div>
                );
              }
              if (activeSet && s.index === activeSet.index) {
                const key = `${entry.slotId}:${s.index}`;
                const prev = entry.sets.filter((x) => x.completedAt !== null && x.index < s.index).at(-1);
                const lastSame = last?.entry.sets[s.index];
                return (
                  <SetEditor
                    key={`${entry.exerciseId}-${s.index}`}
                    setNumber={s.index + 1}
                    totalSets={entry.sets.length}
                    repMin={entry.repMin}
                    repMax={entry.repMax}
                    targetRir={entry.targetRir}
                    repUnit={entry.repUnit}
                    loadUnit={profile.loadUnit}
                    loadStep={profile.loadStep}
                    draft={drafts[key] ?? EMPTY}
                    onDraft={(d) => updateDraft(key, d)}
                    lastLoad={lastSame?.completedAt ? lastSame.load : (last?.topLoad ?? null)}
                    prevLoad={prev?.load ?? null}
                    onComplete={(v) => handleComplete(s.index, v)}
                  />
                );
              }
              return (
                <div key={s.index} className="flex min-h-12 items-center gap-3 rounded-xl border border-dashed border-line px-3 text-muted">
                  <span className="tabular w-8 text-center">{s.index + 1}</span>
                  <span className="text-sm">Série planejada</span>
                </div>
              );
            })
          )}

          {!entry.skipped && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="ghost" size="md" onClick={() => commit((s) => addSet(s, idx))}>
                + Série
              </Button>
              {entry.sets.length > 1 && entry.sets.at(-1)?.completedAt === null && (
                <Button variant="ghost" size="md" onClick={() => commit((s) => removeLastSet(s, idx))}>
                  − Série
                </Button>
              )}
              <Button variant="ghost" size="md" onClick={() => setShowNotes((v) => !v)} aria-expanded={showNotes}>
                Observações{entry.notes ? " •" : ""}
              </Button>
            </div>
          )}
          {showNotes && (
            <TextArea
              aria-label="Observações de execução"
              value={entry.notes}
              maxLength={500}
              placeholder="Ex.: pegada mais fechada, banco no furo 3"
              onChange={(e) => commit((s) => setExerciseField(s, idx, "notes", e.target.value))}
            />
          )}
        </section>

        {exerciseDone && !entry.skipped && (
          <ProgressionCard
            result={evaluateDoubleProgression(entry)}
            decision={entry.loadDecision}
            onDecide={(d) => commit((s) => setExerciseField(s, idx, "loadDecision", d))}
          />
        )}

        {exerciseDone && (
          <Button block size="xl" variant={isLast || allDone ? "primary" : "secondary"} onClick={() => (isLast || allDone ? setSheet("end") : commit((s) => goTo(s, idx + 1)))}>
            {isLast || allDone ? "Encerrar sessão" : "Próximo exercício"}
            {!(isLast || allDone) && <IconRight />}
          </Button>
        )}
      </main>

      {/* Barra inferior: descanso + ações */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto max-w-xl space-y-2 px-4 pb-2 pt-2">
          <RestTimerPanel timer={timer} />
          <nav aria-label="Ações do treino" className="grid grid-cols-4 gap-2">
            <button type="button" onClick={() => commit((s) => goTo(s, idx - 1))} disabled={idx === 0} className={actionBtn}>
              <IconLeft />
              Anterior
            </button>
            <button type="button" onClick={() => setSheet("sub")} className={actionBtn}>
              <IconSwap />
              Substituir
            </button>
            <button type="button" onClick={() => setSheet("pain")} className={`${actionBtn} text-warn`}>
              <IconAlert />
              Desconforto
            </button>
            <button type="button" onClick={() => commit((s) => goTo(s, idx + 1))} disabled={isLast} className={actionBtn}>
              <IconRight />
              Próximo
            </button>
          </nav>
        </div>
      </div>

      <SubstituteSheet
        open={sheet === "sub"}
        onClose={() => setSheet(null)}
        entry={entry}
        exMap={exMap}
        onConfirm={(alt, reason) => {
          const next = commit((s) => substituteExercise(s, idx, alt, reason));
          if (next) {
            entry.sets.forEach((s) => updateDraft(`${entry.slotId}:${s.index}`, null));
            toast(`Substituído por ${alt.name}`, "ok");
          }
        }}
      />
      <DiscomfortSheet open={sheet === "pain"} onClose={() => setSheet(null)} exerciseName={entry.exerciseName} onSave={saveDiscomfortLog} />
      <EndSessionSheet
        open={sheet === "end"}
        onClose={() => setSheet(null)}
        done={progress.done}
        total={progress.total}
        onFinish={finish}
        onDiscard={discard}
      />
      <Sheet open={sheet === "list"} onClose={() => setSheet(null)} title="Exercícios da sessão">
        <ol className="space-y-2">
          {session.exercises.map((e, i) => {
            const done = e.sets.filter((s) => s.completedAt !== null).length;
            return (
              <li key={e.slotId}>
                <button
                  type="button"
                  onClick={() => {
                    commit((s) => goTo(s, i));
                    setSheet(null);
                  }}
                  className={`flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 text-left ${i === idx ? "border-accent bg-accent-soft" : "border-line bg-surface-2"}`}
                >
                  <span className="tabular w-6 text-faint">{i + 1}</span>
                  <span className="flex-1">
                    <span className="block font-medium">{e.exerciseName}</span>
                    <span className="block text-xs text-muted">
                      {e.skipped ? "Pulado" : `${done}/${e.sets.length} séries`}
                      {e.substitution ? " · substituído" : ""}
                    </span>
                  </span>
                  {isExerciseDone(e) && !e.skipped && <IconCheck className="text-ok" />}
                </button>
              </li>
            );
          })}
        </ol>
      </Sheet>
    </div>
  );
}

const actionBtn =
  "flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl bg-surface-2 text-xs font-semibold text-ink active:bg-surface-3 disabled:opacity-30";

function Missing({ text }: { text: string }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">{text}</h1>
      <LinkButton href="/">Voltar para Hoje</LinkButton>
    </main>
  );
}
