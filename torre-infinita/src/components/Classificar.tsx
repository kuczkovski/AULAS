"use client";
import { useState } from "react";
import { sinal } from "@/lib/formato";
import { Fantasma, useArrastar } from "./Arrastar";

/** Colocar cada item no grupo certo: arrastando, ou tocando no item e depois no grupo. */
export function Classificar({
  itens,
  grupos,
  resposta,
  escolhida,
  onConfirmar,
}: {
  itens: string[];
  grupos: [string, string];
  /** Um dígito por item ("0" primeiro grupo, "1" segundo). */
  resposta: string;
  escolhida?: string;
  onConfirmar: (r: string) => void;
}) {
  const [atrib, setAtrib] = useState<Record<string, 0 | 1>>({});
  const [sel, setSel] = useState<string | null>(null);
  const travada = escolhida !== undefined;
  const grupoDe = (i: number): 0 | 1 | undefined => (travada ? (Number(escolhida[i]) as 0 | 1) : atrib[itens[i]!]);
  const faltam = itens.filter((i) => atrib[i] === undefined).length;

  const { fantasma, iniciar, teclado } = useArrastar<string>({
    onToque: (item) => setSel((s) => (s === item ? null : item)),
    onSoltar: (item, alvo) => {
      setSel(null);
      if (alvo === "0" || alvo === "1") setAtrib((a) => ({ ...a, [item]: Number(alvo) as 0 | 1 }));
      else if (alvo === "pool") setAtrib((a) => { const { [item]: _, ...resto } = a; return resto; });
    },
  });

  const colocarSelecionado = (g: 0 | 1) => { if (sel) { setAtrib((a) => ({ ...a, [sel]: g })); setSel(null); } };

  const chip = (item: string, i: number, extra = "") => (
    <button
      key={item}
      type="button"
      disabled={travada}
      onPointerDown={(e) => iniciar(e, item, sinal(item))}
      onClick={(e) => teclado(e, item)}
      aria-pressed={sel === item}
      className={"btn min-h-14 touch-none select-none border-2 px-4 text-xl " + (sel === item ? "border-marca bg-marca-clara " : "border-linha bg-white ") + extra}
      data-i={i}
    >
      {sinal(item)}
    </button>
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="grid gap-3 sm:grid-cols-2">
        {([0, 1] as const).map((g) => (
          <div key={g} data-alvo={String(g)} className={"rounded-2xl border-2 p-3 " + (sel && !travada ? "border-marca bg-marca-clara/50" : "border-linha bg-fundo/60")}>
            <p className="rotulo mb-2 text-center text-tinta">{grupos[g]}</p>
            <div className="flex min-h-20 flex-wrap justify-center gap-2">
              {itens.map((item, i) => {
                if (grupoDe(i) !== g) return null;
                const certo = travada ? resposta[i] === String(g) : undefined;
                return chip(item, i, travada ? (certo ? "border-ok bg-ok-fundo text-ok" : "anim-balanca border-erro bg-erro-fundo text-erro") : "");
              })}
            </div>
            {sel && !travada && <button type="button" className="btn btn-suave mt-2 w-full" onClick={() => colocarSelecionado(g)}>Colocar “{sinal(sel)}” aqui</button>}
          </div>
        ))}
      </div>

      {!travada && (
        <>
          <p className="mt-3 text-center text-sm font-bold text-suave">Arraste cada item para um grupo, ou toque no item e depois no grupo.</p>
          <div data-alvo="pool" className="mt-2 flex min-h-20 flex-wrap justify-center gap-2 rounded-2xl p-1" role="group" aria-label="Itens para classificar">
            {itens.map((item, i) => (atrib[item] === undefined ? chip(item, i, "shadow-[0_4px_0_var(--color-linha)]") : null))}
          </div>
          <div className="mt-4 flex justify-center gap-3">
            <button type="button" className="btn btn-fantasma" disabled={faltam === itens.length} onClick={() => { setAtrib({}); setSel(null); }}>Recomeçar</button>
            <button type="button" className="btn btn-marca" disabled={faltam > 0} onClick={() => onConfirmar(itens.map((i) => String(atrib[i])).join(""))}>Conferir</button>
          </div>
        </>
      )}
      <Fantasma ponto={fantasma} />
    </div>
  );
}
