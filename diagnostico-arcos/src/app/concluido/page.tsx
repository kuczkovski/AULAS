"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Cabecalho } from "@/components/Cabecalho";
import { useTentativa } from "@/components/useTentativa";
import { DIMS, DIMENSOES } from "@/dominio/questoes";
import { NIVEIS } from "@/dominio/pontuacao";
import { limparTentativa } from "@/lib/sessao";

export default function Concluido() {
  const router = useRouter();
  const { estado, erro, offline } = useTentativa({ permitirEncerrada: true });

  useEffect(() => { if (estado?.status === "em_andamento") router.replace("/avaliacao"); }, [estado, router]);

  function sair() {
    limparTentativa();
    router.push("/");
  }

  return (
    <>
      <Cabecalho />
      <main className="mx-auto max-w-3xl px-4 py-8">
        {erro ? <p role="alert">{erro}</p> : offline || !estado?.resumo ? (
          <p role="status" className="text-suave">{offline ? "Sem conexão para mostrar a síntese. Suas respostas já foram registradas." : "Carregando…"}</p>
        ) : (
          <>
            <h1 className="text-3xl font-bold">Avaliação registrada</h1>
            <p className="mt-2 text-lg">{estado.nome} · {estado.turma}</p>
            {estado.status === "encerrada_por_tempo" && (
              <p className="mt-4 rounded-lg bg-aten-fundo p-3 text-aten">O tempo terminou. Foram consideradas as respostas registradas até aqui.</p>
            )}
            <p className="mt-4 text-suave">
              Esta avaliação não é uma nota. Ela mostra o que já está consolidado e o que vamos retomar em aula, para que o estudo de arcos e ângulos comece do ponto certo.
            </p>

            <h2 className="mt-8 text-xl font-bold">Síntese por área</h2>
            <ul className="mt-3 space-y-3">
              {DIMS.map(d => {
                const r = estado.resumo!.dimensoes[d];
                return (
                  <li key={d} className="cartao p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-lg font-semibold">{DIMENSOES[d].nome}</p>
                      <p className={`rounded-md px-2 py-0.5 text-sm font-semibold n-${r.nivel}`}>{NIVEIS[r.nivel].aluno}</p>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-linha" role="img" aria-label={`${Math.round(r.pct)}% nesta área`}>
                      <div className="h-full bg-marca" style={{ width: `${r.pct}%` }} />
                    </div>
                    {d === "D4" && <p className="mt-2 text-sm text-suave">Esta área antecipa o que ainda vamos aprender juntos: aqui é só o ponto de partida.</p>}
                  </li>
                );
              })}
            </ul>

            <button className="botao mt-8" onClick={sair}>Encerrar e sair</button>
          </>
        )}
      </main>
    </>
  );
}
