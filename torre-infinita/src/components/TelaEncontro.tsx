"use client";
import type { Rodada } from "@/engine/rodada";
import { infoZona } from "@/engine/zonas";
import { EnergiaChefe, RetratoChefe } from "./Chefe";

/** Cena antes da luta: o chefe da zona aparece, fala e explica as regras. */
export function TelaEncontro({ rodada, andar, primeiroContato, aoEnfrentar, aoVoltar }: {
  rodada: Rodada;
  andar: number;
  /** Ainda não derrotou este chefe. */
  primeiroContato: boolean;
  aoEnfrentar: () => void;
  aoVoltar: () => void;
}) {
  const z = infoZona(rodada.zona);
  return (
    <main className="mx-auto grid min-h-dvh max-w-xl content-center gap-5 px-4 py-8">
      <section className="cartao anim-entra overflow-hidden text-center" aria-labelledby="chefe-nome" style={{ borderColor: z.cor }}>
        <div className="px-6 pb-4 pt-8" style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${z.cor} 22%, white), white)` }}>
          <p className="rotulo" style={{ color: z.cor }}>Andar {andar} · Zona {rodada.zona}</p>
          <div className="mx-auto my-3 w-fit anim-pulo"><RetratoChefe zona={rodada.zona} tamanho={140} /></div>
          <h1 id="chefe-nome" className="text-3xl font-black">{rodada.chefe}</h1>
          <p className="mx-auto mt-3 max-w-sm rounded-2xl border-2 bg-white px-4 py-3 text-lg font-bold italic" style={{ borderColor: z.cor }}>
            “{z.chefe.fala}”
          </p>
        </div>
        <div className="grid gap-4 px-6 pb-7 pt-4">
          <div>
            <p className="rotulo mb-1 text-left">Energia do chefe</p>
            <EnergiaChefe energia={rodada.energia} max={rodada.energiaMax} />
          </div>
          <ul className="grid gap-1 text-left text-base font-semibold text-suave">
            <li>Cada acerto tira <strong className="text-tinta">1</strong> de energia. Cada erro devolve <strong className="text-tinta">meia</strong>.</li>
            <li>Você tem <strong className="text-tinta">{rodada.vidasMax} vidas</strong>. Zerou a energia, o chefe cai.</li>
            <li>As perguntas são todas de <strong className="text-tinta">{rodada.zona}</strong>. Pontos ×1,5!</li>
            {primeiroContato ? <li>Vencer pela primeira vez dá o <strong className="text-tinta">troféu da zona</strong>.</li> : <li>Você já venceu este chefe. Isto é uma revanche.</li>}
          </ul>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" className="btn btn-marca btn-grande" autoFocus onClick={aoEnfrentar}>Enfrentar</button>
            <button type="button" className="btn btn-fantasma" onClick={aoVoltar}>Ainda não</button>
          </div>
        </div>
      </section>
    </main>
  );
}
