import { IconDown, IconEqual, IconUp } from "../icons";
import { LOAD_DECISION_LABELS, type ProgressionResult } from "@/lib/progression";
import type { LoadDecision } from "@/lib/types";

const TONE: Record<ProgressionResult["status"], string> = {
  top_of_range: "border-ok bg-ok-soft",
  in_range: "border-line bg-surface-2",
  below_range: "border-warn bg-warn-soft",
  incomplete: "border-line bg-surface-2",
};

export function ProgressionCard({
  result,
  decision,
  onDecide,
}: {
  result: ProgressionResult;
  decision?: LoadDecision | null;
  onDecide?: (d: LoadDecision) => void;
}) {
  const options: { value: LoadDecision; Icon: typeof IconUp }[] = [
    { value: "manter", Icon: IconEqual },
    { value: "avaliar_aumento", Icon: IconUp },
    { value: "reduzir", Icon: IconDown },
  ];
  return (
    <div className={`rounded-2xl border p-4 ${TONE[result.status]}`}>
      <p className="font-semibold">{result.title}</p>
      <p className="mt-1 text-sm text-muted">{result.message}</p>
      {onDecide && result.status !== "incomplete" && (
        <div className="mt-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-faint">Sua decisão para a próxima sessão</p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Decisão sobre a carga">
            {options.map(({ value, Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={decision === value}
                onClick={() => onDecide(value)}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-xs font-semibold ${decision === value ? "bg-accent text-accent-ink" : "bg-surface-3 text-ink"}`}
              >
                <Icon size={18} />
                {LOAD_DECISION_LABELS[value].replace(" a carga", "").replace("Avaliar progressão gradual", "Avaliar progressão")}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-faint">A carga nunca é alterada automaticamente.</p>
        </div>
      )}
    </div>
  );
}
