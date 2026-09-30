"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Cabecalho, Cronometro } from "@/components/Cabecalho";
import { FiguraQuestao } from "@/components/Figura";
import { useContagem } from "@/components/useContagem";
import { useTentativa } from "@/components/useTentativa";
import { DIMENSOES, QUESTOES, TOTAL_QUESTOES } from "@/dominio/questoes";
import { normalizarNumero } from "@/dominio/pontuacao";
import { getBackend } from "@/lib/backend";
import { lerDados, registrarResposta, sincronizar, type ResultadoSync } from "@/lib/sessao";
import { ErroNegocio } from "@/lib/tipos";

type Sync = "ok" | "salvando" | "sem-conexao";

export default function Avaliacao() {
  const router = useRouter();
  const { sessao, erro, offline } = useTentativa();
  const id = sessao?.id;
  const dados = sessao?.dados;
  const restante = useContagem(dados?.prazo, dados?.deslocamento);

  const [idx, setIdx] = useState<number | null>(null);
  const [rascunho, setRascunho] = useState("");
  const [sync, setSync] = useState<Sync>("ok");
  const [faltam, setFaltam] = useState<string[]>([]);
  const encerrando = useRef(false);

  // posição inicial: a primeira questão sem resposta (ou a última salva neste aparelho)
  useEffect(() => {
    if (!id || !dados || idx !== null) return;
    let salvo: number | null = null;
    try { salvo = Number(localStorage.getItem(`diag:idx:${id}`)); } catch { /* sem armazenamento */ }
    const primeiraVazia = QUESTOES.findIndex(q => dados.respostas[q.id] === undefined);
    const inicial = salvo !== null && Number.isInteger(salvo) && salvo >= 0 && salvo < TOTAL_QUESTOES ? salvo : Math.max(primeiraVazia, 0);
    setIdx(inicial);
    setRascunho(dados.respostas[QUESTOES[inicial]!.id] ?? "");
  }, [id, dados, idx]);

  const aplicar = useCallback((r: ResultadoSync) => {
    setSync(r.ok ? "ok" : r.falhaRede ? "sem-conexao" : "salvando");
    if (r.encerrada) router.replace("/concluido");
  }, [router]);

  // reenvio automático: ao voltar a conexão e a cada poucos segundos se houver pendências
  useEffect(() => {
    if (!id) return;
    const tentar = () => { if (lerDados(id)?.pendResp.length) sincronizar(id).then(aplicar).catch(() => setSync("sem-conexao")); };
    const t = setInterval(tentar, 8000);
    window.addEventListener("online", tentar);
    return () => { clearInterval(t); window.removeEventListener("online", tentar); };
  }, [id, aplicar]);

  // tempo esgotado: envia o que falta e encerra a tentativa
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

  if (erro) return <Mensagem texto={erro} />;
  if (!sessao || !dados || !id || idx === null) return <Mensagem texto="Carregando…" />;

  const q = QUESTOES[idx]!;
  const salva = dados.respostas[q.id];
  const respondidas = QUESTOES.filter(x => dados.respostas[x.id] !== undefined).length;
  const numerico = q.tipo === "numerica";
  const rascunhoNorm = numerico ? normalizarNumero(rascunho) : null;
  const rascunhoInvalido = numerico && rascunho.trim() !== "" && rascunhoNorm === null;
  const atualRespondida = numerico ? rascunhoNorm !== null || salva !== undefined && rascunho === salva : salva !== undefined;

  const gravar = (questao: string, valor: string) => {
    setSync("salvando");
    const p = registrarResposta(id, questao, valor);
    sessao.atualizar();
    p.then(aplicar).catch(() => setSync("sem-conexao"));
  };

  /** Numérica: grava o rascunho se mudou e é válido. */
  const confirmarRascunho = () => {
    if (numerico && rascunhoNorm !== null && rascunhoNorm !== salva) gravar(q.id, rascunhoNorm);
  };

  const irPara = (novo: number) => {
    confirmarRascunho();
    const prox = QUESTOES[novo]!;
    const valor = prox.id === q.id ? rascunho : (lerDados(id)?.respostas[prox.id] ?? "");
    setIdx(novo);
    setRascunho(valor);
    setFaltam([]);
    try { localStorage.setItem(`diag:idx:${id}`, String(novo)); } catch { /* sem armazenamento */ }
  };

  const avancar = () => {
    if (!atualRespondida) return;
    confirmarRascunho();
    if (idx < TOTAL_QUESTOES - 1) return irPara(idx + 1);
    const atual = lerDados(id)!;
    const vazias = QUESTOES.filter(x => x.id !== q.id && atual.respostas[x.id] === undefined).map(x => x.id);
    if (vazias.length) return setFaltam(vazias);
    // garante que tudo foi enviado antes de passar à autoavaliação
    setSync("salvando");
    sincronizar(id).then(r => { aplicar(r); if (!r.encerrada) router.push("/autoavaliacao"); }).catch(() => router.push("/autoavaliacao"));
  };

  return (
    <>
      <Cabecalho direita={<Cronometro segundos={restante} />} />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex items-center justify-between gap-4 text-sm font-semibold text-suave">
          <p>{DIMENSOES[q.dim].bloco}</p>
          <p aria-live="polite" className={sync === "sem-conexao" ? "text-alerta" : ""}>
            {sync === "ok" ? "Resposta salva" : sync === "salvando" ? "Salvando…" : "Sem conexão: respostas guardadas neste aparelho"}
          </p>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <p className="shrink-0 text-xl font-bold">Questão {idx + 1} de {TOTAL_QUESTOES}</p>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-linha" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL_QUESTOES} aria-valuenow={respondidas} aria-label="Questões respondidas">
            <div className="h-full bg-marca transition-all" style={{ width: `${(100 * respondidas) / TOTAL_QUESTOES}%` }} />
          </div>
        </div>
        {offline && <p role="status" className="mt-3 rounded-lg bg-aten-fundo p-3 text-aten">Não foi possível falar com o servidor agora. Você pode continuar: as respostas ficam guardadas e são enviadas quando a conexão voltar.</p>}

        <section className="cartao mt-5 p-5 sm:p-8" aria-labelledby="enunciado">
          <div className={figuraLayout(q.figura !== undefined)}>
            <div className="flex-1">
              <h1 id="enunciado" className="text-2xl font-semibold leading-snug">{q.enunciado}</h1>
              {numerico ? (
                <div className="mt-6">
                  <label htmlFor="resp" className="mb-2 block text-base font-semibold text-suave">Sua resposta, em graus</label>
                  <div className="flex items-center gap-3">
                    <input id="resp" className="campo max-w-40 text-center text-2xl font-bold" inputMode="decimal" autoComplete="off"
                      value={rascunho} maxLength={9} aria-invalid={rascunhoInvalido}
                      aria-describedby={rascunhoInvalido ? "resp-erro" : undefined}
                      onChange={e => setRascunho(e.target.value)} onBlur={confirmarRascunho}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); avancar(); } }} />
                    <span className="text-2xl font-bold" aria-hidden>°</span>
                  </div>
                  {rascunhoInvalido && <p id="resp-erro" role="alert" className="mt-2 text-alerta">Digite apenas um número, por exemplo 90.</p>}
                </div>
              ) : (
                <div className="mt-6 space-y-3" role="radiogroup" aria-labelledby="enunciado">
                  {q.opcoes!.map(op => (
                    <label key={op} className={`flex min-h-14 cursor-pointer items-center gap-4 rounded-xl border-2 px-4 py-3 text-xl has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-marca ${salva === op ? "border-marca bg-marca-clara font-semibold" : "border-linha bg-white hover:border-suave"}`}>
                      <input type="radio" name={q.id} value={op} checked={salva === op} onChange={() => gravar(q.id, op)} className="size-5 accent-marca" />
                      {op}
                    </label>
                  ))}
                </div>
              )}
            </div>
            {q.figura && <FiguraQuestao figura={q.figura} />}
          </div>
        </section>

        {faltam.length > 0 && (
          <p role="alert" className="mt-4 rounded-lg bg-aten-fundo p-3 text-aten">
            Ainda faltam respostas nas questões: {faltam.map(f => f.slice(1)).join(", ")}. Use os números abaixo para voltar a elas.
          </p>
        )}

        <nav className="mt-6 flex items-center justify-between gap-3" aria-label="Navegação entre questões">
          <button className="botao botao-claro" disabled={idx === 0} onClick={() => irPara(idx - 1)}>← Anterior</button>
          <button className="botao" disabled={!atualRespondida} onClick={avancar}>
            {idx === TOTAL_QUESTOES - 1 ? "Ir para a autoavaliação →" : "Próxima →"}
          </button>
        </nav>
        {!atualRespondida && <p className="mt-2 text-right text-sm text-suave">Responda para avançar. Você pode voltar e mudar respostas antes de terminar.</p>}

        <ol className="mt-8 flex flex-wrap gap-2" aria-label="Ir para a questão">
          {QUESTOES.map((x, i) => {
            const feita = dados.respostas[x.id] !== undefined;
            return (
              <li key={x.id}>
                <button onClick={() => irPara(i)} aria-current={i === idx ? "step" : undefined}
                  aria-label={`Questão ${i + 1}${feita ? ", respondida" : ", sem resposta"}`}
                  className={`size-11 rounded-lg border-2 font-semibold ${i === idx ? "border-marca bg-marca text-white" : feita ? "border-marca bg-marca-clara text-marca" : "border-linha bg-white text-suave"}`}>
                  {i + 1}
                </button>
              </li>
            );
          })}
        </ol>
      </main>
    </>
  );
}

const figuraLayout = (comFigura: boolean) => (comFigura ? "flex flex-col-reverse gap-6 sm:flex-row sm:items-center" : "flex");

function Mensagem({ texto }: { texto: string }) {
  return (
    <>
      <Cabecalho />
      <main className="mx-auto max-w-2xl px-4 py-16 text-center text-lg text-suave" role="status">{texto}</main>
    </>
  );
}
