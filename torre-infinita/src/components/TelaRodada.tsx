"use client";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { Rodada, ResultadoResposta } from "@/engine/rodada";
import { sinal } from "@/lib/formato";
import { som } from "@/lib/som";
import { PerguntaView, type Feedback } from "./PerguntaView";
import { Visual } from "./Visual";

const ROTULO = { treino: "Treino", revisao: "Revisão", chefe: "Chefe" } as const;

export function TelaRodada({
  rodada,
  andar,
  somLigado,
  aoResponder,
  aoFim,
  aoSair,
}: {
  rodada: Rodada;
  andar: number;
  somLigado: boolean;
  aoResponder: () => void;
  aoFim: () => void;
  aoSair: () => void;
}) {
  const [, atualizar] = useReducer((x: number) => x + 1, 0);
  const [res, setRes] = useState<(ResultadoResposta & Feedback) | null>(null);
  const [dica, setDica] = useState(false);
  const [confirmaSair, setConfirmaSair] = useState(false);
  const t0 = useRef(performance.now());
  const oculto = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const respondidoEm = useRef(0);

  const p = rodada.atual();

  // Tempo com a aba escondida não conta como tempo de raciocínio.
  useEffect(() => {
    const h = () => {
      if (document.hidden) oculto.current = performance.now();
      else if (oculto.current) { t0.current += performance.now() - oculto.current; oculto.current = 0; }
    };
    document.addEventListener("visibilitychange", h);
    return () => document.removeEventListener("visibilitychange", h);
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const seguir = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!rodada.avancar()) { aoFim(); return; }
    setRes(null);
    setDica(false);
    t0.current = performance.now();
    atualizar();
  }, [rodada, aoFim]);

  const responder = useCallback(
    (bruto: string) => {
      if (res || !rodada.atual()) return;
      respondidoEm.current = performance.now();
      const r = rodada.responder(bruto, performance.now() - t0.current, dica);
      setRes({ ...r, escolhida: bruto });
      if (somLigado) (r.ok ? (r.rapido ? som.rapido : som.acerto) : som.erro)();
      aoResponder();
      if (r.ok) timer.current = setTimeout(seguir, 1000);
    },
    [res, rodada, dica, somLigado, aoResponder, seguir],
  );

  // Enter avança depois do feedback.
  useEffect(() => {
    if (!res) return;
    const h = (e: KeyboardEvent) => {
      // meio segundo de folga: uma tecla segurada não pode pular a explicação
      if ((e.key === "Enter" || e.key === " ") && !e.repeat && performance.now() - respondidoEm.current > 500) { e.preventDefault(); seguir(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [res, seguir]);

  if (!p) return null;
  const reforco = !!p.reforco;

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 pb-8 pt-4">
      <header className="flex items-center gap-3">
        <button type="button" className="btn btn-fantasma min-h-11 px-3" onClick={() => setConfirmaSair(true)} aria-label="Sair da rodada">✕</button>
        <div className="min-w-0 flex-1">
          <p className="rotulo">{rodada.chefe || `Andar ${andar}`} · {ROTULO[rodada.tipo]}</p>
          <div className="mt-1 flex flex-wrap gap-1.5" role="img" aria-label={`${rodada.acertos} acertos, ${rodada.erros} erros`}>
            {Array.from({ length: rodada.total }, (_, i) => {
              const m = rodada.marcas[i];
              return <span key={i} className={"h-2.5 w-6 rounded-full " + (m === 1 ? "bg-ok" : m === 0 ? "bg-erro" : "bg-linha")} />;
            })}
          </div>
        </div>
        <div className="flex items-center gap-1 text-2xl" role="img" aria-label={`${rodada.vidas} vidas`}>
          {Array.from({ length: rodada.vidasMax }, (_, i) => (
            <span key={i} className={i < rodada.vidas ? "text-erro" : "text-linha"}>♥</span>
          ))}
        </div>
      </header>

      <div className="mt-2 flex items-center justify-between text-sm font-bold text-suave">
        <span>{rodada.guiada ? "Modo guiado: dicas sem custo" : reforco ? "Segunda chance" : ""}</span>
        <span>
          <span className="text-ouro">{rodada.pontos} pts</span>
          {rodada.sequencia >= 3 && <span className="ml-3 text-marca">Sequência {rodada.sequencia}</span>}
        </span>
      </div>

      <section className={"cartao mt-3 flex-1 p-5 sm:p-8 " + (res && !res.ok ? "anim-balanca" : "")}>
        <PerguntaView key={p.id} p={p} feedback={res} dica={dica} onResponder={responder} />

        {!res && (
          <div className="mt-6 text-center">
            <button type="button" className="btn btn-fantasma" onClick={() => setDica(true)} disabled={dica}>
              {dica ? "Dica mostrada" : "Preciso de uma dica"}
            </button>
          </div>
        )}

        {res?.ok && (
          <p role="status" className="anim-pulo mt-6 rounded-2xl bg-ok-fundo px-4 py-3 text-center text-xl font-black text-ok">
            {res.rapido ? "Rápido! " : "Certo! "}
            {res.ganhos > 0 && <span>+{res.ganhos}</span>}
          </p>
        )}

        {res && !res.ok && (
          <div role="status" className="anim-entra mt-6 rounded-2xl bg-erro-fundo p-4 text-left">
            <p className="text-lg font-black text-erro">
              Ainda não. A resposta é <span className="text-xl">{sinal(p.resposta)}</span>
            </p>
            <p className="mt-2 text-base font-semibold text-tinta">{sinal(p.explicacao)}</p>
            {p.visual && <div className="mt-3"><Visual v={p.visual} /></div>}
            {!reforco && !rodada.falhou && (
              <p className="mt-3 text-sm font-bold text-suave">Essa conta volta daqui a pouco, com números novos.</p>
            )}
            <div className="mt-4 text-center">
              <button type="button" autoFocus className="btn btn-marca" onClick={seguir}>
                {rodada.falhou ? "Ver resultado" : "Entendi"}
              </button>
            </div>
          </div>
        )}
      </section>

      {confirmaSair && (
        <div role="dialog" aria-modal="true" aria-label="Sair da rodada" className="fixed inset-0 z-50 grid place-items-center bg-tinta/40 p-4">
          <div className="cartao anim-entra max-w-sm p-6 text-center">
            <p className="text-xl font-black">Sair desta rodada?</p>
            <p className="mt-2 text-suave">Você perde os pontos desta rodada, mas o que você aprendeu nela fica registrado.</p>
            <div className="mt-5 flex justify-center gap-3">
              <button type="button" className="btn btn-suave" autoFocus onClick={() => setConfirmaSair(false)}>Continuar jogando</button>
              <button type="button" className="btn btn-fantasma" onClick={aoSair}>Sair</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
