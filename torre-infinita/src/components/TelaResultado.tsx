"use client";
import { POR_ID } from "@/engine/habilidades";
import type { ResumoRodada } from "@/engine/rodada";
import { CONFIG_RODADA, type TipoRodada } from "@/engine/selecao";
import { infoZona } from "@/engine/zonas";
import { ACESSORIOS, acessorioDoChefe } from "./Avatar";
import { RetratoChefe } from "./Chefe";

export function TelaResultado({
  resumo,
  tipo,
  nivel,
  aoContinuar,
  aoMapa,
  aoTreinar,
  dirigido,
}: {
  resumo: ResumoRodada;
  tipo: TipoRodada;
  nivel: number;
  aoContinuar: () => void;
  aoMapa: () => void;
  aoTreinar: (habilidade: string) => void;
  /** Treino de uma habilidade só: não avança andar. */
  dirigido?: boolean;
}) {
  const fracas = [...new Set(resumo.fracas.map((f) => f.habilidade))].slice(0, 3);
  const novoPorNivel = resumo.niveisSubidos > 0 ? ACESSORIOS.find((a) => a.nivel !== undefined && a.nivel > 1 && a.nivel <= nivel && a.nivel > nivel - resumo.niveisSubidos) : undefined;
  const itemDoChefe = resumo.chefe?.primeira ? ACESSORIOS[acessorioDoChefe(resumo.chefe.zona)] : undefined;
  return (
    <main className="mx-auto grid min-h-dvh max-w-xl content-center gap-5 px-4 py-8">
      <section className="cartao anim-entra grid gap-5 p-6 text-center" aria-labelledby="res">
        {resumo.chefe && (
          <div className="rounded-2xl p-4" style={{ background: `color-mix(in srgb, ${infoZona(resumo.chefe.zona).cor} 14%, white)` }}>
            <div className="mx-auto w-fit"><RetratoChefe zona={resumo.chefe.zona} tamanho={104} apagado={!resumo.chefe.venceu} /></div>
            <p className="mt-1 text-xl font-black">{resumo.chefe.nome}</p>
            <p className="mx-auto mt-1 max-w-sm text-lg font-bold italic">“{resumo.chefe.venceu ? infoZona(resumo.chefe.zona).chefe.derrota : infoZona(resumo.chefe.zona).chefe.vitoria}”</p>
            {resumo.chefe.primeira && <p className="mx-auto mt-3 w-fit rounded-full bg-ouro-fundo px-4 py-1.5 font-black text-ouro">★ Troféu da zona {resumo.chefe.zona}!{itemDoChefe && ` Novo item: ${itemDoChefe.nome}.`}</p>}
          </div>
        )}
        <div>
          <p className="rotulo">{CONFIG_RODADA[tipo].rotulo}{resumo.chefe ? "" : ` · ${resumo.zona}`}</p>
          <h1 id="res" className="mt-1 text-4xl font-black">
            {resumo.chefe ? (resumo.chefe.venceu ? "Chefe derrotado!" : "O chefe resistiu") : resumo.falhou ? "As vidas acabaram" : resumo.acertos === resumo.total ? "Perfeito!" : dirigido ? "Treino concluído" : "Andar concluído"}
          </h1>
          {resumo.falhou && (
            <p className="mx-auto mt-2 max-w-sm text-suave">
              Sem drama: você não perde nível nem pontos. {dirigido ? "Tente de novo quando quiser." : "O andar recomeça com perguntas novas e, depois de duas quedas, o jogo ajuda com mais vidas."}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            [`${resumo.acertos}/${resumo.total}`, "acertos"],
            [`${resumo.pontos}`, "pontos"],
            [`+${resumo.xpGanho}`, "XP"],
          ].map(([v, r]) => (
            <div key={r} className="rounded-2xl bg-marca-clara p-3">
              <p className="text-3xl font-black text-marca-escura">{v}</p>
              <p className="rotulo">{r}</p>
            </div>
          ))}
        </div>

        {(resumo.bonus.length > 0 || resumo.niveisSubidos > 0 || resumo.novasHabilidades.length > 0) && (
          <ul className="grid gap-2 text-left">
            {resumo.bonus.map((b) => (
              <li key={b.titulo} className="flex justify-between rounded-xl bg-ouro-fundo px-4 py-2 font-bold text-ouro"><span>{b.titulo}</span><span>+{b.valor}</span></li>
            ))}
            {resumo.niveisSubidos > 0 && (
              <li className="rounded-xl bg-marca-clara px-4 py-2 font-black text-marca-escura">
                Você subiu para o nível {nivel}!{novoPorNivel && ` Novo acessório: ${novoPorNivel.nome}.`}
              </li>
            )}
            {resumo.novasHabilidades.map((id) => (
              <li key={id} className="rounded-xl bg-ok-fundo px-4 py-2 font-black text-ok">Nova habilidade liberada: {POR_ID.get(id)?.nome}</li>
            ))}
          </ul>
        )}

        {fracas.length > 0 && (
          <div className="text-left">
            <p className="rotulo mb-2">Vale reforçar</p>
            <div className="flex flex-wrap gap-2">
              {fracas.map((id) => (
                <button key={id} type="button" className="btn btn-suave min-h-10 text-sm" onClick={() => aoTreinar(id)}>
                  Treinar: {POR_ID.get(id)?.nome}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" className="btn btn-marca btn-grande" onClick={aoContinuar} autoFocus>
            {dirigido ? "Treinar mais" : resumo.falhou ? "Tentar de novo" : "Próximo andar"}
          </button>
          <button type="button" className="btn btn-fantasma" onClick={aoMapa}>Voltar ao mapa</button>
        </div>
      </section>
    </main>
  );
}
