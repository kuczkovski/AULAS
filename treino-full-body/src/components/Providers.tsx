"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { withBase } from "@/lib/base-path";
import { ensureSeeded, onLocalWrite } from "@/lib/repo";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { refreshPending, setSyncStatus, syncNow } from "@/lib/sync";
import { ToastProvider } from "./Toast";
import { Button } from "./ui";

interface AppCtx {
  user: User | null;
  authReady: boolean;
  syncConfigured: boolean;
  requestSync: () => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function useApp(): AppCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp fora do Providers");
  return v;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [fatal, setFatal] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!supabaseConfigured);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const updateRequested = useRef(false);
  const userRef = useRef<User | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSync = useCallback(() => {
    void syncNow(getSupabase(), userRef.current?.id ?? null);
  }, []);

  const requestSync = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(runSync, 1500);
  }, [runSync]);

  // Banco local + catálogo inicial.
  useEffect(() => {
    ensureSeeded()
      .then(() => setReady(true))
      .catch((err: unknown) => setFatal(err instanceof Error ? err.message : String(err)));
  }, []);

  // Service worker (somente no build de produção). Uma nova versão fica
  // aguardando até o usuário aceitar a atualização.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let reloading = false;
    // Só recarrega quando a troca de versão foi pedida pelo usuário
    // (a primeira instalação também dispara "controllerchange").
    const onController = () => {
      if (updateRequested.current && !reloading) {
        reloading = true;
        location.reload();
      }
    };
    navigator.serviceWorker.addEventListener("controllerchange", onController);
    navigator.serviceWorker
      .register(withBase("/sw.js"))
      .then((reg) => {
        const check = () => {
          if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
        };
        check();
        reg.addEventListener("updatefound", () => {
          reg.installing?.addEventListener("statechange", check);
        });
      })
      .catch((err) => console.warn("Service worker não registrado", err));
    return () => navigator.serviceWorker.removeEventListener("controllerchange", onController);
  }, []);

  // Autenticação e gatilhos de sincronização.
  useEffect(() => {
    if (!ready) return;
    const client = getSupabase();
    if (!client) {
      setSyncStatus({ state: "disabled" });
      void refreshPending();
      return;
    }
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      userRef.current = session?.user ?? null;
      setUser(session?.user ?? null);
      setAuthReady(true);
      requestSync();
    });
    const offWrite = onLocalWrite(requestSync);
    const onOnline = () => runSync();
    const onOffline = () => setSyncStatus({ state: "offline" });
    const onVisible = () => {
      if (document.visibilityState === "visible") requestSync();
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisible);
    const interval = setInterval(runSync, 5 * 60_000);
    return () => {
      sub.subscription.unsubscribe();
      offWrite();
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, [ready, requestSync, runSync]);

  const value = useMemo(
    () => ({ user, authReady, syncConfigured: supabaseConfigured, requestSync: runSync }),
    [user, authReady, runSync],
  );

  if (fatal) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
        <h1 className="text-2xl font-bold">Não foi possível abrir os dados</h1>
        <p className="text-muted">{fatal}</p>
        <p className="text-muted">
          O aplicativo usa o armazenamento do navegador (IndexedDB). Verifique se ele não está bloqueado, por exemplo em
          janelas anônimas ou por configurações de privacidade.
        </p>
        <Button onClick={() => location.reload()}>Tentar novamente</Button>
      </main>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted" role="status">
        Carregando…
      </div>
    );
  }

  return (
    <Ctx.Provider value={value}>
      <ToastProvider>
        {children}
        {waiting && <UpdateBanner
            onUpdate={() => {
              updateRequested.current = true;
              waiting.postMessage("SKIP_WAITING");
            }}
          />}
      </ToastProvider>
    </Ctx.Provider>
  );
}

function UpdateBanner({ onUpdate }: { onUpdate: () => void }) {
  const pathname = usePathname() ?? "";
  // Não interrompe um treino em andamento.
  if (pathname.startsWith("/treino")) return null;
  return (
    <div className="fixed inset-x-0 bottom-[calc(var(--nav-h)+env(safe-area-inset-bottom)+0.5rem)] z-50 px-4">
      <div className="mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-accent bg-surface-2 p-3 shadow-lg">
        <p className="flex-1 text-sm">Nova versão disponível.</p>
        <Button size="md" onClick={onUpdate}>
          Atualizar
        </Button>
      </div>
    </div>
  );
}
