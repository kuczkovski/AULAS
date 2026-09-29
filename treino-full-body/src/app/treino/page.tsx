import { Suspense } from "react";
import { TrainingScreen } from "@/components/training/TrainingScreen";

export default function TreinoPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted">Carregando…</div>}>
      <TrainingScreen />
    </Suspense>
  );
}
