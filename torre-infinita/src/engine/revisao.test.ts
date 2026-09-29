import { describe, expect, it } from "vitest";
import { ACESSORIOS } from "@/components/Avatar";
import { assinaturaDe, gerarPergunta } from "./gerar";
import { POR_ID } from "./habilidades";
import { novoEstado } from "./estado";
import { criarRng } from "./rng";
import { Rodada } from "./rodada";
import { montarRodada } from "./selecao";
import { ORDEM_ZONAS, ZONAS } from "./zonas";
import type { Pergunta } from "./tipos";

const gera = (id: string, cat: string, semente: number) => gerarPergunta(POR_ID.get(id)!, cat, criarRng(semente), false);

describe("assinatura de perguntas (evita repetição na rodada)", () => {
  it("formatos com enunciado fixo se distinguem pelos itens", () => {
    const a = gera("classificar-numeros", "multiplo-de-3", 1), b = gera("classificar-numeros", "multiplo-de-3", 2);
    expect(a.enunciado).toBe(b.enunciado);
    expect(assinaturaDe(a)).not.toBe(assinaturaDe(b));
    const o1 = gera("ordenar-racionais", "decimais", 1), o2 = gera("ordenar-racionais", "decimais", 2);
    expect(assinaturaDe(o1)).not.toBe(assinaturaDe(o2));
    const e1 = gera("erro-equacao", "erro-sinal", 1), e2 = gera("erro-equacao", "erro-sinal", 2);
    expect(assinaturaDe(e1)).not.toBe(assinaturaDe(e2));
  });

  it("a mesma conta com outras alternativas continua sendo a mesma pergunta", () => {
    const p = gera("tabuada", "7x8", 3);
    const parecida: Pergunta = { ...p, opcoes: [...p.opcoes!].reverse() };
    expect(assinaturaDe(parecida)).toBe(assinaturaDe(p));
  });

  it("treino dirigido de classificar monta 10 perguntas sem repetir itens", () => {
    const e = novoEstado(7);
    e.colocadas = ["soma-sub", "tabuada", "divisao", "divisibilidade", "fracao-equiv"];
    const qs = montarRodada(e, "treino", criarRng(11), "classificar-numeros");
    expect(qs).toHaveLength(10);
    expect(new Set(qs.map(assinaturaDe)).size).toBe(10);
  });

  it("o reforço de uma classificação errada traz itens diferentes", () => {
    const e = novoEstado(7);
    e.colocadas = ["soma-sub", "tabuada", "divisao", "divisibilidade"];
    const r = new Rodada(e, "treino", criarRng(5), "classificar-numeros");
    const original = r.atual()!;
    r.responder("000000", 2000, false);
    const reforco = r.perguntas[r.i + 4]!;
    expect(reforco.reforco).toBe(true);
    expect(assinaturaDe(reforco)).not.toBe(assinaturaDe(original));
  });
});

describe("acessórios de troféu", () => {
  it("a ordem das zonas está travada: o avatar guarda um número que depende dela", () => {
    expect([...ORDEM_ZONAS]).toEqual(["Fundação", "Números", "Frações", "Inteiros", "Proporção", "Álgebra", "Potências", "Geometria", "Dados", "Problemas"]);
    expect(Object.keys(ZONAS).sort()).toEqual([...ORDEM_ZONAS].sort());
    ORDEM_ZONAS.forEach((z, i) => expect(ACESSORIOS[4 + i]!.zona).toBe(z));
  });

  it("o total de acessórios bate com o limite que o banco aceita (0 a 13, migração 0004)", () => {
    expect(ACESSORIOS.length - 1).toBe(13);
  });
});
