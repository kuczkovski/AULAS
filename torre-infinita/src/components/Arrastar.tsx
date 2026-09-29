"use client";
import { useRef, useState } from "react";

interface Ponto { texto: string; x: number; y: number }

/**
 * Arrastar com o ponteiro (mouse ou toque). Um toque curto, sem mover, chama
 * `onToque`; soltar sobre um elemento com `data-alvo` chama `onSoltar`.
 * O teclado usa o clique (`evento.detail === 0`), então nada exige arrastar.
 */
export function useArrastar<T>({ onSoltar, onToque }: { onSoltar: (item: T, alvo: string | null) => void; onToque: (item: T) => void }) {
  const [fantasma, setFantasma] = useState<Ponto | null>(null);
  const cb = useRef({ onSoltar, onToque });
  cb.current = { onSoltar, onToque };

  function iniciar(e: React.PointerEvent, item: T, texto: string) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const x0 = e.clientX, y0 = e.clientY;
    let mexeu = false;
    const mover = (ev: PointerEvent) => {
      if (!mexeu && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 8) return;
      mexeu = true;
      setFantasma({ texto, x: ev.clientX, y: ev.clientY });
    };
    const soltar = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", soltar);
      setFantasma(null);
      if (!mexeu) { cb.current.onToque(item); return; }
      const alvo = document.elementFromPoint(ev.clientX, ev.clientY)?.closest<HTMLElement>("[data-alvo]");
      cb.current.onSoltar(item, alvo?.dataset.alvo ?? null);
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", soltar);
  }

  /** Clique gerado pelo teclado (Enter ou espaço); cliques de mouse e toque vêm do arrasto. */
  const teclado = (e: React.MouseEvent, item: T) => { if (e.detail === 0) cb.current.onToque(item); };
  return { fantasma, iniciar, teclado };
}

/** A cópia que acompanha o dedo ou o mouse durante o arrasto. */
export function Fantasma({ ponto }: { ponto: { texto: string; x: number; y: number } | null }) {
  if (!ponto) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-marca bg-white px-4 py-3 text-2xl font-black shadow-xl" style={{ left: ponto.x, top: ponto.y }}>
      {ponto.texto}
    </div>
  );
}
