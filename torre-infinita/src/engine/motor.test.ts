import { describe, expect, it } from "vitest";
import { HABILIDADES } from "./habilidades";
import { criarRng } from "./rng";
import { novoEstado, aplicarXp, xpNecessario, sequenciaDeDias, hojeISO } from "./estado";
import { Nivelamento } from "./nivelamento";
import { Rodada } from "./rodada";
import { consolidada, dominio, registrar } from "./dominio";
import { desbloqueadas, montarRodada, situacao, tipoDoAndar } from "./selecao";
import type { Ano, EstadoAluno, Pergunta } from "./tipos";

/** Resposta errada garantida para qualquer formato. */
function errada(p: Pergunta): string {
  return p.opcoes ? p.opcoes.find((o) => o !== p.resposta && !(p.aceitar ?? []).includes(o))! : "12345";
}

describe("modelo de domínio", () => {
  it("um acerto de sorte não marca como dominado", () => {
    const f = { seen: 0, wrong: 0, n: 0, sumT: 0, h: 0, hn: 0, rec: 0, last: -99 };
    registrar(f, true, 2000, 1);
    expect(dominio(f, 4000)).toBeLessThan(0.8);
  });
  it("acertos rápidos e repetidos levam a domínio alto; erros recentes derrubam", () => {
    const f = { seen: 0, wrong: 0, n: 0, sumT: 0, h: 0, hn: 0, rec: 0, last: -99 };
    for (let i = 0; i < 8; i++) registrar(f, true, 2000, i);
    const alto = dominio(f, 4000);
    expect(alto).toBeGreaterThan(0.85);
    registrar(f, false, 2000, 9);
    registrar(f, false, 2000, 10);
    expect(dominio(f, 4000)).toBeLessThan(alto - 0.15);
  });
});

describe("progressão", () => {
  it("XP sobe de nível e sobra o resto", () => {
    const e = novoEstado(6);
    const n = aplicarXp(e, xpNecessario(1) + 10);
    expect(n).toBe(1);
    expect(e.nivel).toBe(2);
    expect(e.xp).toBe(10);
  });
  it("sequência de dias tolera hoje ainda sem jogar", () => {
    const d = new Date(2026, 8, 29);
    const ontem = new Date(2026, 8, 28), anteontem = new Date(2026, 8, 27);
    expect(sequenciaDeDias([hojeISO(ontem), hojeISO(anteontem)], d)).toBe(2);
    expect(sequenciaDeDias([hojeISO(d), hojeISO(ontem)], d)).toBe(2);
    expect(sequenciaDeDias([hojeISO(anteontem)], d)).toBe(0);
  });
  it("andares de chefe e revisão seguem o ciclo", () => {
    expect([1, 2, 3, 4, 5, 8, 10].map(tipoDoAndar)).toEqual(["treino", "treino", "treino", "revisao", "chefe", "revisao", "chefe"]);
  });
  it("aluno novo só vê a habilidade-raiz; o resto abre com domínio", () => {
    const e = novoEstado(9);
    expect(desbloqueadas(e).map((h) => h.id)).toEqual(["soma-sub"]);
    expect(situacao(HABILIDADES.find((h) => h.id === "tabuada")!, e)).toBe("bloqueada");
  });
  it("não abre conteúdo de ano acima do da turma", () => {
    const e = novoEstado(6);
    e.colocadas = HABILIDADES.map((h) => h.id);
    expect(desbloqueadas(e).every((h) => h.ano <= 6)).toBe(true);
  });
});

/** Aluno simulado: acerta com probabilidade `p(habilidade)`. */
function jogar(e: EstadoAluno, rodadas: number, p: (id: string) => number, sem = 1) {
  const r = criarRng(sem);
  let quedas = 0;
  for (let k = 0; k < rodadas; k++) {
    const tipo = tipoDoAndar(e.andar);
    const rod = new Rodada(e, tipo, r);
    expect(rod.perguntas.length).toBe(rod.total);
    while (!rod.terminou) {
      const q = rod.atual()!;
      const ok = r.chance(p(q.habilidade));
      rod.responder(ok ? q.resposta : errada(q), 4000, false);
      if (!rod.avancar()) break;
    }
    const res = rod.concluir();
    if (res.falhou) quedas++;
    expect(res.pontos).toBeGreaterThanOrEqual(0);
  }
  return quedas;
}

describe("nivelamento", () => {
  const conhece = (ate: Ano) => (id: string) => HABILIDADES.find((h) => h.id === id)!.ano <= ate;

  function rodarNivelamento(ano: Ano, sabe: (id: string) => boolean, sem = 3) {
    const e = novoEstado(ano);
    const n = new Nivelamento(e, criarRng(sem));
    let guard = 0;
    while (!n.terminou && guard++ < 100) {
      const q = n.atual()!;
      n.responder(sabe(q.habilidade) ? q.resposta : errada(q), 3000);
    }
    n.concluir();
    return { e, n };
  }

  it("aluno do 9º que domina tudo é colocado em todas as habilidades", () => {
    const { e } = rodarNivelamento(9, () => true);
    expect(e.colocadas.length).toBe(HABILIDADES.filter((h) => h.nivelamento !== false).length);
    expect(e.nivelamentoFeito).toBe(true);
  });

  it("aluno do 9º que só sabe até o 7º ano não é colocado no 8º e 9º", () => {
    const { e } = rodarNivelamento(9, conhece(7));
    const colocadas = new Set(e.colocadas);
    for (const h of HABILIDADES.filter((x) => x.nivelamento !== false)) expect(colocadas.has(h.id), h.id).toBe(h.ano <= 7);
  });

  it("aluno que erra tudo termina cedo e sem habilidades colocadas", () => {
    const { e, n } = rodarNivelamento(8, () => false);
    expect(e.colocadas).toEqual([]);
    expect(n.respondidas).toBeLessThanOrEqual(2);
  });

  it("não testa habilidade cujo requisito falhou", () => {
    const sabe = (id: string) => id !== "tabuada";
    const e = novoEstado(7);
    const n = new Nivelamento(e, criarRng(9));
    const vistas = new Set<string>();
    while (!n.terminou) {
      const q = n.atual()!;
      vistas.add(q.habilidade);
      n.responder(sabe(q.habilidade) ? q.resposta : errada(q), 3000);
    }
    for (const dependente of ["divisao", "ordem-ops", "potencias", "fracao-equiv"]) expect(vistas.has(dependente)).toBe(false);
  });

  it("aluno colocado passa a ter conteúdo liberado", () => {
    const { e } = rodarNivelamento(7, conhece(7));
    expect(desbloqueadas(e).length).toBe(HABILIDADES.filter((h) => h.ano <= 7).length);
  });

  it("respeita o limite de perguntas", () => {
    const { n } = rodarNivelamento(9, () => true);
    expect(n.respondidas).toBeLessThanOrEqual(30);
  });
});

describe("rodada", () => {
  it("monta rodadas completas com perguntas distintas", () => {
    const e = novoEstado(9);
    e.colocadas = HABILIDADES.map((h) => h.id);
    for (const tipo of ["treino", "revisao", "chefe"] as const) {
      const qs = montarRodada(e, tipo, criarRng(5));
      const assin = qs.map((q) => q.enunciado + "|" + q.expr);
      expect(new Set(assin).size).toBeGreaterThanOrEqual(qs.length - 1);
    }
    const qs = montarRodada(e, "treino", criarRng(5));
    expect(new Set(qs.map((q) => q.habilidade)).size).toBeGreaterThan(3);
  });

  it("três erros esgotam as vidas e a rodada falha sem avançar o andar", () => {
    const e = novoEstado(6);
    const rod = new Rodada(e, "treino", criarRng(1));
    let n = 0;
    while (!rod.terminou && n++ < 20) { rod.responder(errada(rod.atual()!), 3000, false); rod.avancar(); }
    const res = rod.concluir();
    expect(res.falhou).toBe(true);
    expect(e.andar).toBe(1);
    expect(e.quedas).toBe(1);
    expect(res.pontos).toBe(0);
  });

  it("erro gera reforço da mesma habilidade adiante, sem custo de vida", () => {
    const e = novoEstado(6);
    const rod = new Rodada(e, "treino", criarRng(2));
    const primeira = rod.atual()!;
    rod.responder(errada(primeira), 3000, false);
    expect(rod.vidas).toBe(rod.vidasMax - 1);
    const reforco = rod.perguntas[rod.i + 4]!;
    expect(reforco.reforco).toBe(true);
    expect(reforco.habilidade).toBe(primeira.habilidade);
    expect(reforco.cat).toBe(primeira.cat);
    // errar o reforço não gasta vida
    rod.i = rod.i + 4;
    rod.responder(errada(reforco), 3000, false);
    expect(rod.vidas).toBe(rod.vidasMax - 1);
  });

  it("aluno preciso conclui, avança o andar, ganha XP e não perde vidas", () => {
    const e = novoEstado(6);
    const rod = new Rodada(e, "treino", criarRng(3));
    while (!rod.terminou) { rod.responder(rod.atual()!.resposta, 2000, false); if (!rod.avancar()) break; }
    const res = rod.concluir();
    expect(res.falhou).toBe(false);
    expect(res.acertos).toBe(10);
    expect(e.andar).toBe(2);
    expect(e.xp + (e.nivel - 1) * 100).toBeGreaterThan(0);
    expect(res.bonus.some((b) => b.titulo === "Sem nenhum erro")).toBe(true);
  });

  it("duas quedas ativam o modo guiado com mais vidas", () => {
    const e = novoEstado(6);
    e.quedas = 2;
    expect(new Rodada(e, "treino", criarRng(4)).vidasMax).toBeGreaterThanOrEqual(5);
  });

  it("digitar vale mais pontos que escolher", () => {
    const e = novoEstado(9);
    e.colocadas = HABILIDADES.map((h) => h.id);
    const r = new Rodada(e, "treino", criarRng(6));
    const q = r.atual()!;
    const g = r.responder(q.resposta, 99999, false).ganhos;
    expect(g).toBe(q.formato === "escolha" || q.formato === "vf" ? 11 : 16);
  });
});

describe("simulação de aluno ao longo do tempo", () => {
  it("aluno forte do 6º ano destrava o conteúdo do ano em poucas rodadas", () => {
    const e = novoEstado(6);
    jogar(e, 30, () => 0.95, 11);
    const abertas = desbloqueadas(e).map((h) => h.id);
    expect(abertas.length).toBeGreaterThanOrEqual(8);
    expect(e.andar).toBeGreaterThan(20);
    expect(e.nivel).toBeGreaterThan(3);
    expect(abertas.every((id) => HABILIDADES.find((h) => h.id === id)!.ano <= 6)).toBe(true);
  });

  it("aluno fraco cai, recebe apoio e ainda assim progride sem travar", () => {
    const e = novoEstado(6);
    const quedas = jogar(e, 40, () => 0.55, 12);
    expect(quedas).toBeGreaterThan(0);
    expect(e.andar).toBeGreaterThan(5);
    expect(e.respondidas).toBeGreaterThan(200);
  });

  it("uma habilidade fraca reaparece mais que uma dominada", () => {
    const e = novoEstado(6);
    e.colocadas = ["soma-sub", "tabuada", "divisao"];
    const p = (id: string) => (id === "divisao" ? 0.3 : 0.98);
    jogar(e, 15, p, 13);
    const cont: Record<string, number> = {};
    const r = criarRng(77);
    for (let i = 0; i < 40; i++) for (const q of montarRodada(e, "treino", r)) cont[q.habilidade] = (cont[q.habilidade] ?? 0) + 1;
    expect(cont["divisao"]!).toBeGreaterThan(cont["soma-sub"]!);
  });

  it("habilidades consolidadas liberam as dependentes", () => {
    const e = novoEstado(6);
    jogar(e, 12, () => 1, 14);
    expect(consolidada(HABILIDADES[0]!, e.fatos, e.colocadas)).toBe(true);
    expect(desbloqueadas(e).length).toBeGreaterThan(1);
  });
});
