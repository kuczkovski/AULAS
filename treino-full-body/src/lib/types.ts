// Modelo de dados do domínio. Todos os registros sincronizáveis possuem
// `id`, `updatedAt` (epoch ms do cliente) e `deletedAt` para exclusão lógica.

export const MUSCLE_GROUPS = [
  "peitoral",
  "costas",
  "ombros",
  "biceps",
  "triceps",
  "antebracos",
  "quadriceps",
  "posteriores",
  "gluteos",
  "panturrilhas",
  "abdomen",
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  peitoral: "Peitoral",
  costas: "Costas",
  ombros: "Ombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  antebracos: "Antebraços",
  quadriceps: "Quadríceps",
  posteriores: "Posteriores de coxa",
  gluteos: "Glúteos",
  panturrilhas: "Panturrilhas",
  abdomen: "Abdômen",
};

export const EQUIPMENT = [
  "barra",
  "halteres",
  "maquina",
  "polia",
  "peso_corporal",
  "kettlebell",
  "elastico",
  "banco",
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barra: "Barra",
  halteres: "Halteres",
  maquina: "Máquina",
  polia: "Polia / cabo",
  peso_corporal: "Peso corporal",
  kettlebell: "Kettlebell",
  elastico: "Elástico",
  banco: "Banco",
};

/** Unidade da "repetição": repetições ou segundos (isometrias como prancha). */
export type RepUnit = "reps" | "seconds";

export interface SyncMeta {
  id: string;
  updatedAt: number;
  deletedAt: number | null;
}

export interface Exercise extends SyncMeta {
  name: string;
  muscleGroup: MuscleGroup;
  secondaryGroups: MuscleGroup[];
  equipment: Equipment;
  repUnit: RepUnit;
  /** Prescrição padrão usada quando o exercício substitui outro. */
  defaultSets: number;
  repMin: number;
  repMax: number;
  restSeconds: number;
  targetRir: number | null;
  /** Observações de execução (pontos técnicos). */
  cues: string[];
  /** URL opcional de imagem, GIF ou vídeo de demonstração. */
  mediaUrl: string | null;
  /** IDs de exercícios cadastrados como alternativas de substituição. */
  alternativeIds: string[];
  /** Criado pelo usuário (true) ou parte do catálogo inicial (false). */
  custom: boolean;
}

export type TemplateId = "A" | "B" | "C" | "D";

export interface TemplateItem {
  /** Identificador estável da posição na sessão (não muda ao substituir). */
  slotId: string;
  exerciseId: string;
  sets: number;
  repMin: number;
  repMax: number;
  restSeconds: number;
  targetRir: number | null;
}

export interface WorkoutTemplate extends SyncMeta {
  id: TemplateId;
  name: string;
  focus: string;
  /** 0 = domingo … 6 = sábado */
  weekday: number;
  items: TemplateItem[];
}

export interface SetLog {
  index: number;
  load: number | null;
  reps: number | null;
  rir: number | null;
  completedAt: number | null;
}

export type LoadDecision = "manter" | "avaliar_aumento" | "reduzir";

export interface SessionExercise {
  slotId: string;
  /** Exercício previsto no programa. */
  plannedExerciseId: string;
  /** Exercício efetivamente executado (pode ser uma alternativa). */
  exerciseId: string;
  /** Nome no momento do treino, preservado para o histórico. */
  exerciseName: string;
  muscleGroup: MuscleGroup;
  repUnit: RepUnit;
  substitution: { fromExerciseId: string; reason: string | null; at: number } | null;
  sets: SetLog[];
  repMin: number;
  repMax: number;
  restSeconds: number;
  targetRir: number | null;
  notes: string;
  skipped: boolean;
  /** Decisão do usuário sobre a carga para a próxima sessão. */
  loadDecision: LoadDecision | null;
}

export type SessionStatus = "in_progress" | "completed" | "interrupted";

export interface WorkoutSession extends SyncMeta {
  templateId: TemplateId;
  templateName: string;
  startedAt: number;
  endedAt: number | null;
  status: SessionStatus;
  interruptionReason: string | null;
  currentIndex: number;
  exercises: SessionExercise[];
  notes: string;
}

export type DiscomfortCharacter = "persistente" | "irradiada" | "piora" | "pontual";

export type DiscomfortAction = "continuou" | "pulou_exercicio" | "interrompeu_sessao";

export interface DiscomfortLog extends SyncMeta {
  sessionId: string | null;
  exerciseId: string | null;
  exerciseName: string | null;
  region: string;
  /** Intensidade percebida de 0 a 10. */
  intensity: number;
  characters: DiscomfortCharacter[];
  action: DiscomfortAction;
  note: string;
  createdAt: number;
}

export interface Profile extends SyncMeta {
  id: "profile";
  displayName: string;
  loadUnit: "kg" | "lb";
  loadStep: number;
  soundOnRestEnd: boolean;
  vibrateOnRestEnd: boolean;
  acceptedNotice: boolean;
}

export type CollectionName = "exercises" | "templates" | "sessions" | "discomforts" | "profile";
