import { QUESTOES, QUESTAO_POR_ID, DURACAO_SEGUNDOS, TURMAS } from "@/dominio/questoes";
import { GABARITO } from "@/dominio/gabarito";
import { nivelDe, normalizarNumero, pct } from "@/dominio/pontuacao";
import { chaveNome, type DadosBrutos, type LinhaTentativa } from "./analise";
import { ErroNegocio, type Backend, type EstadoTentativa, type Resumo } from "./tipos";
import { DIMS } from "@/dominio/questoes";

/**
 * Modo local: o mesmo contrato do banco, guardado no navegador. Serve para testar a interface
 * sem Supabase. Carrega o gabarito, por isso só entra no pacote quando o Supabase NÃO está configurado.
 */
const CHAVE = "diag:local:v1";

export function lerLocal(): DadosBrutos {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) return JSON.parse(bruto) as DadosBrutos;
  } catch { /* armazenamento indisponível */ }
  return { tentativas: [], respostas: [], autos: [] };
}
export const gravarLocal = (d: DadosBrutos) => localStorage.setItem(CHAVE, JSON.stringify(d));

const prazoDe = (t: LinhaTentativa) => new Date(t.started_at).getTime() + DURACAO_SEGUNDOS * 1000;

function encerrar(d: DadosBrutos, t: LinhaTentativa, porTempo: boolean) {
  const fim = porTempo ? prazoDe(t) : Date.now();
  const certas = d.respostas.filter(r => r.attempt_id === t.id && r.is_correct).length;
  Object.assign(t, {
    status: porTempo ? "encerrada_por_tempo" : "concluida",
    finished_at: new Date(fim).toISOString(),
    duration_seconds: Math.round((fim - new Date(t.started_at).getTime()) / 1000),
    total_correct: certas, total_questions: QUESTOES.length, percentage: pct(certas, QUESTOES.length),
  });
}

function fecharVencidas(d: DadosBrutos) {
  for (const t of d.tentativas) if (t.status === "em_andamento" && Date.now() > prazoDe(t) + 20_000) encerrar(d, t, true);
}

function resumo(d: DadosBrutos, id: string): Resumo {
  const dimensoes = {} as Resumo["dimensoes"];
  for (const dim of DIMS) {
    const qs = QUESTOES.filter(q => q.dim === dim);
    const acertos = qs.filter(q => d.respostas.some(r => r.attempt_id === id && r.question_id === q.id && r.is_correct)).length;
    const p = pct(acertos, qs.length);
    dimensoes[dim] = { acertos, total: qs.length, pct: Math.round(p * 10) / 10, nivel: nivelDe(p) };
  }
  return { dimensoes, total_correct: d.respostas.filter(r => r.attempt_id === id && r.is_correct).length, total_questions: QUESTOES.length };
}

function estado(d: DadosBrutos, t: LinhaTentativa): EstadoTentativa {
  return {
    id: t.id, nome: t.student_name, turma: t.class_name, status: t.status,
    inicio: t.started_at, prazo: new Date(prazoDe(t)).toISOString(), agora: new Date().toISOString(),
    respostas: Object.fromEntries(d.respostas.filter(r => r.attempt_id === t.id).map(r => [r.question_id, r.student_answer])),
    autoavaliacao: Object.fromEntries(d.autos.filter(a => a.attempt_id === t.id).map(a => [a.item, a.score])),
    resumo: t.status === "em_andamento" ? null : resumo(d, t.id),
  };
}

function achar(d: DadosBrutos, id: string): LinhaTentativa {
  const t = d.tentativas.find(x => x.id === id);
  if (!t) throw new ErroNegocio("tentativa-inexistente");
  return t;
}

/** Devolve a tentativa se ainda aceita alterações; fecha por tempo se o prazo passou. */
function aberta(d: DadosBrutos, id: string): LinhaTentativa | { ok: false; status: LinhaTentativa["status"] } {
  const t = achar(d, id);
  if (t.status === "em_andamento" && Date.now() > prazoDe(t) + 20_000) { encerrar(d, t, true); gravarLocal(d); }
  return t.status === "em_andamento" ? t : { ok: false, status: t.status };
}

export const backendLocal: Backend = {
  async iniciar(nome, turma, continuar) {
    const limpo = nome.trim().replace(/\s+/g, " ");
    if (limpo.length < 3 || limpo.length > 120 || !limpo.includes(" ")) throw new ErroNegocio("nome-invalido");
    if (!(TURMAS as readonly string[]).includes(turma)) throw new ErroNegocio("turma-invalida");
    const d = lerLocal();
    fecharVencidas(d);
    const chave = chaveNome(limpo);
    const atual = d.tentativas.find(t => t.status === "em_andamento" && t.class_name === turma && chaveNome(t.student_name) === chave);
    gravarLocal(d);
    if (atual) {
      if (continuar) return estado(d, atual);
      return { conflito: true, respondidas: d.respostas.filter(r => r.attempt_id === atual.id).length, inicio: atual.started_at };
    }
    const t: LinhaTentativa = {
      id: crypto.randomUUID(), student_name: limpo, class_name: turma, started_at: new Date().toISOString(),
      finished_at: null, duration_seconds: null, status: "em_andamento", total_correct: null, total_questions: null, percentage: null,
    };
    d.tentativas.push(t);
    gravarLocal(d);
    return estado(d, t);
  },

  async obter(id) {
    const d = lerLocal();
    fecharVencidas(d);
    gravarLocal(d);
    return estado(d, achar(d, id));
  },

  async salvarResposta(id, questao, resposta) {
    const d = lerLocal();
    const t = aberta(d, id);
    if ("ok" in t) return t;
    const q = QUESTAO_POR_ID[questao];
    if (!q) throw new ErroNegocio("questao-invalida");
    let valor: string;
    if (q.tipo === "multipla") {
      if (!q.opcoes!.includes(resposta)) throw new ErroNegocio("resposta-invalida");
      valor = resposta;
    } else {
      const n = normalizarNumero(resposta);
      if (n === null) throw new ErroNegocio("resposta-invalida");
      valor = n;
    }
    const certa = q.tipo === "multipla" ? valor === GABARITO[q.id] : Number(valor) === Number(GABARITO[q.id]);
    const linha = d.respostas.find(r => r.attempt_id === id && r.question_id === questao);
    if (linha) Object.assign(linha, { student_answer: valor, is_correct: certa });
    else d.respostas.push({ attempt_id: id, question_id: questao, student_answer: valor, is_correct: certa, skill: q.dim });
    gravarLocal(d);
    return { ok: true };
  },

  async salvarAutoavaliacao(id, itens) {
    const d = lerLocal();
    const t = aberta(d, id);
    if ("ok" in t) return t;
    for (const [item, score] of Object.entries(itens)) {
      if (!/^A[1-7]$/.test(item) || !Number.isInteger(score) || score < 1 || score > 4) throw new ErroNegocio("autoavaliacao-invalida");
      const linha = d.autos.find(a => a.attempt_id === id && a.item === item);
      if (linha) linha.score = score; else d.autos.push({ attempt_id: id, item, score });
    }
    gravarLocal(d);
    return { ok: true };
  },

  async finalizar(id, porTempo) {
    const d = lerLocal();
    const t = achar(d, id);
    if (t.status === "em_andamento") {
      if (Date.now() >= prazoDe(t)) encerrar(d, t, true);
      else if (porTempo) { if (Date.now() >= prazoDe(t) - 10_000) encerrar(d, t, true); else throw new ErroNegocio("tempo-nao-esgotado"); }
      else {
        if (d.respostas.filter(r => r.attempt_id === id).length < QUESTOES.length) throw new ErroNegocio("incompleta");
        encerrar(d, t, false);
      }
      gravarLocal(d);
    }
    return estado(d, t);
  },
};
