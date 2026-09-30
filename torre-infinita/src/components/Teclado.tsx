"use client";
import { useEffect } from "react";

const TECLAS = ["7", "8", "9", "⌫", "4", "5", "6", "/", "1", "2", "3", "−", "0", ",", "OK"];

/** Teclado numérico na tela, com suporte ao teclado físico. */
export function Teclado({ valor, onChange, onEnviar, desativado }: { valor: string; onChange: (v: string) => void; onEnviar: () => void; desativado?: boolean }) {
  useEffect(() => {
    if (desativado) return;
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) onChange((valor + e.key).slice(0, 10));
      else if (e.key === "-" || e.key === "−") onChange((valor + "−").slice(0, 10));
      else if (e.key === "," || e.key === ".") onChange((valor + ",").slice(0, 10));
      else if (e.key === "/") onChange((valor + "/").slice(0, 10));
      else if (e.key === "Backspace") onChange(valor.slice(0, -1));
      else if (e.key === "Enter") { e.preventDefault(); onEnviar(); }
      else return;
      if (e.key !== "Enter") e.preventDefault();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [valor, onChange, onEnviar, desativado]);

  const toca = (t: string) => {
    if (desativado) return;
    if (t === "⌫") onChange(valor.slice(0, -1));
    else if (t === "OK") onEnviar();
    else onChange((valor + t).slice(0, 10));
  };

  return (
    <div className="mx-auto w-full max-w-sm">
      <div aria-live="polite" className="mb-3 flex h-16 items-center justify-center rounded-2xl border-2 border-linha bg-marca-clara px-4 text-4xl font-black tracking-wide">
        {valor ? valor : <span className="text-2xl font-bold text-suave/60">sua resposta</span>}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {TECLAS.map((t) => (
          <button
            key={t}
            type="button"
            disabled={desativado}
            onClick={() => toca(t)}
            aria-label={t === "⌫" ? "Apagar" : t === "OK" ? "Responder" : t === "−" ? "Menos" : t === "," ? "Vírgula" : t === "/" ? "Barra de fração" : t}
            className={
              "btn h-14 text-2xl " +
              (t === "OK" ? "col-span-2 btn-marca" : "btn-suave")
            }
          >
            {t === "OK" ? "Responder" : t}
          </button>
        ))}
      </div>
    </div>
  );
}
