"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const KEY = "treino:rest-timer";

interface TimerState {
  sessionId: string;
  endsAt: number;
  duration: number;
}

function read(): TimerState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TimerState) : null;
  } catch {
    return null;
  }
}

function write(s: TimerState | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {
    /* armazenamento indisponível: o cronômetro segue apenas em memória */
  }
}

function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.25, 0.5].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.25, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.18);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.2);
    });
    setTimeout(() => ctx.close().catch(() => undefined), 1200);
  } catch {
    /* sem áudio */
  }
}

/**
 * Cronômetro de descanso baseado em horário de término (sobrevive a
 * recarregamentos e à tela bloqueada).
 */
export function useRestTimer(sessionId: string, opts: { sound: boolean; vibrate: boolean }) {
  const [state, setState] = useState<TimerState | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const fired = useRef(false);

  useEffect(() => {
    const s = read();
    setState(s && s.sessionId === sessionId && s.endsAt > Date.now() - 60_000 ? s : null);
  }, [sessionId]);

  useEffect(() => {
    if (!state) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [state]);

  const remaining = state ? Math.ceil((state.endsAt - now) / 1000) : 0;

  useEffect(() => {
    if (!state) return;
    if (remaining <= 0 && !fired.current) {
      fired.current = true;
      if (opts.vibrate && "vibrate" in navigator) navigator.vibrate([200, 100, 200]);
      if (opts.sound) beep();
    }
  }, [remaining, state, opts.sound, opts.vibrate]);

  const start = useCallback(
    (seconds: number) => {
      fired.current = false;
      const s = { sessionId, endsAt: Date.now() + seconds * 1000, duration: seconds };
      write(s);
      setNow(Date.now());
      setState(s);
    },
    [sessionId],
  );

  const adjust = useCallback((delta: number) => {
    setState((s) => {
      if (!s) return s;
      const next = { ...s, endsAt: Math.max(Date.now(), s.endsAt + delta * 1000), duration: Math.max(0, s.duration + delta) };
      if (next.endsAt > Date.now()) fired.current = false;
      write(next);
      return next;
    });
  }, []);

  const stop = useCallback(() => {
    write(null);
    setState(null);
  }, []);

  return { active: state !== null, remaining, duration: state?.duration ?? 0, start, adjust, stop };
}

export function formatClock(sec: number): string {
  const s = Math.max(0, Math.abs(sec));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export function RestTimerPanel({ timer }: { timer: ReturnType<typeof useRestTimer> }) {
  if (!timer.active) return null;
  const done = timer.remaining <= 0;
  const ratio = timer.duration > 0 ? Math.max(0, Math.min(1, timer.remaining / timer.duration)) : 0;
  return (
    <section
      aria-label="Cronômetro de descanso"
      className={`flex items-center gap-3 rounded-2xl border px-3 py-2 ${done ? "border-ok bg-ok-soft" : "border-line bg-surface-2"}`}
    >
      <svg viewBox="0 0 36 36" className="h-11 w-11 shrink-0 -rotate-90" aria-hidden="true">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-surface-3)" strokeWidth="3.5" />
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          stroke={done ? "var(--color-ok)" : "var(--color-accent)"}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${ratio * 97.4} 97.4`}
        />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">{done ? "Descanso concluído" : "Descanso"}</p>
        <p className="tabular text-2xl font-bold leading-tight" aria-live={done ? "assertive" : "off"}>
          {done ? "Pronto" : formatClock(timer.remaining)}
        </p>
      </div>
      {!done && (
        <button type="button" onClick={() => timer.adjust(-15)} aria-label="Menos 15 segundos" className="min-h-12 w-14 rounded-xl bg-surface-3 text-sm font-semibold">
          −15
        </button>
      )}
      <button type="button" onClick={() => timer.adjust(15)} aria-label="Mais 15 segundos" className="min-h-12 w-14 rounded-xl bg-surface-3 text-sm font-semibold">
        +15
      </button>
      <button type="button" onClick={timer.stop} className="min-h-12 rounded-xl bg-surface-3 px-3 text-sm font-semibold">
        {done ? "Fechar" : "Pular"}
      </button>
    </section>
  );
}
