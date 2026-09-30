import { QUESTOES, TURMAS } from "@/dominio/questoes";
import { GABARITO } from "@/dominio/gabarito";
import type { DadosBrutos } from "./analise";

const NOMES = ["Ana", "Bruno", "Carla", "Davi", "Eva", "Fábio", "Gabi", "Hugo", "Iara", "João", "Lia", "Marcos", "Nina", "Otávio", "Paula", "Rafael", "Sara", "Tiago", "Vera", "Yuri"];
const SOBRENOMES = ["Souza", "Lima", "Dias", "Rocha", "Braga", "Melo", "Nunes", "Alves", "Costa", "Pires", "Freitas", "Barros"];

/** Gerador pseudoaleatório determinístico, para a demonstração ser sempre igual. */
function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Facilidade de cada dimensão por turma (chance de acerto), imitando o exemplo do roteiro. */
const CHANCE: Record<string, [number, number, number, number]> = {
  "1º A": [0.84, 0.71, 0.79, 0.54], "1º B": [0.77, 0.58, 0.74, 0.41], "1º C": [0.91, 0.82, 0.86, 0.67],
  "1º D": [0.7, 0.5, 0.65, 0.35], "1º E": [0.88, 0.75, 0.8, 0.5],
};

export function gerarDadosDemo(): DadosBrutos {
  const rnd = mulberry32(2026);
  const d: DadosBrutos = { tentativas: [], respostas: [], autos: [] };
  let n = 0;
  for (const turma of TURMAS) {
    for (let i = 0; i < 18; i++) {
      const id = crypto.randomUUID();
      const nome = `${NOMES[(i + n) % NOMES.length]} ${SOBRENOMES[(i * 7 + n) % SOBRENOMES.length]}`;
      const habil = (rnd() - 0.5) * 0.3;
      let certas = 0;
      const chance = CHANCE[turma]!;
      for (const q of QUESTOES) {
        if (i === 17 && rnd() < 0.5) continue; // alguns deixam questões sem resposta (tempo esgotado)
        const p = chance["D1 D2 D3 D4".split(" ").indexOf(q.dim)]! + habil;
        const acertou = rnd() < p;
        if (acertou) certas++;
        const errada = q.tipo === "multipla" ? q.opcoes!.find(o => o !== GABARITO[q.id]) : String(Math.round(rnd() * 3) * 30 + 45);
        d.respostas.push({ attempt_id: id, question_id: q.id, skill: q.dim, is_correct: acertou, student_answer: acertou ? GABARITO[q.id]! : errada! });
      }
      const porTempo = i === 17;
      d.tentativas.push({
        id, student_name: nome, class_name: turma,
        started_at: new Date(Date.UTC(2026, 9, 1, 13, 0, 0) + i * 1000).toISOString(),
        finished_at: null, duration_seconds: porTempo ? 3600 : Math.round(1500 + rnd() * 1500),
        status: porTempo ? "encerrada_por_tempo" : "concluida", total_correct: certas, total_questions: 15, percentage: (100 * certas) / 15,
      });
      const base = Math.min(4, Math.max(1, Math.round(1 + (certas / 15) * 3 + (rnd() - 0.5) * 2.4)));
      for (let k = 1; k <= 7; k++) d.autos.push({ attempt_id: id, item: `A${k}`, score: Math.min(4, Math.max(1, base + Math.round((rnd() - 0.5) * 1.5))) });
    }
    n += 3;
  }
  return d;
}
