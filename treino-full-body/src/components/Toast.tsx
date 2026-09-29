"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Kind = "ok" | "error" | "info";
interface ToastItem {
  id: number;
  kind: Kind;
  text: string;
}

const Ctx = createContext<(text: string, kind?: Kind) => void>(() => undefined);

export function useToast() {
  return useContext(Ctx);
}

let seq = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((text: string, kind: Kind = "info") => {
    const id = ++seq;
    setItems((l) => [...l.slice(-2), { id, kind, text }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), kind === "error" ? 6000 : 3000);
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex flex-col items-center gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={`pointer-events-auto w-full max-w-md rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
              t.kind === "error"
                ? "border-danger bg-danger-soft text-ink"
                : t.kind === "ok"
                  ? "border-ok bg-ok-soft text-ink"
                  : "border-line bg-surface-2 text-ink"
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
