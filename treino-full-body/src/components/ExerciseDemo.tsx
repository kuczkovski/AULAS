import { EQUIPMENT_LABELS, MUSCLE_LABELS, type Exercise } from "@/lib/types";
import { BodyMap } from "./BodyMap";

function isVideo(url: string) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

/** Demonstração visual: mídia cadastrada (se houver), mapa muscular e pontos técnicos. */
export function ExerciseDemo({ exercise }: { exercise: Exercise }) {
  return (
    <div className="space-y-4">
      {exercise.mediaUrl &&
        (isVideo(exercise.mediaUrl) ? (
          <video src={exercise.mediaUrl} className="w-full rounded-xl bg-black" muted loop playsInline autoPlay controls />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={exercise.mediaUrl} alt={`Demonstração de ${exercise.name}`} className="w-full rounded-xl bg-black object-contain" loading="lazy" />
        ))}
      <div className="flex items-center gap-4">
        <BodyMap primary={exercise.muscleGroup} secondary={exercise.secondaryGroups} className="h-40 w-auto shrink-0" />
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-faint">Principal</dt>
            <dd className="font-semibold">{MUSCLE_LABELS[exercise.muscleGroup]}</dd>
          </div>
          {exercise.secondaryGroups.length > 0 && (
            <div>
              <dt className="text-faint">Auxiliares</dt>
              <dd>{exercise.secondaryGroups.map((g) => MUSCLE_LABELS[g]).join(", ")}</dd>
            </div>
          )}
          <div>
            <dt className="text-faint">Equipamento</dt>
            <dd>{EQUIPMENT_LABELS[exercise.equipment]}</dd>
          </div>
        </dl>
      </div>
      {exercise.cues.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">Execução</p>
          <ol className="space-y-1.5 text-sm text-muted">
            {exercise.cues.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className="tabular text-accent">{i + 1}.</span>
                <span>{c}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
