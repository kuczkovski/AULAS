"use client";
import { useEffect, useState } from "react";

interface EventoInstalar extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let adiado: EventoInstalar | null = null;
const ouvintes = new Set<() => void>();

/** Registra o service worker (só em produção) e guarda o evento de instalação do navegador. */
export function PwaRegistro() {
  useEffect(() => {
    const capturar = (e: Event) => { e.preventDefault(); adiado = e as EventoInstalar; ouvintes.forEach((f) => f()); };
    const instalado = () => { adiado = null; ouvintes.forEach((f) => f()); };
    window.addEventListener("beforeinstallprompt", capturar);
    window.addEventListener("appinstalled", instalado);

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      const registrar = async () => {
        try {
          await navigator.serviceWorker.register("/sw.js", { scope: "/" });
          const reg = await navigator.serviceWorker.ready;
          const urls = [location.pathname, ...performance.getEntriesByType("resource").map((r) => r.name)];
          reg.active?.postMessage({ tipo: "guardar", urls });
        } catch {
          /* sem service worker o app funciona igual, só não abre offline */
        }
      };
      if (document.readyState === "complete") void registrar();
      else window.addEventListener("load", registrar, { once: true });
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", capturar);
      window.removeEventListener("appinstalled", instalado);
    };
  }, []);
  return null;
}

/** Estado da instalação: botão nativo (Android/Chrome) ou instrução (iPhone/iPad). */
export function useInstalar() {
  const [, atualizar] = useState(0);
  useEffect(() => {
    const f = () => atualizar((x) => x + 1);
    ouvintes.add(f);
    return () => { ouvintes.delete(f); };
  }, []);
  const standalone = typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true);
  const ios = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone;
  return {
    instalado: standalone,
    podeInstalar: adiado !== null,
    ios,
    async instalar() {
      if (!adiado) return;
      await adiado.prompt();
      await adiado.userChoice;
      adiado = null;
      ouvintes.forEach((f) => f());
    },
  };
}

/** Faixa que aparece quando a internet cai. */
export function AvisoConexao() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const atualizar = () => setOffline(!navigator.onLine);
    atualizar();
    window.addEventListener("online", atualizar);
    window.addEventListener("offline", atualizar);
    return () => { window.removeEventListener("online", atualizar); window.removeEventListener("offline", atualizar); };
  }, []);
  if (!offline) return null;
  return (
    <p role="status" className="fixed inset-x-0 bottom-0 z-40 bg-tinta px-4 py-2 text-center text-sm font-bold text-white">
      Sem internet. Pode continuar jogando: o progresso é enviado quando a conexão voltar.
    </p>
  );
}
