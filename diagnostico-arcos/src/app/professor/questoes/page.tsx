"use client";
import { useMemo, useState } from "react";
import { usePainel } from "@/components/ContextoProfessor";
import { CelulaPct, Tabela, Titulo } from "@/components/Visual";
import { QUESTAO_POR_ID, TURMAS } from "@/dominio/questoes";
import { analisePorQuestao } from "@/lib/analise";

export default function Questoes() {
  const { base, alunos, gabarito } = usePainel();
  const [porErro, setPorErro] = useState(false);
  const linhas = useMemo(() => {
    // a taxa por turma sempre usa todas as turmas; só o "Acerto" respeita o filtro
    const todas = analisePorQuestao(base.alunos);
    const l = analisePorQuestao(alunos).map((q, i) => ({ ...q, porTurma: todas[i]!.porTurma }));
    return porErro ? [...l].sort((a, b) => (a.acerto ?? 101) - (b.acerto ?? 101)) : l;
  }, [base, alunos, porErro]);

  return (
    <>
      <Titulo sub="Percentual de acerto por questão, geral e por turma. A resposta errada mais comum ajuda a separar erro de cálculo, de vocabulário e de interpretação.">Análise por questão</Titulo>
      <label className="nao-imprimir mb-3 inline-flex items-center gap-2">
        <input type="checkbox" className="size-5 accent-marca" checked={porErro} onChange={e => setPorErro(e.target.checked)} />
        Ordenar pelas questões com mais erros
      </label>
      <Tabela>
        <thead>
          <tr><th>Questão</th><th>Hab.</th><th>Acerto</th>{TURMAS.map(t => <th key={t}>{t}</th>)}<th>Sem resposta</th><th>Erro mais comum</th></tr>
        </thead>
        <tbody>
          {linhas.map(l => {
            const q = QUESTAO_POR_ID[l.id]!;
            const num = q.tipo === "numerica";
            return (
              <tr key={l.id} className="align-top">
                <th scope="row" className="!text-tinta">
                  <span title={q.enunciado} className="cursor-help underline decoration-dotted">{l.id}</span>
                  <span className="mt-1 block max-w-56 text-xs font-normal text-suave">{q.enunciado.slice(0, 70)}{q.enunciado.length > 70 ? "…" : ""}</span>
                </th>
                <td>{l.dim}</td>
                <td><CelulaPct valor={l.acerto} mostrarNivel={false} /></td>
                {TURMAS.map(t => <td key={t}><CelulaPct valor={l.porTurma[t] ?? null} mostrarNivel={false} /></td>)}
                <td>{l.semResposta}</td>
                <td>{l.erroComum ? <>{l.erroComum.resposta}{num ? "°" : ""} <span className="text-suave">({l.erroComum.n}×; certa: {gabarito[l.id]}{num ? "°" : ""})</span></> : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </Tabela>
    </>
  );
}
