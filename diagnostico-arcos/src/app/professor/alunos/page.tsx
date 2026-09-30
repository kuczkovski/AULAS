"use client";
import { Fragment, useMemo, useState } from "react";
import { usePainel } from "@/components/ContextoProfessor";
import { CelulaPct, Tabela, Titulo } from "@/components/Visual";
import { DIMS, ESCALA_AUTO, ITENS_AUTO, QUESTOES } from "@/dominio/questoes";
import { chaveNome, formatarDuracao, formatarPct, type AlunoAnalise } from "@/lib/analise";
import { baixarCsv, linhasParaCsv } from "@/lib/csv";
import { apagarTentativas } from "@/lib/professor";

const STATUS = { concluida: "Concluída", encerrada_por_tempo: "Encerrada por tempo", em_andamento: "Em andamento" } as const;
const PERFIL = { superestima: "Superestima", subestima: "Subestima", coerente: "Coerente" } as const;

export default function Alunos() {
  const { alunos, turma, gabarito, recarregar } = usePainel();
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  const lista = useMemo(() => {
    const b = chaveNome(busca);
    return b ? alunos.filter(a => chaveNome(a.nome).includes(b)) : alunos;
  }, [alunos, busca]);

  function exportar() {
    baixarCsv(`diagnostico-${turma === "todas" ? "todas-turmas" : turma.replace(/\W+/g, "")}.csv`, linhasParaCsv([
      ["Nome", "Turma", "Situação", "Tempo (s)", "Acertos", "Acerto geral (%)", ...DIMS.map(d => `${d} (%)`), "Autoavaliação (%)", "Percepção", "Tentativas"],
      ...lista.map(a => [
        a.nome, a.turma, STATUS[a.status], a.duracao, a.acertosGeral, Math.round(a.pctGeral),
        ...DIMS.map(d => Math.round(a.dim[d].pct)), a.autoPct === null ? "" : Math.round(a.autoPct),
        a.perfilAuto ? PERFIL[a.perfilAuto] : "", a.nTentativas,
      ]),
    ]));
  }

  async function apagar(a: AlunoAnalise) {
    if (!window.confirm(`Apagar a tentativa de ${a.nome} (${a.turma})? Isso remove as respostas e não pode ser desfeito.`)) return;
    try { await apagarTentativas([a.id]); setAberto(null); await recarregar(); }
    catch { setErro("Não foi possível apagar agora."); }
  }

  return (
    <>
      <Titulo sub="Uma linha por aluno (tentativa finalizada mais recente). Clique no nome para ver as respostas.">Alunos</Titulo>
      <div className="nao-imprimir mb-3 flex flex-wrap items-end justify-between gap-3">
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-suave">Buscar aluno</span>
          <input className="campo !min-h-11 sm:w-72" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Nome" />
        </label>
        <button className="botao botao-claro !min-h-11 !px-4" onClick={exportar} disabled={lista.length === 0}>Exportar CSV</button>
      </div>
      {erro && <p role="alert" className="mb-3 rounded-lg bg-alerta-fundo p-3 text-alerta">{erro}</p>}
      {lista.length === 0 ? <p className="cartao p-6 text-suave">Nenhum aluno encontrado.</p> : (
        <Tabela>
          <thead>
            <tr><th>Aluno</th><th>Turma</th>{DIMS.map(d => <th key={d}>{d}</th>)}<th>Geral</th><th>Percepção</th></tr>
          </thead>
          <tbody>
            {lista.map(a => (
              <Fragment key={a.id}>
                <tr>
                  <th scope="row" className="!text-tinta">
                    <button className="text-left font-semibold text-marca underline-offset-2 hover:underline" aria-expanded={aberto === a.id}
                      onClick={() => setAberto(aberto === a.id ? null : a.id)}>{a.nome}</button>
                    {a.nTentativas > 1 && <span className="ml-2 rounded bg-aten-fundo px-1.5 py-0.5 text-xs font-normal text-aten">{a.nTentativas} tentativas</span>}
                    {a.status === "encerrada_por_tempo" && <span className="ml-2 rounded bg-linha px-1.5 py-0.5 text-xs font-normal text-suave">tempo</span>}
                  </th>
                  <td>{a.turma}</td>
                  {DIMS.map(d => <td key={d}><CelulaPct valor={a.dim[d].pct} mostrarNivel={false} /></td>)}
                  <td className="font-semibold tabular-nums">{formatarPct(a.pctGeral)}</td>
                  <td>{a.perfilAuto ? PERFIL[a.perfilAuto] : "—"}</td>
                </tr>
                {aberto === a.id && (
                  <tr><td colSpan={8} className="bg-fundo !p-4"><Detalhe a={a} gabarito={gabarito} onApagar={() => apagar(a)} /></td></tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </Tabela>
      )}
    </>
  );
}

function Detalhe({ a, gabarito, onApagar }: { a: AlunoAnalise; gabarito: Record<string, string>; onApagar: () => void }) {
  const sufixo = (id: string, v: string | undefined) => (v !== undefined && QUESTOES.find(q => q.id === id)?.tipo === "numerica" ? `${v}°` : v);
  return (
    <div className="space-y-4 text-sm">
      <p className="text-suave">{STATUS[a.status]} · tempo {formatarDuracao(a.duracao)} · {a.acertosGeral} de {QUESTOES.length} questões certas</p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead><tr className="text-suave"><th className="py-1 pr-3">Questão</th><th className="pr-3">Enunciado</th><th className="pr-3">Resposta do aluno</th><th className="pr-3">Correta</th><th>Resultado</th></tr></thead>
          <tbody>
            {QUESTOES.map(q => {
              const r = a.acertou[q.id];
              return (
                <tr key={q.id} className="border-t border-linha align-top">
                  <td className="py-1 pr-3 font-semibold">{q.id}</td>
                  <td className="pr-3">{q.enunciado}</td>
                  <td className="pr-3">{sufixo(q.id, a.respostas[q.id]) ?? "—"}</td>
                  <td className="pr-3">{sufixo(q.id, gabarito[q.id]) ?? "—"}</td>
                  <td><span className={`rounded px-1.5 py-0.5 font-semibold ${r === true ? "n-consolidado" : r === false ? "n-recomposicao" : "bg-linha text-suave"}`}>{r === true ? "Acertou" : r === false ? "Errou" : "Sem resposta"}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div>
        <p className="font-semibold">Autoavaliação</p>
        {Object.keys(a.auto).length === 0 ? <p className="text-suave">Não respondeu.</p> : (
          <ul className="mt-1 grid gap-x-6 sm:grid-cols-2">
            {ITENS_AUTO.map(i => <li key={i.id}>{i.texto} <strong>{a.auto[i.id] ?? "—"}</strong>{a.auto[i.id] ? ` (${ESCALA_AUTO[a.auto[i.id]! - 1]!.texto})` : ""}</li>)}
          </ul>
        )}
      </div>
      <button className="nao-imprimir rounded-lg border border-alerta px-3 py-2 font-semibold text-alerta hover:bg-alerta-fundo" onClick={onApagar}>Apagar esta tentativa</button>
    </div>
  );
}
