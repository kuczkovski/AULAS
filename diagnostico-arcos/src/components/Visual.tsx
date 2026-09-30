import type { ReactNode } from "react";
import { NIVEIS, nivelDe } from "@/dominio/pontuacao";
import { formatarPct } from "@/lib/analise";

const CURTO = { consolidado: "Consolidado", funcional: "Funcional", fragil: "Frágil", recomposicao: "Recompor" } as const;

/** Célula de percentual colorida pela régua diagnóstica; o nível também aparece escrito. */
export function CelulaPct({ valor, mostrarNivel = true }: { valor: number | null; mostrarNivel?: boolean }) {
  if (valor === null) return <span className="text-suave">—</span>;
  const n = nivelDe(valor);
  return (
    <span className={`inline-flex min-w-24 flex-col items-center rounded-md px-2 py-1 leading-tight n-${n}`} title={NIVEIS[n].rotulo}>
      <span className="font-bold tabular-nums">{formatarPct(valor)}</span>
      {mostrarNivel && <span className="text-xs">{CURTO[n]}</span>}
    </span>
  );
}

export function Kpi({ rotulo, valor, detalhe }: { rotulo: string; valor: ReactNode; detalhe?: string }) {
  return (
    <div className="cartao p-4">
      <p className="text-sm text-suave">{rotulo}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{valor}</p>
      {detalhe && <p className="mt-1 text-xs text-suave">{detalhe}</p>}
    </div>
  );
}

export function BarraPct({ valor }: { valor: number | null }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-linha" role="img" aria-label={formatarPct(valor)}>
      <div className="h-full bg-marca" style={{ width: `${valor ?? 0}%` }} />
    </div>
  );
}

export function Titulo({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-3 mt-8 first:mt-0">
      <h2 className="text-xl font-bold">{children}</h2>
      {sub && <p className="text-sm text-suave">{sub}</p>}
    </div>
  );
}

export const Tabela = ({ children }: { children: ReactNode }) => (
  <div className="cartao overflow-x-auto"><table className="w-full border-collapse text-left text-sm [&_td]:border-t [&_td]:border-linha [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_th]:text-suave">{children}</table></div>
);
