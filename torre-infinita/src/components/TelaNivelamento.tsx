"use client";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Nivelamento } from "@/engine/nivelamento";
import { POR_ID } from "@/engine/habilidades";
import type { EstadoAluno, Pergunta } from "@/engine/tipos";
import { PerguntaView, type Feedback } from "./PerguntaView";

/** Teste de nivelamento: sem vidas, sem pontos e sem tempo. Só descobre onde o aluno está. */
export function TelaNivelamento({
  estado,
  aoTerminar,
  aoPular,
  aoResponder,
}: {
  estado: EstadoAluno;
  aoTerminar: (colocadas: string[], perguntas: number) => void;
  aoPular: () => void;
  aoResponder: () => void;
}) {
  const [teste] = useState(() => new Nivelamento(estado));
  const [comecou, setComecou] = useState(false);
  const [fb, setFb] = useState<Feedback | null>(null);
  /** Pergunta que acabou de ser respondida: fica na tela durante o feedback. */
  const [respondida, setRespondida] = useState<Pergunta | null>(null);
  const [, atualizar] = useReducer((x: number) => x + 1, 0);
  const t0 = useRef(performance.now());
  const p = teste.atual();

  const responder = useCallback(
    (bruto: string) => {
      if (fb || !teste.atual()) return;
      const q = teste.atual()!;
      const ok = teste.responder(bruto, performance.now() - t0.current);
      // o teste já avançou para a próxima pergunta; a respondida fica na tela durante o feedback
      setRespondida(q);
      setFb({ ok, escolhida: bruto });
      aoResponder();
    },
    [fb, teste, aoResponder],
  );

  // Mostra o resultado por um instante e passa adiante.
  useEffect(() => {
    if (!fb) return;
    const id = setTimeout(() => {
      setFb(null);
      t0.current = performance.now();
      if (teste.terminou) {
        const { colocadas } = teste.concluir();
        aoTerminar(colocadas, teste.respondidas);
      } else atualizar();
    }, 600);
    return () => clearTimeout(id);
  }, [fb, teste, aoTerminar]);

  if (!comecou) {
    return (
      <main className="mx-auto grid min-h-dvh max-w-xl content-center gap-5 px-4 py-8">
        <div className="cartao anim-entra grid gap-4 p-6 text-center">
          <h1 className="text-3xl font-black">Vamos descobrir onde você está</h1>
          <p className="text-lg text-suave">
            São algumas perguntas, do mais fácil para o mais difícil. <strong>Não vale nota</strong> e não tem tempo.
            Se não souber, tudo bem: escreva o que achar e siga em frente. É assim que o jogo escolhe o seu ponto de partida.
          </p>
          <button type="button" className="btn btn-marca btn-grande justify-self-center" onClick={() => { setComecou(true); t0.current = performance.now(); }}>
            Começar
          </button>
          <button type="button" className="btn btn-fantasma justify-self-center" onClick={aoPular}>
            Pular e começar do básico
          </button>
        </div>
      </main>
    );
  }

  // Durante o feedback, exibimos a pergunta que acabou de ser respondida.
  const mostrada = fb ? respondida : p;
  if (!mostrada) return null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 pb-8 pt-4">
      <header className="flex items-center gap-3">
        <p className="rotulo flex-1">Nivelamento · {POR_ID.get(mostrada.habilidade)?.zona}</p>
        <div className="h-3 w-40 overflow-hidden rounded-full bg-linha" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(teste.progresso * 100)}>
          <div className="h-full rounded-full bg-marca transition-[width]" style={{ width: `${teste.progresso * 100}%` }} />
        </div>
      </header>
      <section className="cartao mt-3 flex-1 p-5 sm:p-8">
        <PerguntaView key={mostrada.id} p={mostrada} feedback={fb} dica={false} onResponder={responder} />
        <p className="mt-6 text-center text-sm font-semibold text-suave">Não sabe? Chute e siga. O jogo só precisa saber onde começar.</p>
      </section>
    </main>
  );
}
