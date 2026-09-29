import { Suspense } from "react";
import { ExerciseForm } from "@/components/ExerciseForm";

export default function EditarExercicioPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted">Carregando…</div>}>
      <ExerciseForm />
    </Suspense>
  );
}
