"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Cabecalho } from "@/components/Cabecalho";
import { TURMAS } from "@/dominio/questoes";
import { getBackend } from "@/lib/backend";
import { gravarDados, gravarId, lerId, mesclar } from "@/lib/sessao";
import { mensagemDeErro, type EstadoTentativa } from "@/lib/tipos";

export default function Entrada() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [turma, setTurma] = useState("");
  const [passo, setPasso] = useState<"form" | "confirmar">("form");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [conflito, setConflito] = useState<{ respondidas: number } | null>(null);
  const [retomavel, setRetomavel] = useState<EstadoTentativa | null>(null);

  // mesmo aparelho, tentativa em andamento: oferece continuar sem digitar de novo
  useEffect(() => {
    const id = lerId();
    if (!id) return;
    getBackend().then(b => b.obter(id)).then(e => { if (e.status === "em_andamento") setRetomavel(e); }).catch(() => undefined);
  }, []);

  const nomeOk = nome.trim().split(/\s+/).filter(Boolean).length >= 2 && nome.trim().length >= 3;

  function revisar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (!nomeOk) return setErro("Escreva seu nome completo (nome e sobrenome).");
    if (!turma) return setErro("Escolha a sua turma.");
    setPasso("confirmar");
  }

  async function comecar(continuar: boolean) {
    setOcupado(true);
    setErro("");
    try {
      const r = await (await getBackend()).iniciar(nome, turma, continuar);
      if ("conflito" in r) { setConflito({ respondidas: r.respondidas }); return; }
      entrar(r);
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setOcupado(false);
    }
  }

  function entrar(e: EstadoTentativa) {
    gravarId(e.id);
    gravarDados(e.id, mesclar(e, null));
    router.push("/avaliacao");
  }

  return (
    <>
      <Cabecalho />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-3xl font-bold leading-tight">Avaliação Diagnóstica — Relações entre Arcos e Ângulos na Circunferência</h1>
        <p className="mt-3 text-suave">1º ano do Ensino Médio</p>

        {retomavel && (
          <section className="cartao mt-6 border-marca p-5" aria-label="Avaliação em andamento">
            <p className="font-semibold">Há uma avaliação em andamento neste aparelho.</p>
            <p className="mt-1 text-suave">{retomavel.nome} · {retomavel.turma}</p>
            <button className="botao mt-4" onClick={() => entrar(retomavel)}>Continuar avaliação</button>
          </section>
        )}

        <ul className="cartao mt-6 list-disc space-y-2 py-5 pl-9 pr-5 text-base">
          <li><strong>60 minutos</strong> no total, com cronômetro.</li>
          <li>Atividade <strong>sem consulta</strong> a colegas, caderno ou internet.</li>
          <li>O objetivo é <strong>diagnosticar</strong>, não dar nota: mostra o que você já domina e o que vamos retomar em aula.</li>
        </ul>

        {passo === "form" ? (
          <form onSubmit={revisar} className="cartao mt-6 space-y-6 p-5" noValidate>
            <div>
              <label htmlFor="nome" className="mb-2 block font-semibold">Nome completo</label>
              <input id="nome" className="campo" value={nome} maxLength={120} autoComplete="off"
                onChange={e => setNome(e.target.value)} aria-describedby={erro ? "erro" : undefined} />
            </div>
            <fieldset>
              <legend className="mb-2 font-semibold">Turma</legend>
              <div className="flex flex-wrap gap-3" role="radiogroup">
                {TURMAS.map(t => (
                  <label key={t} className={`flex min-h-14 min-w-20 cursor-pointer items-center justify-center rounded-xl border-2 px-5 font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-marca ${turma === t ? "border-marca bg-marca-clara text-marca" : "border-linha bg-white"}`}>
                    <input type="radio" name="turma" value={t} checked={turma === t} onChange={() => setTurma(t)} className="sr-only" />
                    {t}
                  </label>
                ))}
              </div>
            </fieldset>
            {erro && <p id="erro" role="alert" className="rounded-lg bg-alerta-fundo p-3 text-alerta">{erro}</p>}
            <button type="submit" className="botao w-full sm:w-auto">Iniciar diagnóstico</button>
          </form>
        ) : (
          <section className="cartao mt-6 p-5" aria-live="polite">
            {conflito ? (
              <>
                <h2 className="text-xl font-bold">Já existe uma avaliação em andamento</h2>
                <p className="mt-2">Encontramos uma avaliação aberta para <strong>{nome.trim()}</strong> ({turma}), com {conflito.respondidas} {conflito.respondidas === 1 ? "questão respondida" : "questões respondidas"}.</p>
                <p className="mt-2 text-suave">Se é a sua, continue de onde parou: o cronômetro segue o horário original. Se é de outra pessoa com o mesmo nome, avise o professor.</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button className="botao" disabled={ocupado} onClick={() => comecar(true)}>Continuar avaliação</button>
                  <button className="botao botao-claro" onClick={() => { setConflito(null); setPasso("form"); }}>Voltar</button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold">Confira seus dados</h2>
                <p className="mt-3 text-lg"><strong>{nome.trim()}</strong> · {turma}</p>
                <p className="mt-2 text-suave">Ao confirmar, o cronômetro de 60 minutos começa.</p>
                {erro && <p role="alert" className="mt-4 rounded-lg bg-alerta-fundo p-3 text-alerta">{erro}</p>}
                <div className="mt-5 flex flex-wrap gap-3">
                  <button className="botao" disabled={ocupado} onClick={() => comecar(false)}>{ocupado ? "Iniciando…" : "Confirmar e começar"}</button>
                  <button className="botao botao-claro" disabled={ocupado} onClick={() => setPasso("form")}>Corrigir</button>
                </div>
              </>
            )}
          </section>
        )}
        <p className="mt-6 text-sm text-suave">Guardamos apenas seu nome, turma, respostas e tempo, para uso pedagógico do professor.</p>
      </main>
    </>
  );
}
