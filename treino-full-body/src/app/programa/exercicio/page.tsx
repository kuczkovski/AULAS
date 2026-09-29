import { Suspense } from "react";
import { ExerciseDetail } from "@/components/ExerciseDetail";

export default function ExercicioPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted">Carregando…</div>}>
      <ExerciseDetail />
    </Suspense>
  );
}
