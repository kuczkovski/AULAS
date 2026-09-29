"use client";
import { useEffect, useState } from "react";
import type { Pergunta } from "@/engine/tipos";
import { sinal } from "@/lib/formato";
import { Teclado } from "./Teclado";
import { Visual } from "./Visual";

export interface Feedback {
  ok: boolean;
  escolhida: string;
}

/**
 * Uma pergunta com sua área de resposta (alternativas, verdadeiro/falso ou
 * teclado). Fica travada depois de responder, mostrando o que foi certo.
 */
export function PerguntaView({
  p,
  feedback,
  dica,
  onResponder,
}: {
  p: Pergunta;
  feedback: Feedback | null;
  dica: boolean;
  onResponder: (bruto: string) => void;
}) {
  const [valor, setValor] = useState("");
  const travada = feedback !== null;

  useEffect(() => {
    if (p.formato === "digitar" || travada) return;
    const h = (e: KeyboardEvent) => {
      const i = "1234".indexOf(e.key);
      const op = i >= 0 ? p.opcoes?.[i] : undefined;
      if (op !== undefined) onResponder(op);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [p, travada, onResponder]);

  const grande = p.expr !== "";
  return (
    <div className="anim-entra">
      <p className={"text-center font-bold text-suave " + (grande ? "text-xl" : "mx-auto max-w-xl text-2xl leading-snug text-tinta")}>
        {sinal(p.enunciado)}
      </p>
      {grande && (
        <p className="my-4 text-center text-5xl font-black leading-tight tracking-tight sm:text-6xl" aria-label={sinal(p.expr)}>
          {sinal(p.expr)}
        </p>
      )}
      {p.visual && p.verVisualAntes && <div className="my-3"><Visual v={p.visual} /></div>}
      {dica && !travada && (
        <p role="status" className="mx-auto my-3 max-w-xl rounded-2xl bg-ouro-fundo px-4 py-3 text-center text-base font-semibold text-ouro">
          Dica: {sinal(p.dica)}
        </p>
      )}

      <div className="mt-6">
        {p.formato === "digitar" ? (
          <Teclado
            valor={valor}
            onChange={setValor}
            desativado={travada}
            onEnviar={() => valor.trim() && onResponder(valor)}
          />
        ) : (
          <div className={"mx-auto grid max-w-xl gap-3 " + (p.formato === "vf" || (p.opcoes?.length ?? 0) === 2 ? "grid-cols-2" : "grid-cols-2")}>
            {p.opcoes!.map((o, i) => {
              const certa = travada && (o === p.resposta || (p.aceitar ?? []).includes(o));
              const errada = travada && feedback!.escolhida === o && !certa;
              return (
                <button
                  key={o}
                  type="button"
                  disabled={travada}
                  onClick={() => onResponder(o)}
                  className={
                    "btn relative min-h-20 border-2 text-3xl " +
                    (certa
                      ? "border-ok bg-ok-fundo text-ok"
                      : errada
                        ? "anim-balanca border-erro bg-erro-fundo text-erro"
                        : travada
                          ? "border-linha bg-white text-suave opacity-50"
                          : "border-linha bg-white text-tinta shadow-[0_4px_0_var(--color-linha)] hover:-translate-y-0.5 hover:border-marca")
                  }
                >
                  {p.formato !== "vf" && (
                    <span className="absolute left-3 top-2 grid size-6 place-items-center rounded-md bg-marca-clara text-xs font-black text-marca-escura">{i + 1}</span>
                  )}
                  {certa && <span aria-hidden className="absolute right-3 top-2 text-lg">✓</span>}
                  {errada && <span aria-hidden className="absolute right-3 top-2 text-lg">✕</span>}
                  {sinal(o)}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
