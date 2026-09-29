"use client";
import { useEffect, useState } from "react";
import { carregarPlacar, type LinhaPlacar, type MetaTurma } from "@/lib/nuvem";
import { pt } from "@/lib/formato";
import { Avatar } from "./Avatar";

/** Meta coletiva e placar da semana. Só aparece para quem entrou com código. */
export function PainelTurma({ turma, recarregarEm }: { turma: string; recarregarEm: number }) {
  const [placar, setPlacar] = useState<LinhaPlacar[] | null>(null);
  const [meta, setMeta] = useState<MetaTurma | null>(null);

  useEffect(() => {
    let vivo = true;
    const buscar = () => carregarPlacar().then((r) => { if (vivo) { setPlacar(r.placar); setMeta(r.meta); } }).catch(() => {});
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
        <p className="rotulo">Placar da semana</p>
        {placar && placar.length === 0 && <p className="mt-2 text-sm text-suave">Ninguém pontuou ainda. Termine um andar e abra o placar.</p>}
        <ol className="mt-2 grid gap-1.5">
          {(placar ?? []).slice(0, 5).map((l, i) => (
            <li key={i} className={"flex items-center gap-3 rounded-xl px-2 py-1.5 " + (l.eu ? "bg-marca-clara" : "")}>
              <span className="w-5 text-center font-black text-suave">{i + 1}</span>
              <Avatar avatar={l.avatar} tamanho={32} />
              <span className="min-w-0 flex-1 truncate font-bold">{l.apelido}</span>
              <span className="font-black text-ouro">{pt(l.pontos)}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs font-semibold text-suave">O placar conta até 2.000 pontos por dia: vale a constância, não a maratona.</p>
      </div>
    </aside>
  );
}
