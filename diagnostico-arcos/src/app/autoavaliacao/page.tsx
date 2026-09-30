"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Cabecalho, Cronometro } from "@/components/Cabecalho";
import { useContagem } from "@/components/useContagem";
import { useTentativa } from "@/components/useTentativa";
import { ESCALA_AUTO, ITENS_AUTO, QUESTOES } from "@/dominio/questoes";
import { getBackend } from "@/lib/backend";
import { registrarAuto, sincronizar } from "@/lib/sessao";
import { ErroNegocio, mensagemDeErro } from "@/lib/tipos";

export default function Autoavaliacao() {
  const router = useRouter();
  const { sessao, erro } = useTentativa();
  const id = sessao?.id;
  const dados = sessao?.dados;
  const restante = useContagem(dados?.prazo, dados?.deslocamento);
  const [msg, setMsg] = useState("");
  const [enviando, setEnviando] = useState(false);
  const encerrando = useRef(false);

  // sem todas as respostas não há autoavaliação: volta para as questões
  useEffect(() => {
    if (dados && QUESTOES.some(q => dados.respostas[q.id] === undefined)) router.replace("/avaliacao");
  }, [dados, router]);

  // tempo esgotado: encerra do jeito que estiver
  useEffect(() => {
    if (!id || restante !== 0 || encerrando.current) return;
    encerrando.current = true;
    (async () => {
      for (;;) {
        try {
          await sincronizar(id).catch(() => undefined);
          await (await getBackend()).finalizar(id, true);
          break;
        } catch (e) {
          if (e instanceof ErroNegocio && e.message !== "tempo-nao-esgotado") break;
          await new Promise(r => setTimeout(r, 3000));
        }
      }
      router.replace("/concluido");
    })();
  }, [id, restante, router]);

  if (erro) return <p className="p-8 text-center" role="alert">{erro}</p>;
  if (!sessao || !dados || !id) return <p className="p-8 text-center text-suave" role="status">Carregando…</p>;

  const respondidos = ITENS_AUTO.filter(i => dados.auto[i.id] !== undefined).length;
  const completo = respondidos === ITENS_AUTO.length;

  function escolher(item: string, valor: number) {
    registrarAuto(id!, item, valor).then(r => { if (r.encerrada) router.replace("/concluido"); }).catch(() => undefined);
    sessao!.atualizar();
  }

  async function finalizar() {
    setEnviando(true);
    setMsg("");
    try {
      const r = await sincronizar(id!);
      if (!r.ok && !r.encerrada) { setMsg(mensagemDeErro(new Error("rede"))); return; }
      await (await getBackend()).finalizar(id!, false);
      router.push("/concluido");
    } catch (e) {
      setMsg(mensagemDeErro(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <Cabecalho direita={<Cronometro segundos={restante} />} />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-2xl font-bold">Autoavaliação</h1>
        <p className="mt-2 text-suave">Sem certo nem errado: marque o quanto você acha que domina cada afirmação. Isso ajuda o professor a planejar as aulas.</p>

        <div className="mt-6 space-y-4">
          {ITENS_AUTO.map(item => (
            <fieldset key={item.id} className="cartao p-4 sm:p-5">
              <legend className="px-1 text-lg font-semibold">{item.texto}</legend>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup">
                {ESCALA_AUTO.map(op => {
                  const marcado = dados.auto[item.id] === op.valor;
                  return (
                    <label key={op.valor} className={`flex min-h-14 cursor-pointer flex-col justify-center rounded-xl border-2 px-3 py-2 text-center text-sm has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-marca ${marcado ? "border-marca bg-marca-clara font-semibold text-marca" : "border-linha bg-white"}`}>
                      <input type="radio" name={item.id} value={op.valor} checked={marcado} onChange={() => escolher(item.id, op.valor)} className="sr-only" />
                      <span className="text-lg font-bold">{op.valor}</span>
                      <span>{op.texto}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        {msg && <p role="alert" className="mt-4 rounded-lg bg-alerta-fundo p-3 text-alerta">{msg}</p>}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button className="botao botao-claro" onClick={() => router.push("/avaliacao")}>← Voltar às questões</button>
          <div className="text-right">
            <button className="botao" disabled={!completo || enviando} onClick={finalizar}>{enviando ? "Enviando…" : "Finalizar avaliação"}</button>
            {!completo && <p className="mt-2 text-sm text-suave">Faltam {ITENS_AUTO.length - respondidos} afirmações.</p>}
          </div>
        </div>
        <p className="mt-4 text-sm text-suave">Ao finalizar, não será mais possível alterar as respostas.</p>
      </main>
    </>
  );
}
