"use client";
import { useEffect, useState } from "react";
import { carregarPlacar, type LinhaEvolucao, type LinhaPlacar, type MetaTurma } from "@/lib/nuvem";
import { pt } from "@/lib/formato";
import { Avatar } from "./Avatar";

type Aba = "evolucao" | "pontos";

/** Meta coletiva e placares da semana. Só aparece para quem entrou com código. */
export function PainelTurma({ turma, recarregarEm }: { turma: string; recarregarEm: number }) {
  const [placar, setPlacar] = useState<LinhaPlacar[] | null>(null);
  const [evolucao, setEvolucao] = useState<LinhaEvolucao[] | null>(null);
  const [meta, setMeta] = useState<MetaTurma | null>(null);
  const [aba, setAba] = useState<Aba>("evolucao");

  useEffect(() => {
    let vivo = true;
    const buscar = () => carregarPlacar().then((r) => { if (vivo) { setPlacar(r.placar); setMeta(r.meta); setEvolucao(r.evolucao); } }).catch(() => {});
    buscar();
    const id = setInterval(buscar, 45_000);
    return () => { vivo = false; clearInterval(id); };
  }, [recarregarEm]);

  const pct = meta ? Math.min(100, Math.round((meta.pontos / meta.meta) * 100)) : 0;
  return (
    <aside className="cartao grid gap-4 p-5" aria-label={`Turma ${turma}`}>
      <div>
        <p className="rotulo">Meta da turma · {turma}</p>
        {meta ? (
          <>
            <p className="mt-1 text-2xl font-black">
              {pt(meta.pontos)} <span className="text-base font-bold text-suave">de {pt(meta.meta)} pontos</span>
            </p>
            <div className="mt-2 h-4 overflow-hidden rounded-full bg-linha" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso da meta da turma">
              <div className={"h-full rounded-full transition-[width] duration-700 " + (pct >= 100 ? "bg-ok" : "bg-marca")} style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-sm font-semibold text-suave">
              {pct >= 100 ? "Meta batida! Parabéns, turma." : `${meta.ativos} de ${meta.alunos} já jogaram esta semana. Juntos, a turma chega lá.`}
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm text-suave">Carregando…</p>
        )}
      </div>

      <div>
        <div role="tablist" aria-label="Tipo de placar" className="mb-3 flex gap-2">
          {([["evolucao", "Evolução"], ["pontos", "Pontos"]] as const).map(([k, r]) => (
            <button key={k} type="button" role="tab" aria-selected={aba === k} onClick={() => setAba(k)}
              className={"btn min-h-9 px-4 text-sm " + (aba === k ? "btn-marca" : "btn-suave")}>{r}</button>
          ))}
        </div>
        {aba === "evolucao" ? <Evolucao linhas={evolucao} /> : <Pontos linhas={placar} />}
      </div>
    </aside>
  );
}

function Evolucao({ linhas }: { linhas: LinhaEvolucao[] | null }) {
  if (!linhas) return <p className="text-sm text-suave">Carregando…</p>;
  const eu = linhas.find((l) => l.eu);
  const dias = eu?.dias ?? 0;
  return (
    <div className="grid gap-3">
      <p className="text-sm font-semibold text-suave">Aqui você compete com você mesmo: vale melhorar em relação às suas semanas anteriores.</p>

      {eu ? (
        <div className="rounded-2xl bg-marca-clara p-4">
          <p className="rotulo">Sua nota da semana</p>
          <p className="text-4xl font-black text-marca-escura">{eu.score}<span className="text-lg font-bold text-suave"> /100</span></p>
          <dl className="mt-3 grid gap-2 text-sm font-bold">
            <Parte rotulo="Esforço" valor={`${eu.esforco_pct ?? 0}% da sua média`} pct={Math.min(100, ((eu.esforco_pct ?? 0) / 150) * 100)} />
            <Parte rotulo="Precisão" valor={eu.acerto_delta === null ? "primeira semana" : `${eu.acerto_delta > 0 ? "+" : ""}${eu.acerto_delta} pts de acerto`} pct={eu.acerto_delta === null ? 50 : Math.max(0, Math.min(100, 50 + eu.acerto_delta * 2.5))} />
            <Parte rotulo="Constância" valor={`${dias} de 5 dias`} pct={Math.min(100, (dias / 5) * 100)} />
          </dl>
          <p className="mt-3 text-sm font-bold text-marca-escura">
            {dias < 5 ? "Jogar mais um dia esta semana vale +6 pontos na sua nota." : "Você já fez os 5 dias. Agora é melhorar o acerto!"}
          </p>
        </div>
      ) : (
        <p className="rounded-2xl bg-fundo p-4 text-sm font-bold text-suave">Termine um andar esta semana para ganhar a sua nota de evolução.</p>
      )}

      <ol className="grid gap-1.5">
        {linhas.slice(0, 5).map((l, i) => (
          <li key={i} className={"flex items-center gap-3 rounded-xl px-2 py-1.5 " + (l.eu ? "bg-marca-clara" : "")}>
            <span className="w-5 text-center font-black text-suave">{i + 1}</span>
            <Avatar avatar={l.avatar} tamanho={32} />
            <span className="min-w-0 flex-1 truncate font-bold">{l.apelido}</span>
            <span className="font-black text-marca">{l.score}</span>
          </li>
        ))}
        {eu && linhas.findIndex((l) => l.eu) >= 5 && (
          <li className="mt-1 flex items-center gap-3 rounded-xl bg-marca-clara px-2 py-1.5">
            <span className="w-5 text-center font-black text-suave">{linhas.findIndex((l) => l.eu) + 1}</span>
            <Avatar avatar={eu.avatar} tamanho={32} />
            <span className="min-w-0 flex-1 truncate font-bold">{eu.apelido}</span>
            <span className="font-black text-marca">{eu.score}</span>
          </li>
        )}
      </ol>

      <details className="text-sm text-suave">
        <summary className="cursor-pointer font-black text-tinta">Como a nota é calculada</summary>
        <ul className="mt-2 grid list-disc gap-1 pl-5 font-semibold">
          <li><strong>Esforço (até 50):</strong> seus pontos da semana comparados com a sua média das últimas 4 semanas.</li>
          <li><strong>Precisão (até 20):</strong> quanto o seu acerto melhorou em relação ao que você fazia antes.</li>
          <li><strong>Constância (até 30):</strong> 6 pontos por dia jogado, até 5 dias.</li>
        </ul>
      </details>
    </div>
  );
}

function Parte({ rotulo, valor, pct }: { rotulo: string; valor: string; pct: number }) {
  return (
    <div>
      <div className="flex justify-between"><dt>{rotulo}</dt><dd className="text-suave">{valor}</dd></div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-marca" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function Pontos({ linhas }: { linhas: LinhaPlacar[] | null }) {
  return (
    <>
      {linhas && linhas.length === 0 && <p className="text-sm text-suave">Ninguém pontuou ainda. Termine um andar e abra o placar.</p>}
      <ol className="grid gap-1.5">
        {(linhas ?? []).slice(0, 5).map((l, i) => (
          <li key={i} className={"flex items-center gap-3 rounded-xl px-2 py-1.5 " + (l.eu ? "bg-marca-clara" : "")}>
            <span className="w-5 text-center font-black text-suave">{i + 1}</span>
            <Avatar avatar={l.avatar} tamanho={32} />
            <span className="min-w-0 flex-1 truncate font-bold">{l.apelido}</span>
            <span className="font-black text-ouro">{pt(l.pontos)}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs font-semibold text-suave">O placar de pontos conta até 2.000 por dia: vale a constância, não a maratona.</p>
    </>
  );
}
