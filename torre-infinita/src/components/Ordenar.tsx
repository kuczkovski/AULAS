"use client";
import { useState } from "react";
import { sinal } from "@/lib/formato";

/** Toque nos itens na ordem certa (do menor para o maior). */
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
            <li key={i}>
              <button
                type="button"
                disabled={travada || v === undefined}
                onClick={() => setOrdem((o) => o.filter((x) => x !== v))}
                aria-label={v ? `Posição ${i + 1}: ${v}. Toque para remover` : `Posição ${i + 1} vazia`}
                className={
                  "grid h-16 w-full place-items-center rounded-xl border-2 text-xl font-black " +
                  (v === undefined
                    ? "border-dashed border-linha bg-fundo/50 text-linha"
                    : travada
                      ? acertou ? "border-ok bg-ok-fundo text-ok" : "anim-balanca border-erro bg-erro-fundo text-erro"
                      : "border-marca bg-marca-clara text-marca-escura")
                }
              >
                {v === undefined ? i + 1 : sinal(v)}
              </button>
            </li>
          );
        })}
      </ol>

      {!travada && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4" role="group" aria-label="Itens para ordenar">
            {itens.map((i) => {
              const usado = ordem.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={usado}
                  onClick={() => setOrdem((o) => [...o, i])}
                  className={"btn min-h-16 border-2 text-2xl " + (usado ? "border-linha bg-fundo text-linha" : "border-linha bg-white shadow-[0_4px_0_var(--color-linha)] hover:-translate-y-0.5 hover:border-marca")}
                >
                  {sinal(i)}
                </button>
              );
            })}
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
    </div>
  );
}
