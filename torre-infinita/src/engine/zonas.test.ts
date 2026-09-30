import { describe, expect, it } from "vitest";
import { HABILIDADES, POR_ID } from "./habilidades";
import { novoEstado } from "./estado";
import { criarRng } from "./rng";
import { Rodada } from "./rodada";
import { chefeDaVez, progressoDaZona, zonaDominante, zonaEmFoco, zonasAbertas } from "./selecao";
import { ZONAS, infoZona } from "./zonas";
import type { EstadoAluno, Pergunta } from "./tipos";

const errada = (p: Pergunta) => (p.opcoes ? p.opcoes.find((o) => o !== p.resposta && !(p.aceitar ?? []).includes(o))! : "12345");

function aluno(ano: 6 | 7 | 8 | 9, colocadas: string[] = []): EstadoAluno {
  const e = novoEstado(ano);
  e.colocadas = colocadas;
  e.nivelamentoFeito = true;
  return e;
}
const base6 = ["soma-sub", "tabuada", "divisao"];

describe("zonas e chefes", () => {
  it("toda zona das habilidades tem identidade e cada chefe tem falas", () => {
    for (const h of HABILIDADES) expect(ZONAS[h.zona], `${h.id} → ${h.zona}`).toBeDefined();
    const nomes = new Set<string>();
    for (const [z, info] of Object.entries(ZONAS)) {
      expect(HABILIDADES.some((h) => h.zona === z), `zona sem habilidade: ${z}`).toBe(true);
      expect(info.cor).toMatch(/^#[0-9a-f]{6}$/i);
      for (const t of [info.descricao, info.chefe.nome, info.chefe.fala, info.chefe.derrota, info.chefe.vitoria]) expect(t.length).toBeGreaterThan(8);
      nomes.add(info.chefe.nome);
    }
    expect(nomes.size).toBe(Object.keys(ZONAS).length);
    expect(infoZona("zona inexistente")).toBe(ZONAS["Fundação"]);
  });

  it("o chefe da vez é a zona mais bem preparada, sem repetir os já derrotados", () => {
    const e = aluno(7, base6);
    expect(chefeDaVez(e)).toBe("Fundação");
    e.chefes = ["Fundação"];
    expect(chefeDaVez(e)).not.toBe("Fundação");
    expect(zonasAbertas(e)).toContain(chefeDaVez(e));
  });

  it("depois de derrotar todos, vem a revanche na zona mais fraca", () => {
    const e = aluno(6, base6);
    e.colocadas = HABILIDADES.filter((h) => h.ano <= 6).map((h) => h.id);
    e.chefes = zonasAbertas(e);
    expect(e.chefes).toContain(chefeDaVez(e));
  });

  it("o chefe de um aluno do 6º ano nunca é de zona que só existe mais adiante", () => {
    const e = aluno(6, HABILIDADES.filter((h) => h.ano <= 6).map((h) => h.id));
    for (let i = 0; i < 6; i++) {
      const z = chefeDaVez(e);
      expect(["Fundação", "Números", "Frações", "Problemas"]).toContain(z);
      e.chefes.push(z);
    }
  });

  it("progresso da zona conta habilidades abertas e dominadas", () => {
    const e = aluno(7, base6);
    const f = progressoDaZona(e, "Fundação");
    expect(f.dominadas).toBe(3);
    expect(f.chefe).toBe("disponivel");
    expect(progressoDaZona(e, "Álgebra").chefe).toBe("bloqueado");
    e.chefes = ["Fundação"];
    expect(progressoDaZona(e, "Fundação").chefe).toBe("derrotado");
  });

  it("zona em foco e zona dominante existem e são coerentes", () => {
    const e = aluno(7, base6);
    expect(Object.keys(ZONAS)).toContain(zonaEmFoco(e));
    const r = new Rodada(e, "treino", criarRng(4));
    expect(zonaDominante(r.perguntas)).toBe(r.zona);
  });
});

describe("luta contra o chefe", () => {
  it("as perguntas do chefe vêm todas da zona dele", () => {
    const e = aluno(7, base6);
    const r = new Rodada(e, "chefe", criarRng(2));
    expect(r.chefe).toBe(ZONAS[r.zona]!.chefe.nome);
    for (const q of r.perguntas) expect(POR_ID.get(q.habilidade)!.zona).toBe(r.zona);
    expect(r.energia).toBe(r.energiaMax);
  });

  it("dez acertos zeram a energia, derrotam o chefe e registram o troféu", () => {
    const e = aluno(7, base6);
    const r = new Rodada(e, "chefe", criarRng(3));
    const zona = r.zona;
    let n = 0;
    while (!r.terminou) { r.responder(r.atual()!.resposta, 2000, false); n++; if (!r.avancar()) break; }
    expect(n).toBe(10);
    expect(r.venceu).toBe(true);
    const res = r.concluir();
    expect(res.chefe).toMatchObject({ zona, venceu: true, primeira: true });
    expect(res.bonus.some((b) => b.titulo.includes("derrotado"))).toBe(true);
    expect(e.chefes).toEqual([zona]);
    expect(e.andar).toBe(2);
    expect(res.total).toBe(10);
  });

  it("derrotar o mesmo chefe de novo não repete o troféu", () => {
    const e = aluno(6, base6);
    e.chefes = zonasAbertas(e); // todas as zonas abertas já caíram: é revanche
    const antes = [...e.chefes];
    const r = new Rodada(e, "chefe", criarRng(5));
    expect(antes).toContain(r.zona);
    while (!r.terminou) { r.responder(r.atual()!.resposta, 2000, false); if (!r.avancar()) break; }
    const res = r.concluir();
    expect(res.chefe).toMatchObject({ venceu: true, primeira: false });
    expect(e.chefes).toEqual(antes);
  });

  it("cada erro devolve meia energia e o chefe repõe perguntas até cair", () => {
    const e = aluno(7, base6);
    const r = new Rodada(e, "chefe", criarRng(6));
    const inicial = r.perguntas.length;
    // três erros: a energia continua no máximo, mas gasta vidas
    for (let i = 0; i < 3; i++) { r.responder(errada(r.atual()!), 2000, false); r.avancar(); }
    expect(r.energia).toBe(r.energiaMax);
    expect(r.vidas).toBe(1);
    let guarda = 0;
    while (!r.terminou && guarda++ < 40) { r.responder(r.atual()!.resposta, 2000, false); if (!r.avancar()) break; }
    expect(r.venceu).toBe(true);
    expect(r.perguntas.length).toBeGreaterThan(inicial);
  });

  it("sem vidas o chefe resiste: sem troféu e o andar não avança", () => {
    const e = aluno(7, base6);
    const r = new Rodada(e, "chefe", criarRng(7));
    let guarda = 0;
    while (!r.terminou && guarda++ < 20) { r.responder(errada(r.atual()!), 2000, false); if (!r.avancar()) break; }
    expect(r.falhou).toBe(true);
    const res = r.concluir();
    expect(res.chefe).toMatchObject({ venceu: false, primeira: false });
    expect(e.chefes).toEqual([]);
    expect(e.andar).toBe(1);
    expect(e.quedas).toBe(1);
  });

  it("treino dirigido não vira luta de chefe", () => {
    const e = aluno(7, base6);
    const r = new Rodada(e, "treino", criarRng(8), "tabuada");
    expect(r.chefe).toBe("");
    expect(r.zona).toBe("Fundação");
  });
});
