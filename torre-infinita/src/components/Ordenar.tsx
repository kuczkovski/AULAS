"use client";
import { useState } from "react";
import { sinal } from "@/lib/formato";
import { Fantasma, useArrastar } from "./Arrastar";

/** Colocar os itens em ordem (do menor para o maior): arrastando ou tocando. */
export function Ordenar({
  itens,
  resposta,
  escolhida,
  onConfirmar,
}: {
  itens: string[];
  /** Ordem correta, itens separados por "|". */
  resposta: string;
  /** Ordem que o aluno enviou; definida quando a pergunta já foi respondida. */
  escolhida?: string;
  onConfirmar: (ordem: string) => void;
}) {
  const [ordem, setOrdem] = useState<string[]>([]);
  const travada = escolhida !== undefined;
  const mostrada = travada ? escolhida.split("|") : ordem;
  const certa = resposta.split("|");
  const restantes = itens.filter((i) => !ordem.includes(i));

  const { fantasma, iniciar, teclado } = useArrastar<string>({
    onToque: (item) => setOrdem((o) => (o.includes(item) ? o.filter((x) => x !== item) : [...o, item])),
    onSoltar: (item, alvo) => {
      if (alvo === "pool") setOrdem((o) => o.filter((x) => x !== item));
      else if (alvo?.startsWith("slot-")) {
        const k = Number(alvo.slice(5));
        setOrdem((o) => { const sem = o.filter((x) => x !== item); sem.splice(Math.min(k, sem.length), 0, item); return sem; });
      }
    },
  });

  const chip = (v: string, extra: string) => (
    <button
      type="button"
      disabled={travada}
      onPointerDown={(e) => iniciar(e, v, sinal(v))}
      onClick={(e) => teclado(e, v)}
      className={"btn min-h-16 w-full touch-none select-none border-2 text-2xl " + extra}
    >
      {sinal(v)}
    </button>
  );

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex items-center justify-between text-xs font-black uppercase tracking-wide text-suave">
        <span>menor</span><span>maior</span>
      </div>
      <ol className="mt-1 grid grid-cols-4 gap-2" aria-label="Sua ordem">
        {itens.map((_, i) => {
          const v = mostrada[i];
          const acertou = travada && v === certa[i];
          return (
            <li key={i} data-alvo={`slot-${i}`} className="rounded-xl">
              {v === undefined ? (
                <div className="grid h-16 place-items-center rounded-xl border-2 border-dashed border-linha bg-fundo/50 text-xl font-black text-linha">{i + 1}</div>
              ) : chip(v, travada ? (acertou ? "border-ok bg-ok-fundo text-ok" : "anim-balanca border-erro bg-erro-fundo text-erro") : "border-marca bg-marca-clara text-marca-escura")}
            </li>
          );
        })}
      </ol>

      {!travada && (
        <>
          <p className="mt-3 text-center text-sm font-bold text-suave">Arraste ou toque nos itens para pôr em ordem.</p>
          <div data-alvo="pool" className="mt-2 grid min-h-20 grid-cols-2 gap-3 rounded-2xl p-1 sm:grid-cols-4" role="group" aria-label="Itens para ordenar">
            {itens.map((i) => (
              <div key={i}>
                {ordem.includes(i)
                  ? <div className="grid h-16 place-items-center rounded-xl border-2 border-linha bg-fundo text-2xl font-black text-linha">{sinal(i)}</div>
                  : chip(i, "border-linha bg-white shadow-[0_4px_0_var(--color-linha)] hover:border-marca")}
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center gap-3">
            <button type="button" className="btn btn-fantasma" disabled={!ordem.length} onClick={() => setOrdem([])}>Recomeçar</button>
            <button type="button" className="btn btn-marca" disabled={restantes.length > 0} onClick={() => onConfirmar(ordem.join("|"))}>Conferir</button>
          </div>
        </>
      )}
      {travada && escolhida !== resposta && (
        <p className="mt-3 text-center text-base font-bold text-suave">Ordem certa: <span className="text-tinta">{certa.map(sinal).join("  <  ")}</span></p>
      )}
      <Fantasma ponto={fantasma} />
    </div>
  );
}
