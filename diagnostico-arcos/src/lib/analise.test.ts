import { describe, expect, it } from "vitest";
import { QUESTOES } from "@/dominio/questoes";
import { GABARITO } from "@/dominio/gabarito";
import { nivelDe, normalizarNumero, resultadoPorDimensao } from "@/dominio/pontuacao";
import {
  analisePorQuestao, autoVsRealPorItem, construirBase, contagemTurma, filtrarTurma, leituraPedagogica,
  mediaPorDimensao, resumoPorTurma, type DadosBrutos, type LinhaTentativa,
} from "./analise";

describe("pontuação", () => {
  it("normaliza respostas numéricas", () => {
    expect(normalizarNumero("180°")).toBe("180");
    expect(normalizarNumero(" 90 graus ")).toBe("90");
    expect(normalizarNumero("1,50")).toBe("1.5");
    expect(normalizarNumero("0120")).toBe("120");
    for (const ruim of ["", "  ", "abc", "-90", "1e3", "12345", "9 0", "°"]) expect(normalizarNumero(ruim), ruim).toBeNull();
  });

  it("aplica a régua diagnóstica nos limites", () => {
    expect([100, 80, 79.9, 60, 59.9, 40, 39.9, 0].map(nivelDe)).toEqual(
      ["consolidado", "consolidado", "funcional", "funcional", "fragil", "fragil", "recomposicao", "recomposicao"]);
  });

  it("calcula D1–D4 (questão sem resposta não conta)", () => {
    const acertou: Record<string, boolean | null> = {};
    for (const q of QUESTOES) acertou[q.id] = true;
    acertou.Q2 = false; acertou.Q11 = null; acertou.Q15 = false;
    const r = resultadoPorDimensao(acertou);
    expect(r.D1).toMatchObject({ acertos: 2, total: 3 });
    expect(r.D2).toMatchObject({ acertos: 4, total: 4, nivel: "consolidado" });
    expect(r.D3).toMatchObject({ acertos: 3, total: 3 });
    expect(r.D4).toMatchObject({ acertos: 3, total: 5, pct: 60, nivel: "funcional" });
  });
});

let seq = 0;
function aluno(nome: string, turma: string, erros: string[], opts: { auto?: number; inicio?: string; status?: LinhaTentativa["status"]; dur?: number } = {}): DadosBrutos {
  const id = `a${++seq}`;
  const certas = QUESTOES.filter(q => !erros.includes(q.id));
  return {
    tentativas: [{
      id, student_name: nome, class_name: turma, started_at: opts.inicio ?? "2026-10-01T10:00:00Z", finished_at: null,
      duration_seconds: opts.dur ?? 1800, status: opts.status ?? "concluida", total_correct: certas.length, total_questions: 15, percentage: null,
    }],
    respostas: QUESTOES.map(q => ({
      attempt_id: id, question_id: q.id, skill: q.dim, is_correct: !erros.includes(q.id),
      student_answer: erros.includes(q.id) ? "ERRO-" + q.id : GABARITO[q.id]!,
    })),
    autos: opts.auto ? ["A1", "A2", "A3", "A4", "A5", "A6", "A7"].map(item => ({ attempt_id: id, item, score: opts.auto! })) : [],
  };
}
const juntar = (...ds: DadosBrutos[]): DadosBrutos => ({
  tentativas: ds.flatMap(d => d.tentativas), respostas: ds.flatMap(d => d.respostas), autos: ds.flatMap(d => d.autos),
});

describe("análise do painel", () => {
  const dados = juntar(
    aluno("Ana Souza", "1º A", [], { auto: 4 }),
    aluno("Bruno Lima", "1º A", ["Q11", "Q12", "Q13", "Q14", "Q15"], { auto: 1 }),
    aluno("Carla Dias", "1º B", ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7"], { auto: 4, dur: 3600, status: "encerrada_por_tempo" }),
    aluno("Davi Rocha", "1º B", ["Q2"]),
    { tentativas: [{ ...aluno("Eva Braga", "1º C", []).tentativas[0]!, status: "em_andamento", duration_seconds: null }], respostas: [], autos: [] },
  );
  const base = construirBase(dados);

  it("conta quem iniciou, concluiu e segue em andamento", () => {
    expect(base.iniciaram).toBe(5);
    expect(base.concluiram).toBe(4);
    expect(base.emAndamento).toBe(1);
    expect(contagemTurma(base, "1º C")).toEqual({ iniciaram: 1, concluiram: 0, emAndamento: 1 });
    expect(contagemTurma(base, "1º A")).toEqual({ iniciaram: 2, concluiram: 2, emAndamento: 0 });
    expect(contagemTurma(base, "todas")).toEqual({ iniciaram: 5, concluiram: 4, emAndamento: 1 });
  });

  it("filtra por turma", () => {
    expect(filtrarTurma(base.alunos, "1º A").map(a => a.nome)).toEqual(["Ana Souza", "Bruno Lima"]);
    expect(filtrarTurma(base.alunos, "1º E")).toEqual([]);
    expect(filtrarTurma(base.alunos, "todas")).toHaveLength(4);
  });

  it("médias por dimensão e por turma batem com as contas à mão", () => {
    const a = filtrarTurma(base.alunos, "1º A");
    expect(mediaPorDimensao(a)).toMatchObject({ D1: 100, D2: 100, D3: 100, D4: 50 }); // (100 + 0) / 2 em D4
    const t = resumoPorTurma(base.alunos);
    expect(t.find(x => x.turma === "1º B")).toMatchObject({ n: 2, dim: { D1: (0 + 66.66666666666667) / 2 }, tempo: (3600 + 1800) / 2 });
    expect(t.find(x => x.turma === "1º D")).toMatchObject({ n: 0, geral: null });
  });

  it("análise por questão inclui taxa por turma e o erro mais comum", () => {
    const q2 = analisePorQuestao(base.alunos).find(q => q.id === "Q2")!;
    expect(q2.acerto).toBe(50);
    expect(q2.porTurma).toMatchObject({ "1º A": 100, "1º B": 0, "1º C": null });
    expect(q2.erroComum).toEqual({ resposta: "ERRO-Q2", n: 2 });
  });

  it("cruza autoavaliação e desempenho", () => {
    const por = Object.fromEntries(base.alunos.map(a => [a.nome, a.perfilAuto]));
    expect(por).toEqual({ "Ana Souza": "coerente", "Bruno Lima": "subestima", "Carla Dias": "superestima", "Davi Rocha": null });
    const a6 = autoVsRealPorItem(base.alunos).find(i => i.id === "A6")!;
    expect(a6.n).toBe(3);
    expect(a6.autoPct).toBeCloseTo((100 + 0 + 100) / 3);
  });

  it("subestima: sabe mais do que diz", () => {
    const b = construirBase(aluno("Fábio Melo", "1º E", [], { auto: 1 }));
    expect(b.alunos[0]!.perfilAuto).toBe("subestima");
  });

  it("repetições: usa a tentativa finalizada mais recente e sinaliza o nome repetido", () => {
    const d = juntar(
      aluno("Gabi Nunes", "1º A", ["Q1"], { inicio: "2026-10-01T09:00:00Z" }),
      aluno("GABI  nunes", "1º A", [], { inicio: "2026-10-02T09:00:00Z" }),
      aluno("Gabi Nunes", "1º B", []),
    );
    const b = construirBase(d);
    expect(b.alunos).toHaveLength(2);
    expect(b.alunos.find(a => a.turma === "1º A")).toMatchObject({ pctGeral: 100, nTentativas: 2 });
    expect(b.repetidos).toEqual([{ nome: "Gabi Nunes", turma: "1º A", n: 2 }]);
  });

  it("leitura pedagógica segue as regras da seção 17", () => {
    expect(leituraPedagogica({ D1: 90, D2: 85, D3: 80, D4: 30 })!.tom).toBe("ok");
    expect(leituraPedagogica({ D1: 65, D2: 60, D3: 80, D4: 30 })!.tom).toBe("atencao");
    expect(leituraPedagogica({ D1: 30, D2: 90, D3: 90, D4: 30 })!.tom).toBe("alerta");
    expect(leituraPedagogica({ D1: null, D2: null, D3: null, D4: null })).toBeNull();
  });
});
