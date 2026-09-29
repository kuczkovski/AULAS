import { IconAlert } from "./icons";

/** Aviso fixo: o aplicativo não substitui avaliação de profissional de saúde. */
export function HealthNotice({ emphasis = false }: { emphasis?: boolean }) {
  return (
    <div
      role="note"
      className={`flex gap-3 rounded-[var(--radius-card)] border p-4 text-sm ${emphasis ? "border-warn bg-warn-soft" : "border-line bg-surface"}`}
    >
      <IconAlert className="mt-0.5 shrink-0 text-warn" size={20} />
      <div className="space-y-1">
        <p className="font-semibold">Procure avaliação profissional</p>
        <p className="text-muted">
          Em caso de dor persistente, dor que se espalha (irradiada) ou piora dos sintomas, interrompa a atividade e procure
          um médico ou fisioterapeuta. Este aplicativo não indica exercícios como seguros para condições de saúde específicas.
        </p>
      </div>
    </div>
  );
}
