"use client";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { novoEstado } from "@/engine/estado";
import { POR_ID } from "@/engine/habilidades";
import { desbloqueadas, tipoDoAndar, type TipoRodada } from "@/engine/selecao";
import { criarRng } from "@/engine/rng";
import { Rodada, type ResumoRodada } from "@/engine/rodada";
import type { Ano, Avatar, EstadoAluno } from "@/engine/tipos";
import { apagarSessao, carregarSessao, salvarSessao, type Sessao } from "@/lib/armazenamento";
import { carregarEstadoRemoto, entrarComCodigo, sairDaNuvem, salvarPerfil, sincronizar, type ErroEntrada } from "@/lib/nuvem";
import { som } from "@/lib/som";
import { TelaEntrada } from "./TelaEntrada";
import { TelaMapa } from "./TelaMapa";
import { TelaNivelamento } from "./TelaNivelamento";
import { TelaPerfil } from "./TelaPerfil";
import { TelaResultado } from "./TelaResultado";
import { TelaRodada } from "./TelaRodada";

type Tela =
  | { t: "carregando" }
  | { t: "entrada" }
  | { t: "perfil"; primeira: boolean }
  | { t: "nivelamento" }
  | { t: "mapa" }
  | { t: "rodada"; rodada: Rodada; foco?: string; inicio: number }
  | { t: "resultado"; resumo: ResumoRodada; tipo: TipoRodada; foco?: string };

export function Jogo() {
  const sessao = useRef<Sessao | null>(null);
  const [tela, setTela] = useState<Tela>({ t: "carregando" });
  const [versao, atualizar] = useReducer((x: number) => x + 1, 0);
  const [aviso, setAviso] = useState<string | null>(null);

  const persistir = useCallback(() => {
    if (sessao.current) salvarSessao(sessao.current);
  }, []);

  const destino = useCallback((s: Sessao): Tela => {
    if (!s.estado.apelido) return { t: "perfil", primeira: true };
    if (!s.estado.nivelamentoFeito) return { t: "nivelamento" };
    return { t: "mapa" };
  }, []);

  const iniciar = useCallback(
    (s: Sessao) => {
      sessao.current = s;
      salvarSessao(s);
      setTela(destino(s));
    },
    [destino],
  );

  // Retoma a sessão salva neste navegador.
  useEffect(() => {
    const s = carregarSessao();
    if (!s) { setTela({ t: "entrada" }); return; }
    sessao.current = s;
    setTela(destino(s));
    if (s.modo === "nuvem" && s.aluno) void sincronizar(s.aluno.alunoId, s.estado);
  }, [destino]);

  // Voltou a internet: envia o que ficou na fila.
  useEffect(() => {
    const enviar = () => {
      const s = sessao.current;
      if (s?.modo === "nuvem" && s.aluno) void sincronizar(s.aluno.alunoId, s.estado);
    };
    window.addEventListener("online", enviar);
    return () => window.removeEventListener("online", enviar);
  }, []);

  // Modo calmo: sem animações nem sons.
  const calmo = sessao.current?.estado.calmo ?? false;
  useEffect(() => {
    document.body.classList.toggle("calmo", calmo);
  }, [calmo, tela.t]);

  const estado = (): EstadoAluno => sessao.current!.estado;

  async function entrarNuvem(codigo: string, pin: string): Promise<ErroEntrada | null> {
    const r = await entrarComCodigo(codigo, pin);
    if ("erro" in r) return r.erro;
    const local = carregarSessao();
    const remoto = await carregarEstadoRemoto(r.aluno.alunoId);
    if (remoto === "erro") return "rede";
    let e: EstadoAluno;
    if (local?.aluno?.alunoId === r.aluno.alunoId && (!remoto || local.atualizadoEm > remoto.em)) e = local.estado;
    else if (remoto) e = { ...novoEstado(r.aluno.ano), ...remoto.estado };
    else e = novoEstado(r.aluno.ano);
    e.ano = r.aluno.ano;
    if (r.apelido) e.apelido = r.apelido;
    if (r.avatar && Object.keys(r.avatar).length) e.avatar = { ...e.avatar, ...r.avatar };
    iniciar({ modo: "nuvem", estado: e, aluno: r.aluno, atualizadoEm: Date.now() });
    return null;
  }

  function jogarLocal(ano: Ano) {
    iniciar({ modo: "local", estado: novoEstado(ano), atualizadoEm: Date.now() });
  }

  async function guardarPerfil(apelido: string, avatar: Avatar): Promise<string | null> {
    const s = sessao.current!;
    if (s.modo === "nuvem") {
      const r = await salvarPerfil(apelido, avatar);
      if (r === "apelido-invalido") return "Esse apelido não pode ser usado. Escolha outro.";
      if (r === "rede") return "Não deu para salvar agora: sem conexão com o servidor. Tente de novo.";
    }
    s.estado.apelido = apelido;
    s.estado.avatar = avatar;
    persistir();
    if (s.modo === "nuvem" && s.aluno) void sincronizar(s.aluno.alunoId, s.estado);
    setTela(tela.t === "perfil" && tela.primeira ? destino(s) : { t: "mapa" });
    return null;
  }

  function terminarNivelamento(colocadas: string[]) {
    const s = sessao.current!;
    persistir();
    if (s.modo === "nuvem" && s.aluno) void sincronizar(s.aluno.alunoId, s.estado);
    const abertas = desbloqueadas(s.estado);
    const proxima = abertas.find((h) => !colocadas.includes(h.id));
    setAviso(
      colocadas.length
        ? `Pronto! Você já domina ${colocadas.length} ${colocadas.length === 1 ? "habilidade" : "habilidades"}.` +
            (proxima ? ` Vamos começar por: ${proxima.nome}.` : " Os andares vão revisar e aprofundar tudo isso.")
        : "Pronto! Vamos começar pelo básico e subir andar por andar.",
    );
    setTela({ t: "mapa" });
  }

  function pularNivelamento() {
    const s = sessao.current!;
    s.estado.nivelamentoFeito = true;
    persistir();
    setTela({ t: "mapa" });
  }

  function iniciarRodada(foco?: string) {
    const e = estado();
    const tipo: TipoRodada = foco ? "treino" : tipoDoAndar(e.andar);
    setAviso(null);
    setTela({ t: "rodada", rodada: new Rodada(e, tipo, criarRng(), foco), foco, inicio: Date.now() });
  }

  function fimRodada(rodada: Rodada, inicio: number, foco?: string) {
    const s = sessao.current!;
    const andar = s.estado.andar;
    const resumo = rodada.concluir();
    persistir();
    if (s.modo === "nuvem" && s.aluno) {
      void sincronizar(s.aluno.alunoId, s.estado, {
        alunoId: s.aluno.alunoId, tipo: rodada.tipo, andar, acertos: resumo.acertos, total: Math.max(1, resumo.total),
        pontos: resumo.pontos, duracaoS: Math.min(7200, Math.round((Date.now() - inicio) / 1000)), falhou: resumo.falhou,
      });
    }
    if (s.estado.som && resumo.niveisSubidos > 0) som.nivel();
    setTela({ t: "resultado", resumo, tipo: rodada.tipo, foco });
  }

  function alternar(chave: "som" | "calmo") {
    const e = estado();
    e[chave] = !e[chave];
    persistir();
    atualizar();
  }

  async function sair() {
    if (sessao.current?.modo === "nuvem") await sairDaNuvem();
    apagarSessao();
    sessao.current = null;
    setAviso(null);
    setTela({ t: "entrada" });
  }

  switch (tela.t) {
    case "carregando":
      return <main className="grid min-h-dvh place-items-center text-xl font-black text-marca">Carregando…</main>;
    case "entrada":
      return <TelaEntrada aoEntrar={entrarNuvem} aoJogarLocal={jogarLocal} />;
    case "perfil":
      return (
        <TelaPerfil
          apelido={estado().apelido}
          avatar={estado().avatar}
          nivel={estado().nivel}
          primeiraVez={tela.primeira}
          aoSalvar={guardarPerfil}
          aoVoltar={tela.primeira ? undefined : () => setTela({ t: "mapa" })}
        />
      );
    case "nivelamento":
      return <TelaNivelamento estado={estado()} aoTerminar={terminarNivelamento} aoPular={pularNivelamento} aoResponder={persistir} />;
    case "mapa":
      return (
        <TelaMapa
          estado={estado()}
          turma={sessao.current?.aluno?.turma}
          versao={versao}
          aviso={aviso}
          aoFecharAviso={() => setAviso(null)}
          aoJogar={iniciarRodada}
          aoPerfil={() => setTela({ t: "perfil", primeira: false })}
          aoSair={sair}
          aoAlternar={alternar}
        />
      );
    case "rodada":
      return (
        <TelaRodada
          key={tela.inicio}
          rodada={tela.rodada}
          andar={estado().andar}
          somLigado={estado().som}
          aoResponder={persistir}
          aoFim={() => fimRodada(tela.rodada, tela.inicio, tela.foco)}
          aoSair={() => { persistir(); setTela({ t: "mapa" }); }}
        />
      );
    case "resultado":
      return (
        <TelaResultado
          resumo={tela.resumo}
          tipo={tela.tipo}
          nivel={estado().nivel}
          dirigido={!!tela.foco}
          aoContinuar={() => iniciarRodada(tela.foco)}
          aoMapa={() => setTela({ t: "mapa" })}
          aoTreinar={(id) => iniciarRodada(id)}
        />
      );
  }
}

/** Nome da habilidade, para mensagens fora do mapa. */
export const nomeDe = (id: string) => POR_ID.get(id)?.nome ?? id;
