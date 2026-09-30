import { describe, expect, it } from "vitest";
import { alertasDoAluno, celulaDoMapa, dificuldadesDaTurma, rotuloCategoria } from "./analise";
import { chaveFato, registrar, obterFato } from "./dominio";
import { novoEstado } from "./estado";

function alunoCom(fatos: Record<string, boolean[]>) {
  const e = novoEstado(7);
  for (const [chave, resultados] of Object.entries(fatos)) {
    const [h, cat] = chave.split("|") as [string, string];
    const f = obterFato(e.fatos, chaveFato(h, cat));
    resultados.forEach((ok, i) => registrar(f, ok, 3000, i));
  }
  e.respondidas = 10;
  return e;
}

describe("análise da turma", () => {
  it("lista primeiro as categorias com menor domínio médio", () => {
    const acertos = Array(8).fill(true), erros = Array(8).fill(false);
    const turma = [
      alunoCom({ "tabuada|7x8": erros, "tabuada|2x3": acertos }),
      alunoCom({ "tabuada|7x8": erros, "tabuada|2x3": acertos }),
      alunoCom({ "tabuada|7x8": acertos, "tabuada|2x3": acertos }),
    ];
    const d = dificuldadesDaTurma(turma, 2);
    expect(d[0]).toMatchObject({ habilidade: "tabuada", cat: "7x8", rotulo: "7 × 8", alunos: 3 });
    expect(d[0]!.media).toBeLessThan(d[1]!.media);
  });

  it("ignora categoria vista por um aluno só quando a turma é maior", () => {
    const turma = [alunoCom({ "tabuada|9x9": [false, false, false] }), alunoCom({}), alunoCom({})];
    expect(dificuldadesDaTurma(turma)).toEqual([]);
  });

  it("rotula categorias de forma legível", () => {
    expect(rotuloCategoria("divisao", "por7")).toBe("divisão por 7");
    expect(rotuloCategoria("soma-sub", "soma-cr")).toBe("soma com reserva");
  });

  it("alerta aluno que nunca jogou, travado ou parado", () => {
    const agora = Date.parse("2026-09-29T12:00:00Z");
    expect(alertasDoAluno(null, null, agora)).toEqual(["nunca-jogou"]);
    const e = alunoCom({ "tabuada|2x3": [true] });
    expect(alertasDoAluno(e, "2026-09-28T12:00:00Z", agora)).toEqual([]);
    e.quedas = 2;
    expect(alertasDoAluno(e, "2026-09-10T12:00:00Z", agora)).toEqual(["travado", "parado"]);
  });

  it("célula do mapa: sem dados, bloqueada e com dados", () => {
    expect(celulaDoMapa(null, "tabuada")).toEqual({ situacao: "bloqueada", d: null });
    const e = alunoCom({});
    expect(celulaDoMapa(e, "soma-sub").situacao).toBe("nova");
    expect(celulaDoMapa(e, "tabuada").situacao).toBe("bloqueada");
    const f = alunoCom({ "soma-sub|soma-sr": [true, true, true, true] });
    expect(celulaDoMapa(f, "soma-sub").d).toBeGreaterThan(0.5);
  });
});
