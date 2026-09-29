import { describe, expect, it } from "vitest";
import { buildSeedExercises, buildSeedTemplates } from "@/data/catalog";
import {
  addSet,
  completeSet,
  createSession,
  finishSession,
  sessionProgress,
  substituteExercise,
} from "./session";
import { evaluateDoubleProgression, exerciseHistory, lastPerformance } from "./progression";
import { averageDurationMs, needsProfessionalNotice, startOfWeek, volumeByGroup, weeklyFrequency } from "./stats";
import { parseDecimal, validateSetInput } from "./validation";

const exercises = buildSeedExercises();
const exMap = new Map(exercises.map((e) => [e.id, e]));
const templates = buildSeedTemplates();
const tplA = templates.find((t) => t.id === "A")!;

describe("catálogo", () => {
  it("não define cargas iniciais e todos os exercícios dos treinos existem", () => {
    for (const t of templates) for (const i of t.items) expect(exMap.has(i.exerciseId)).toBe(true);
    for (const e of exercises) expect(JSON.stringify(e)).not.toMatch(/"load"/);
  });

  it("alternativas são recíprocas", () => {
    for (const e of exercises) for (const a of e.alternativeIds) expect(exMap.get(a)!.alternativeIds).toContain(e.id);
  });

  it("segue a organização semanal", () => {
    expect(templates.map((t) => [t.id, t.weekday])).toEqual([["A", 1], ["B", 2], ["C", 4], ["D", 5]]);
  });
});

describe("validação de séries", () => {
  it("aceita vírgula decimal e campos opcionais", () => {
    expect(parseDecimal("42,5")).toBe(42.5);
    expect(validateSetInput({ load: "42,5", reps: "8", rir: "" })).toEqual({ ok: true, value: { load: 42.5, reps: 8, rir: null } });
    expect(validateSetInput({ load: "", reps: "12", rir: "2" }).ok).toBe(true);
  });

  it("rejeita valores inválidos", () => {
    const r = validateSetInput({ load: "-5", reps: "", rir: "11" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.load).toBeDefined();
      expect(r.errors.reps).toBeDefined();
      expect(r.errors.rir).toBeDefined();
    }
    expect(validateSetInput({ load: "abc", reps: "8", rir: "" }).ok).toBe(false);
    expect(validateSetInput({ load: "40", reps: "8.5", rir: "" }).ok).toBe(false);
  });
});

function doSession(reps: number[], load = 60, start = Date.UTC(2026, 0, 5, 10)) {
  let s = createSession(tplA, exMap, start);
  reps.forEach((r, i) => {
    s = completeSet(s, 0, i, { load, reps: r, rir: 1 }, start + i * 1000);
  });
  return finishSession(s, "completed", null, start + 55 * 60_000);
}

describe("sessão", () => {
  it("começa sem cargas preenchidas", () => {
    const s = createSession(tplA, exMap);
    expect(s.exercises.every((e) => e.sets.every((x) => x.load === null && x.reps === null))).toBe(true);
    expect(sessionProgress(s).done).toBe(0);
  });

  it("substituição preserva o exercício planejado e bloqueia com séries concluídas", () => {
    const s = createSession(tplA, exMap);
    const alt = exMap.get("supino-reto-halteres")!;
    const swapped = substituteExercise(s, 0, alt, "Banco ocupado");
    expect(swapped.exercises[0]!.exerciseId).toBe("supino-reto-halteres");
    expect(swapped.exercises[0]!.plannedExerciseId).toBe("supino-reto-barra");
    expect(swapped.exercises[0]!.substitution?.reason).toBe("Banco ocupado");
    const withSet = completeSet(s, 0, 0, { load: 50, reps: 8, rir: 2 });
    expect(() => substituteExercise(withSet, 0, alt, null)).toThrow();
  });

  it("permite adicionar séries", () => {
    const s = addSet(createSession(tplA, exMap), 0);
    expect(s.exercises[0]!.sets).toHaveLength(5);
  });
});

describe("progressão dupla", () => {
  it("sinaliza avaliação apenas quando todas as séries atingem o topo", () => {
    expect(evaluateDoubleProgression(doSession([8, 8, 8, 8]).exercises[0]!).status).toBe("top_of_range");
    expect(evaluateDoubleProgression(doSession([8, 8, 8, 7]).exercises[0]!).status).toBe("in_range");
    expect(evaluateDoubleProgression(doSession([8, 7, 6, 5]).exercises[0]!).status).toBe("below_range");
    expect(evaluateDoubleProgression(doSession([8, 8]).exercises[0]!).status).toBe("incomplete");
  });

  it("nunca altera a carga automaticamente", () => {
    const s = doSession([8, 8, 8, 8], 60);
    const next = createSession(tplA, exMap);
    expect(next.exercises[0]!.sets[0]!.load).toBeNull();
    expect(lastPerformance("supino-reto-barra", [s])!.topLoad).toBe(60);
  });

  it("monta o histórico em ordem cronológica", () => {
    const a = doSession([6, 6, 6, 6], 50, Date.UTC(2026, 0, 5));
    const b = doSession([8, 8, 8, 8], 55, Date.UTC(2026, 0, 12));
    const h = exerciseHistory("supino-reto-barra", [b, a]);
    expect(h.map((x) => x.topLoad)).toEqual([50, 55]);
    expect(h[1]!.volume).toBe(55 * 8 * 4);
  });
});

describe("indicadores", () => {
  it("frequência semanal, volume e duração", () => {
    const now = Date.UTC(2026, 0, 14, 12);
    const a = doSession([8, 8, 8, 8], 60, Date.UTC(2026, 0, 12, 10));
    const b = doSession([8, 8, 8, 8], 60, Date.UTC(2026, 0, 13, 10));
    const freq = weeklyFrequency([a, b], 2, now);
    expect(freq[1]!.weekStart).toBe(startOfWeek(now));
    expect(freq[1]!.count).toBe(2);
    const vol = volumeByGroup([a, b], 0);
    expect(vol[0]).toMatchObject({ group: "peitoral", sets: 8, tonnage: 60 * 8 * 8 });
    expect(averageDurationMs([a, b])).toBe(55 * 60_000);
  });

  it("aviso profissional para dor persistente, irradiada ou em piora", () => {
    expect(needsProfessionalNotice({ characters: ["pontual"], intensity: 3 })).toBe(false);
    expect(needsProfessionalNotice({ characters: ["irradiada"], intensity: 2 })).toBe(true);
    expect(needsProfessionalNotice({ characters: ["piora"], intensity: 1 })).toBe(true);
    expect(needsProfessionalNotice({ characters: [], intensity: 8 })).toBe(true);
  });
});
