"use client";
import { usePainel } from "@/components/ContextoProfessor";
import { BarraPct, CelulaPct, Tabela, Titulo } from "@/components/Visual";
import { DIMS, DIMENSOES, ESCALA_AUTO, QUESTOES_POR_DIM } from "@/dominio/questoes";
import { NIVEIS, type Nivel } from "@/dominio/pontuacao";
import { autoVsRealPorItem, distribuicaoNiveis, formatarPct, mediaPorDimensao } from "@/lib/analise";

const ORDEM: Nivel[] = ["consolidado", "funcional", "fragil", "recomposicao"];

export default function Habilidades() {
  const { alunos } = usePainel();
  const medias = mediaPorDimensao(alunos);
  const itens = autoVsRealPorItem(alunos);

  return (
    <>
      <Titulo sub="Quantos alunos estão em cada faixa da régua diagnóstica, por habilidade.">Habilidades</Titulo>
      <div className="grid gap-3 md:grid-cols-2">
        {DIMS.map(d => {
          const dist = distribuicaoNiveis(alunos, d);
          return (
            <section key={d} className="cartao p-4">
              <p className="font-semibold">{d} · {DIMENSOES[d].nome}</p>
              <p className="text-xs text-suave">Questões {QUESTOES_POR_DIM[d].join(", ")}</p>
              <div className="mt-2 flex items-center gap-3"><CelulaPct valor={medias[d]} /><div className="flex-1"><BarraPct valor={medias[d]} /></div></div>
              <ul className="mt-3 grid grid-cols-2 gap-1 text-sm">
                {ORDEM.map(n => <li key={n} className={`rounded px-2 py-1 n-${n}`}>{NIVEIS[n].rotulo} <strong>{dist[n]}</strong></li>)}
              </ul>
              {d === "D4" && <p className="mt-2 text-xs text-suave">Q16–Q18 são pré-requisito; Q19–Q20 antecipam o conteúdo novo (resultado baixo nelas indica o ponto de partida).</p>}
            </section>
          );
        })}
      </div>

      <Titulo sub="Cada célula mostra a faixa da régua; a cor nunca é o único sinal.">Matriz aluno × habilidade</Titulo>
      {alunos.length === 0 ? <p className="cartao p-6 text-suave">Sem alunos para mostrar.</p> : (
        <Tabela>
          <thead><tr><th>Aluno</th><th>Turma</th>{DIMS.map(d => <th key={d}>{d}</th>)}</tr></thead>
          <tbody>
            {alunos.map(a => (
              <tr key={a.id}>
                <th scope="row" className="!text-tinta">{a.nome}</th>
                <td>{a.turma}</td>
                {DIMS.map(d => <td key={d}><CelulaPct valor={a.dim[d].pct} /></td>)}
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}

      <Titulo sub="Média da turma: o que os alunos dizem saber (escala 1 a 4 convertida em %) × acerto nas questões ligadas à afirmação.">Autoavaliação × desempenho real</Titulo>
      <Tabela>
        <thead><tr><th>Afirmação</th><th>Autoavaliação</th><th>Desempenho real</th><th>Diferença</th></tr></thead>
        <tbody>
          {itens.map(i => {
            const dif = i.autoPct !== null && i.realPct !== null ? i.autoPct - i.realPct : null;
            return (
              <tr key={i.id}>
                <th scope="row" className="!text-tinta">{i.texto}</th>
                <td>{formatarPct(i.autoPct)}</td>
                <td>{formatarPct(i.realPct)}</td>
                <td>{dif === null ? "—" : Math.abs(dif) < 15 ? "Coerente" : dif > 0 ? `Superestima (+${Math.round(dif)})` : `Subestima (${Math.round(dif)})`}</td>
              </tr>
            );
          })}
        </tbody>
      </Tabela>
      <p className="mt-2 text-xs text-suave">Escala: {ESCALA_AUTO.map(e => `${e.valor} = ${e.texto.toLowerCase()}`).join("; ")}.</p>
    </>
  );
}
