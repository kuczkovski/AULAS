"use client";
import { useRef, useState } from "react";

interface Ponto { texto: string; x: number; y: number }

/**
 * Arrastar com o ponteiro (mouse ou toque). Um toque curto, sem mover, chama
 * `onToque`; soltar sobre um elemento com `data-alvo` chama `onSoltar`.
 *
 * - Só o ponteiro que iniciou o gesto conta; um segundo dedo é ignorado.
 * - Gesto cancelado pelo sistema (`pointercancel`) não vira toque.
 * - Cliques que não vieram de um ponteiro (teclado, leitor de tela, comando de
 *   voz, chave de acesso) também ativam o item, então nada exige arrastar.
 */
export function useArrastar<T>({ onSoltar, onToque }: { onSoltar: (item: T, alvo: string | null) => void; onToque: (item: T) => void }) {
  const [fantasma, setFantasma] = useState<Ponto | null>(null);
  const cb = useRef({ onSoltar, onToque });
  cb.current = { onSoltar, onToque };
  const ativo = useRef<number | null>(null);
  const ultimoGesto = useRef(0);

  function iniciar(e: React.PointerEvent, item: T, texto: string) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (ativo.current !== null) return;
    const id = e.pointerId, x0 = e.clientX, y0 = e.clientY;
    ativo.current = id;
    let mexeu = false;
    const encerrar = () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", cancelar);
      ativo.current = null;
      ultimoGesto.current = Date.now();
      setFantasma(null);
    };
    const mover = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      if (!mexeu && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 8) return;
      mexeu = true;
      setFantasma({ texto, x: ev.clientX, y: ev.clientY });
    };
    const soltar = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      encerrar();
      if (!mexeu) { cb.current.onToque(item); return; }
      const alvo = document.elementFromPoint(ev.clientX, ev.clientY)?.closest<HTMLElement>("[data-alvo]");
      cb.current.onSoltar(item, alvo?.dataset.alvo ?? null);
    };
    const cancelar = (ev: PointerEvent) => { if (ev.pointerId === id) encerrar(); };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", cancelar);
  }

  /**
   * Cliques logo depois de um gesto de ponteiro já foram tratados por ele.
   * Qualquer outro clique (teclado, leitor de tela...) ativa o item.
   */
  const teclado = (_e: React.MouseEvent, item: T) => {
    if (Date.now() - ultimoGesto.current < 600) return;
    cb.current.onToque(item);
  };
  return { fantasma, iniciar, teclado };
}

/** A cópia que acompanha o dedo ou o mouse durante o arrasto. */
export function Fantasma({ ponto }: { ponto: Ponto | null }) {
  if (!ponto) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-marca bg-white px-4 py-3 text-2xl font-black shadow-xl" style={{ left: ponto.x, top: ponto.y }}>
      {ponto.texto}
    </div>
  );
}
