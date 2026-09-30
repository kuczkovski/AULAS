"use client";
import { usePainel } from "@/components/ContextoProfessor";
import { CelulaPct, Tabela, Titulo } from "@/components/Visual";
import { DIMS, DIMENSOES } from "@/dominio/questoes";
import { contagemTurma, formatarDuracao, resumoPorTurma } from "@/lib/analise";

export default function Turmas() {
  const { base } = usePainel();
  const linhas = resumoPorTurma(base.alunos);
  return (
    <>
      <Titulo sub="Média por habilidade entre os alunos que finalizaram. Esta tela sempre mostra todas as turmas.">Comparação entre turmas</Titulo>
      <Tabela>
        <thead>
          <tr>
            <th>Turma</th><th>Iniciaram</th><th>Concluíram</th>
            {DIMS.map(d => <th key={d} title={DIMENSOES[d].nome}>{d}</th>)}
            <th>Geral</th><th>Tempo médio</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map(l => {
            const c = contagemTurma(base, l.turma);
            return (
              <tr key={l.turma}>
                <th scope="row" className="!text-tinta">{l.turma}</th>
                <td>{c.iniciaram}</td><td>{c.concluiram}</td>
                {DIMS.map(d => <td key={d}><CelulaPct valor={l.dim[d]} /></td>)}
                <td><CelulaPct valor={l.geral} mostrarNivel={false} /></td>
                <td>{formatarDuracao(l.tempo)}</td>
              </tr>
            );
          })}
        </tbody>
      </Tabela>
      <ul className="mt-4 grid gap-1 text-sm text-suave sm:grid-cols-2">
        {DIMS.map(d => <li key={d}><strong>{d}</strong> — {DIMENSOES[d].nome}</li>)}
      </ul>
    </>
  );
}
