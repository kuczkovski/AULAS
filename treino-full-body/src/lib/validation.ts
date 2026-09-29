import { z } from "zod";
import { EQUIPMENT, MUSCLE_GROUPS } from "./types";

/** Converte texto digitado ("42,5", " 40 ") em número; vazio vira null. */
export function parseDecimal(raw: string): number | null {
  const t = raw.trim().replace(",", ".");
  if (t === "") return null;
  if (!/^-?\d*\.?\d+$/.test(t) && !/^-?\d+\.$/.test(t)) return Number.NaN;
  return Number(t);
}

export const loadSchema = z
  .number({ error: "Informe a carga em número" })
  .finite("Carga inválida")
  .min(0, "A carga não pode ser negativa")
  .max(1000, "Carga acima do limite (1000)")
  .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, "Use no máximo duas casas decimais");

export const repsSchema = z
  .number({ error: "Informe as repetições" })
  .int("Use um número inteiro")
  .min(0, "Valor não pode ser negativo")
  .max(600, "Valor acima do limite");

export const rirSchema = z
  .number({ error: "RIR inválido" })
  .int("RIR deve ser inteiro")
  .min(0, "RIR mínimo é 0")
  .max(10, "RIR máximo é 10");

export interface SetInput {
  load: string;
  reps: string;
  rir: string;
}

export type SetErrors = Partial<Record<keyof SetInput, string>>;

export interface ParsedSet {
  load: number | null;
  reps: number;
  rir: number | null;
}

/**
 * Valida os campos de uma série. Repetições são obrigatórias; carga é
 * opcional (exercícios com peso corporal) e RIR é opcional.
 */
export function validateSetInput(input: SetInput): { ok: true; value: ParsedSet } | { ok: false; errors: SetErrors } {
  const errors: SetErrors = {};
  const load = parseDecimal(input.load);
  const reps = parseDecimal(input.reps);
  const rir = parseDecimal(input.rir);

  if (load !== null) {
    const r = loadSchema.safeParse(load);
    if (!r.success) errors.load = r.error.issues[0]?.message ?? "Carga inválida";
  }
  if (reps === null) {
    errors.reps = "Informe o que foi realizado";
  } else {
    const r = repsSchema.safeParse(reps);
    if (!r.success) errors.reps = r.error.issues[0]?.message ?? "Valor inválido";
  }
  if (rir !== null) {
    const r = rirSchema.safeParse(rir);
    if (!r.success) errors.rir = r.error.issues[0]?.message ?? "RIR inválido";
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { load, reps: reps as number, rir } };
}

export const exerciseFormSchema = z
  .object({
    name: z.string().trim().min(2, "Nome muito curto").max(80, "Nome muito longo"),
    muscleGroup: z.enum(MUSCLE_GROUPS, { error: "Selecione o grupo muscular" }),
    secondaryGroups: z.array(z.enum(MUSCLE_GROUPS)).max(4),
    equipment: z.enum(EQUIPMENT, { error: "Selecione o equipamento" }),
    repUnit: z.enum(["reps", "seconds"]),
    defaultSets: z.number().int().min(1, "Mínimo 1 série").max(10, "Máximo 10 séries"),
    repMin: z.number().int().min(1, "Mínimo 1").max(300),
    repMax: z.number().int().min(1, "Mínimo 1").max(300),
    restSeconds: z.number().int().min(0).max(600, "Máximo 10 minutos"),
    targetRir: z.number().int().min(0).max(10).nullable(),
    cues: z.array(z.string().trim().min(1).max(200)).max(10),
    mediaUrl: z
      .string()
      .trim()
      .url("URL inválida")
      .refine((u) => u.startsWith("https://"), "Use um endereço https://")
      .nullable(),
    alternativeIds: z.array(z.string()).max(10),
  })
  .refine((v) => v.repMax >= v.repMin, { path: ["repMax"], message: "O limite superior deve ser ≥ ao inferior" });

export type ExerciseForm = z.infer<typeof exerciseFormSchema>;

export const prescriptionSchema = z
  .object({
    sets: z.number().int().min(1, "Mínimo 1 série").max(10, "Máximo 10 séries"),
    repMin: z.number().int().min(1).max(300),
    repMax: z.number().int().min(1).max(300),
    restSeconds: z.number().int().min(0).max(600),
    targetRir: z.number().int().min(0).max(10).nullable(),
  })
  .refine((v) => v.repMax >= v.repMin, { path: ["repMax"], message: "O limite superior deve ser ≥ ao inferior" });

export const discomfortSchema = z.object({
  region: z.string().trim().min(2, "Informe a região").max(60),
  intensity: z.number().int().min(0).max(10),
  characters: z.array(z.enum(["persistente", "irradiada", "piora", "pontual"])).max(4),
  action: z.enum(["continuou", "pulou_exercicio", "interrompeu_sessao"]),
  note: z.string().trim().max(500, "Máximo de 500 caracteres"),
});

export const profileSchema = z.object({
  displayName: z.string().trim().max(40, "Máximo de 40 caracteres"),
  loadUnit: z.enum(["kg", "lb"]),
  loadStep: z.number().min(0.25, "Mínimo 0,25").max(20, "Máximo 20"),
  soundOnRestEnd: z.boolean(),
  vibrateOnRestEnd: z.boolean(),
});

export function firstError(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
