import { describe, expect, it } from "vitest";
import { celula, gerarCsv } from "./csv";
import { novoEstado } from "@/engine/estado";
import { obterFato, registrar } from "@/engine/dominio";
import { HABILIDADES } from "@/engine/habilidades";
import type { AlunoLinha } from "./professor";

const aluno = (extra: Partial<AlunoLinha> = {}): AlunoLinha => ({
  id: "1", codigo: "e100", nome: "Ana Souza", apelido: "Raio", estado: null, atualizadoEm: null,
  pontosSemana: 0, evolucao: null, minutosSemana: 0, rodadasSemana: 0, ultima: null, ...extra,
});

describe("exportação CSV", () => {
  it("escapa separador, aspas e quebras de linha", () => {
    expect(celula("a;b")).toBe('"a;b"');
    expect(celula('diz "oi"')).toBe('"diz ""oi"""');
    expect(celula("linha\nnova")).toBe('"linha\nnova"');
    expect(celula(null)).toBe("");
    expect(celula(7)).toBe("7");
  });

  it("neutraliza fórmulas do Excel em textos, mas não em números negativos", () => {
    expect(celula("=SOMA(A1)")).toBe("'=SOMA(A1)");
    expect(celula("+55 65")).toBe("'+55 65");
    expect(celula("@cmd")).toBe("'@cmd");
    expect(celula(-3)).toBe("-3");
  });

  it("gera cabeçalho com as habilidades do ano, BOM e uma linha por aluno", () => {
    const csv = gerarCsv({ ano: 7 }, [aluno(), aluno({ id: "2", codigo: "e200", nome: "Bruno; Lima" })]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const linhas = csv.trim().split("\r\n");
    expect(linhas).toHaveLength(3);
    const cab = linhas[0]!.slice(1).split(";");
    const doAno = HABILIDADES.filter((h) => h.ano <= 7);
    expect(cab).toHaveLength(12 + doAno.length);
    expect(cab).toContain("Domínio: Tabuada (%)");
    expect(cab).not.toContain("Domínio: Equação do 2º grau (%)");
    expect(linhas[2]).toContain('"Bruno; Lima"');
  });

  it("traz nível, acerto, chefes e domínio por habilidade", () => {
    const e = novoEstado(7);
    e.nivel = 4; e.andar = 9; e.respondidas = 60; e.acertos = 48; e.chefes = ["Fundação", "Frações"];
    const f = obterFato(e.fatos, "soma-sub|soma-sr");
    for (let i = 0; i < 8; i++) registrar(f, true, 2000, i);
    const csv = gerarCsv({ ano: 7 }, [aluno({ estado: e, evolucao: 82, pontosSemana: 1200, minutosSemana: 35, rodadasSemana: 5, ultima: "2026-09-28T15:00:00Z" })]);
    const [cab, linha] = csv.slice(1).trim().split("\r\n") as [string, string];
    const h = cab.split(";"), v = linha.split(";");
    const col = (nome: string) => v[h.indexOf(nome)];
    expect(col("Nível")).toBe("4");
    expect(col("Andar")).toBe("9");
    expect(col("Acerto (%)")).toBe("80");
    expect(col("Evolução (0-100)")).toBe("82");
    expect(col("Chefes derrotados")).toBe("2");
    expect(col("Última atividade")).toBe("2026-09-28");
    expect(Number(col("Domínio: Somar e subtrair (%)"))).toBeGreaterThan(50);
    expect(col("Domínio: Tabuada (%)")).toBe("");
  });
});
