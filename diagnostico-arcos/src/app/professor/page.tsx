"use client";
import { usePainel } from "@/components/ContextoProfessor";
import { BarraPct, CelulaPct, Kpi, Titulo } from "@/components/Visual";
import { DIMS, DIMENSOES, QUESTAO_POR_ID } from "@/dominio/questoes";
import {
  analisePorQuestao, contagemPerfilAuto, contagemTurma, formatarDuracao, formatarPct, leituraPedagogica, mediaGeral,
  mediaPorDimensao, tempoMedioSegundos,
} from "@/lib/analise";

const TOM = { ok: "bg-ok-fundo text-ok", atencao: "bg-aten-fundo text-aten", alerta: "bg-alerta-fundo text-alerta" } as const;

export default function VisaoGeral() {
  const { base, alunos, turma } = usePainel();
  const c = contagemTurma(base, turma);
  const medias = mediaPorDimensao(alunos);
  const leitura = leituraPedagogica(medias);
  const piores = analisePorQuestao(alunos).filter(q => q.acerto !== null).sort((a, b) => a.acerto! - b.acerto!).slice(0, 5);
  const perfil = contagemPerfilAuto(alunos);
  const repetidos = base.repetidos.filter(r => turma === "todas" || r.turma === turma);

  if (c.iniciaram === 0) return <p className="cartao p-6 text-suave">Nenhum aluno iniciou a avaliação{turma === "todas" ? "" : ` na turma ${turma}`} ainda.</p>;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi rotulo="Iniciaram" valor={c.iniciaram} detalhe={c.emAndamento ? `${c.emAndamento} ainda em andamento` : undefined} />
        <Kpi rotulo="Concluíram" valor={c.concluiram} detalhe="inclui encerradas por tempo" />
        <Kpi rotulo="Tempo médio" valor={formatarDuracao(tempoMedioSegundos(alunos))} />
        <Kpi rotulo="Acerto geral" valor={formatarPct(mediaGeral(alunos))} detalhe="não é nota: leia por habilidade" />
      </div>

      {leitura && (
        <div className={`mt-6 rounded-xl p-4 ${TOM[leitura.tom]}`} role="note">
          <p className="font-bold">{leitura.titulo}</p>
          <p className="mt-1 text-sm">{leitura.texto}</p>
        </div>
      )}

      <Titulo sub="Média dos alunos que finalizaram. D4 inclui Q19 e Q20, que antecipam conteúdo novo: resultado baixo nelas é ponto de partida, não deficiência.">Desempenho por habilidade</Titulo>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DIMS.map(d => (
          <div key={d} className="cartao p-4">
            <p className="text-sm font-semibold text-suave">{d} · {DIMENSOES[d].nome}</p>
            <div className="mt-2"><CelulaPct valor={medias[d]} /></div>
            <div className="mt-3"><BarraPct valor={medias[d]} /></div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <Titulo sub="Menores taxas de acerto, sem resposta contando como erro.">Questões com mais erros</Titulo>
          <ol className="cartao divide-y divide-linha">
            {piores.map(q => (
              <li key={q.id} className="flex items-center gap-3 p-3 text-sm">
                <span className="w-10 font-bold">{q.id}</span>
                <span className="flex-1">{QUESTAO_POR_ID[q.id]!.enunciado.slice(0, 80)}{QUESTAO_POR_ID[q.id]!.enunciado.length > 80 ? "…" : ""}</span>
                <CelulaPct valor={q.acerto} mostrarNivel={false} />
              </li>
            ))}
          </ol>
        </section>
        <section>
          <Titulo sub="Compara o que o aluno disse saber com o que acertou nas questões ligadas a cada afirmação.">Percepção × desempenho</Titulo>
          <div className="grid grid-cols-3 gap-3">
            <Kpi rotulo="Coerente" valor={perfil.coerente} />
            <Kpi rotulo="Superestima" valor={perfil.superestima} detalhe="acha que sabe mais" />
            <Kpi rotulo="Subestima" valor={perfil.subestima} detalhe="sabe mais do que diz" />
          </div>
        </section>
      </div>

      {repetidos.length > 0 && (
        <>
          <Titulo sub="Mesmo nome e turma com mais de uma tentativa. Nada foi apagado; a análise usa a finalizada mais recente.">Atenção: tentativas repetidas</Titulo>
          <ul className="cartao divide-y divide-linha text-sm">
            {repetidos.map(r => <li key={r.nome + r.turma} className="p-3">{r.nome} · {r.turma} · {r.n} tentativas</li>)}
          </ul>
        </>
      )}
    </>
  );
}
