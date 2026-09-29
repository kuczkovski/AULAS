"use client";
import { useMemo, useState } from "react";
import { dominioHabilidade } from "@/engine/dominio";
import { sequenciaDeDias, xpNecessario } from "@/engine/estado";
import { HABILIDADES, POR_ID } from "@/engine/habilidades";
import { CONFIG_RODADA, chefeDaVez, progressoDaZona, situacao, tipoDoAndar, zonaEmFoco, type Situacao } from "@/engine/selecao";
import { ZONAS, infoZona } from "@/engine/zonas";
import type { EstadoAluno } from "@/engine/tipos";
import { Avatar } from "./Avatar";
import { RetratoChefe } from "./Chefe";
import { TorreSvg } from "./TorreSvg";
import { PainelTurma } from "./PainelTurma";
import { useInstalar } from "./Pwa";

const DESCRICAO = {
  treino: "Desafios novos e o que ainda está fraco.",
  revisao: "Hora de rever o que você já sabe, para não esquecer.",
  chefe: "Um chefe de verdade: energia para derrubar, mais vidas e pontos ×1,5.",
} as const;

const ESTADO: Record<Situacao, { rotulo: string; cor: string }> = {
  bloqueada: { rotulo: "bloqueada", cor: "bg-linha" },
  nova: { rotulo: "nova", cor: "bg-marca" },
  aprendendo: { rotulo: "aprendendo", cor: "bg-ouro" },
  consolidada: { rotulo: "dominada", cor: "bg-ok" },
};

function Chama() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden className="text-ouro">
      <path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10Z" fill="currentColor" />
    </svg>
  );
}

export function TelaMapa({
  estado,
  turma,
  versao,
  aoJogar,
  aoPerfil,
  aoSair,
  aoAlternar,
  aviso,
  aoFecharAviso,
}: {
  estado: EstadoAluno;
  turma?: string;
  versao: number;
  aoJogar: (foco?: string) => void;
  aoPerfil: () => void;
  aoSair: () => void;
  aoAlternar: (chave: "som" | "calmo") => void;
  aviso?: string | null;
  aoFecharAviso: () => void;
}) {
  const [aberta, setAberta] = useState<string | null>(null);
  const app = useInstalar();
  const tipo = tipoDoAndar(estado.andar);
  const necessario = xpNecessario(estado.nivel);
  const dias = sequenciaDeDias(estado.dias);
  const zonas = useMemo(() => [...new Set(HABILIDADES.map((h) => h.zona))], []);
  const zonaChefe = chefeDaVez(estado);
  const zonaFoco = zonaEmFoco(estado);
  const zonaAtual = tipo === "chefe" ? zonaChefe : zonaFoco;
  const infoAtual = infoZona(zonaAtual);
  const trofeus = estado.chefes.filter((z) => z in ZONAS).length;
  const taxa = estado.respondidas ? Math.round((estado.acertos / estado.respondidas) * 100) : null;

  return (
    <main className={"mx-auto grid gap-5 px-4 py-5 " + (turma ? "max-w-6xl lg:grid-cols-[1fr_20rem]" : "max-w-3xl")}>
      <div className="grid content-start gap-5">
        <header className="cartao flex flex-wrap items-center gap-4 p-4">
          <button type="button" onClick={aoPerfil} className="rounded-full" aria-label="Editar personagem">
            <Avatar avatar={estado.avatar} tamanho={64} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-black">{estado.apelido || "Jogador"}</p>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-sm font-black text-marca">Nível {estado.nivel}</span>
              <div className="h-3 w-40 max-w-full overflow-hidden rounded-full bg-linha" role="progressbar" aria-valuemin={0} aria-valuemax={necessario} aria-valuenow={estado.xp} aria-label="Experiência">
                <div className="h-full rounded-full bg-marca transition-[width] duration-500" style={{ width: `${(estado.xp / necessario) * 100}%` }} />
              </div>
              <span className="text-xs font-bold text-suave">{estado.xp}/{necessario} XP</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-ouro-fundo px-3 py-1.5 text-sm font-black text-ouro" title="Dias seguidos jogando">
            <Chama /> {dias} {dias === 1 ? "dia" : "dias"}
          </div>
          <div className="rounded-full bg-marca-clara px-3 py-1.5 text-sm font-black text-marca-escura" title="Chefes derrotados">★ {trofeus}/{Object.keys(ZONAS).length} chefes</div>
        </header>

        {aviso && (
          <p role="status" className="cartao anim-entra flex items-start justify-between gap-3 border-ok bg-ok-fundo p-4 font-bold text-ok">
            <span>{aviso}</span>
            <button type="button" className="btn btn-fantasma min-h-8 px-2" onClick={aoFecharAviso} aria-label="Fechar aviso">✕</button>
          </p>
        )}

        <section className="cartao anim-entra overflow-hidden" aria-labelledby="andar" style={{ borderColor: infoAtual.cor }}>
          <div className="grid items-center gap-4 p-5 sm:grid-cols-[auto_1fr]" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${infoAtual.cor} 16%, white), white 70%)` }}>
            <div className="mx-auto"><TorreSvg andar={estado.andar} zonaProximoChefe={zonaChefe} largura={150} /></div>
            <div className="text-center sm:text-left">
              <p className="rotulo" style={{ color: infoAtual.cor }}>
                {tipo === "chefe" ? "Andar de chefe" : tipo === "revisao" ? "Andar de revisão" : "Andar de treino"} · Zona {zonaAtual}
              </p>
              <h1 id="andar" className="mt-1 text-5xl font-black tracking-tight">Andar {estado.andar}</h1>
              {tipo === "chefe" ? (
                <div className="mt-2 flex items-center justify-center gap-3 sm:justify-start">
                  <RetratoChefe zona={zonaChefe} tamanho={56} />
                  <p className="text-left text-lg font-bold"><span className="text-suave">Chefe:</span> {infoZona(zonaChefe).chefe.nome}</p>
                </div>
              ) : (
                <p className="mt-2 text-lg text-suave">{DESCRICAO[tipo]}</p>
              )}
              <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm font-bold text-suave sm:justify-start">
                <span className="rounded-full bg-marca-clara px-3 py-1">{tipo === "chefe" ? "derrube a energia" : `${CONFIG_RODADA[tipo].n} desafios`}</span>
                <span className="rounded-full bg-marca-clara px-3 py-1">{estado.quedas >= 2 ? Math.max(5, CONFIG_RODADA[tipo].vidas) : CONFIG_RODADA[tipo].vidas} vidas</span>
                {estado.quedas >= 2 && <span className="rounded-full bg-ouro-fundo px-3 py-1 text-ouro">modo guiado: dicas sem custo</span>}
              </div>
              <button type="button" className="btn btn-marca btn-grande mt-5" onClick={() => aoJogar()} autoFocus>
                {tipo === "chefe" ? "Ir ao chefe" : "Jogar"}
              </button>
            </div>
          </div>
        </section>

        <section aria-labelledby="jornada" className="grid gap-3">
          <div className="flex items-baseline justify-between">
            <h2 id="jornada" className="text-2xl font-black">Sua jornada</h2>
            {taxa !== null && <span className="text-sm font-bold text-suave">{taxa}% de acerto · {estado.respondidas} respondidas</span>}
          </div>
          {zonas.map((z) => {
            const hs = HABILIDADES.filter((h) => h.zona === z && h.ano <= estado.ano);
            if (!hs.length) return null;
            const info = infoZona(z), prog = progressoDaZona(estado, z);
            return (
              <div key={z} className="cartao overflow-hidden border-l-8 p-4" style={{ borderLeftColor: info.cor }} data-versao={versao}>
                <div className="mb-3 flex items-center gap-3">
                  <RetratoChefe zona={z} tamanho={52} apagado={prog.chefe !== "derrotado"} titulo={`Chefe da zona ${z}: ${info.chefe.nome}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-black" style={{ color: info.cor }}>{z}</p>
                    <p className="text-sm font-semibold text-suave">{info.descricao}</p>
                  </div>
                  <div className="text-right text-xs font-black">
                    <p className="text-suave">{prog.dominadas} de {prog.total} dominadas</p>
                    <p className={prog.chefe === "derrotado" ? "text-ouro" : prog.chefe === "disponivel" ? "text-tinta" : "text-suave"}>
                      {prog.chefe === "derrotado" ? "★ chefe derrotado" : prog.chefe === "disponivel" ? `chefe: ${info.chefe.nome}` : "chefe bloqueado"}
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {hs.map((h) => {
                    const sit = situacao(h, estado);
                    const d = dominioHabilidade(h, estado.fatos);
                    const pct = sit === "bloqueada" ? 0 : sit === "consolidada" && !d ? 100 : Math.round((d?.d ?? 0) * 100);
                    const falta = h.requisitos.map((id) => POR_ID.get(id)!).filter((r) => situacao(r, estado) !== "consolidada");
                    const abre = aberta === h.id;
                    return (
                      <div key={h.id} className={"rounded-2xl border-2 p-3 " + (sit === "bloqueada" ? "border-linha bg-fundo/60 text-suave" : "border-linha bg-white")}>
                        <button type="button" className="w-full text-left" aria-expanded={abre} onClick={() => setAberta(abre ? null : h.id)}>
                          <span className="flex items-center justify-between gap-2">
                            <span className="font-black">{h.nome}</span>
                            <span className="text-xs font-black uppercase tracking-wide text-suave">{h.ano}º ano</span>
                          </span>
                          <span className="mt-2 flex items-center gap-2">
                            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-linha"><span className={"block h-full rounded-full " + ESTADO[sit].cor} style={{ width: `${pct}%` }} /></span>
                            <span className="w-24 text-right text-xs font-bold text-suave">{ESTADO[sit].rotulo}</span>
                          </span>
                        </button>
                        {abre && (
                          <div className="anim-entra mt-3 border-t-2 border-linha pt-3 text-sm">
                            {sit === "bloqueada" ? (
                              <p className="font-semibold">Abre quando você dominar: <strong>{falta.map((f) => f.nome).join(", ")}</strong>.</p>
                            ) : (
                              <>
                                <p className="font-semibold text-suave">
                                  {d ? `${d.observadas} de ${d.total} tipos de desafio já vistos.` : "Ainda não jogada."}
                                </p>
                                <button type="button" className="btn btn-suave mt-2 min-h-10" onClick={() => aoJogar(h.id)}>Treinar só isso</button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>

        <details className="cartao p-4">
          <summary className="cursor-pointer text-lg font-black">Ajustes</summary>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn btn-suave" onClick={() => aoAlternar("som")} aria-pressed={estado.som}>Som: {estado.som ? "ligado" : "desligado"}</button>
            <button type="button" className="btn btn-suave" onClick={() => aoAlternar("calmo")} aria-pressed={estado.calmo}>Modo calmo: {estado.calmo ? "ligado" : "desligado"}</button>
            <button type="button" className="btn btn-suave" onClick={aoPerfil}>Trocar personagem</button>
            {app.podeInstalar && <button type="button" className="btn btn-marca" onClick={() => void app.instalar()}>Instalar o app</button>}
            <button type="button" className="btn btn-fantasma" onClick={aoSair}>Sair</button>
          </div>
          {app.ios && <p className="mt-3 text-sm font-semibold text-suave">Para instalar no iPhone ou iPad: toque em Compartilhar e depois em “Adicionar à Tela de Início”.</p>}
        </details>
      </div>

      {turma && <div className="lg:sticky lg:top-5 lg:self-start"><PainelTurma turma={turma} recarregarEm={estado.rodadas} /></div>}
    </main>
  );
}
