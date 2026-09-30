import type { ReactNode } from "react";

export function Cabecalho({ direita }: { direita?: ReactNode }) {
  return (
    <header className="border-b border-linha bg-papel">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
        <p className="text-sm font-semibold leading-tight text-suave">
          Avaliação diagnóstica <span className="hidden sm:inline">· Arcos e ângulos na circunferência</span>
        </p>
        {direita}
      </div>
    </header>
  );
}

export function Cronometro({ segundos }: { segundos: number | null }) {
  if (segundos === null) return null;
  const m = Math.floor(segundos / 60);
  const s = String(segundos % 60).padStart(2, "0");
  const pouco = segundos <= 300;
  return (
    <p role="timer" aria-label={`Tempo restante: ${m} minutos e ${s} segundos`}
      className={`rounded-lg px-3 py-1 text-lg font-bold tabular-nums ${pouco ? "bg-alerta-fundo text-alerta" : "bg-marca-clara text-marca"}`}>
      {String(m).padStart(2, "0")}:{s}
    </p>
  );
}
