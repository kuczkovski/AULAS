import { getBackend } from "./backend";
import { ErroNegocio, ErroRede, type EstadoTentativa, type Status } from "./tipos";

/**
 * Estado local da tentativa. O navegador guarda o id da tentativa, as respostas e o que ainda não
 * foi enviado, para tolerar recarregamento e quedas de conexão. A fonte da verdade é o banco.
 */
const CHAVE_ID = "diag:tentativa";
const chaveDados = (id: string) => `diag:dados:${id}`;

export interface DadosLocais {
  respostas: Record<string, string>;
  auto: Record<string, number>;
  /** questões com resposta ainda não confirmada pelo servidor */
  pendResp: string[];
  pendAuto: boolean;
  /** último estado conhecido do servidor, para recarregar sem conexão */
  nome: string;
  turma: string;
  prazo: string;
  /** servidor − relógio do aparelho, em ms */
  deslocamento: number;
}

const tentar = <T,>(fn: () => T, padrao: T): T => { try { return fn(); } catch { return padrao; } };

export const lerId = (): string | null => tentar(() => localStorage.getItem(CHAVE_ID), null);
export const gravarId = (id: string) => tentar(() => localStorage.setItem(CHAVE_ID, id), undefined);
export function limparTentativa() {
  const id = lerId();
  tentar(() => { localStorage.removeItem(CHAVE_ID); if (id) localStorage.removeItem(chaveDados(id)); }, undefined);
}

export function lerDados(id: string): DadosLocais | null {
  return tentar(() => {
    const b = localStorage.getItem(chaveDados(id));
    return b ? (JSON.parse(b) as DadosLocais) : null;
  }, null);
}
export const gravarDados = (id: string, d: DadosLocais) => tentar(() => localStorage.setItem(chaveDados(id), JSON.stringify(d)), undefined);

/** Junta o estado do servidor ao que está guardado aqui (o que ainda está pendente vale mais que o servidor). */
export function mesclar(e: EstadoTentativa, antes: DadosLocais | null): DadosLocais {
  const pendResp = (antes?.pendResp ?? []).filter(q => antes!.respostas[q] !== undefined);
  const respostas = { ...e.respostas };
  for (const q of pendResp) respostas[q] = antes!.respostas[q]!;
  const auto = { ...e.autoavaliacao, ...(antes?.pendAuto ? antes.auto : {}) };
  return {
    respostas, auto, pendResp, pendAuto: antes?.pendAuto ?? false,
    nome: e.nome, turma: e.turma, prazo: e.prazo,
    deslocamento: new Date(e.agora).getTime() - Date.now(),
  };
}

let fila: Promise<unknown> = Promise.resolve();

export interface ResultadoSync {
  /** true quando nada ficou pendente */
  ok: boolean;
  /** se o servidor já encerrou a tentativa */
  encerrada?: Status;
  falhaRede?: boolean;
}

/** Envia o que está pendente, em ordem e uma chamada de cada vez. */
export function sincronizar(id: string): Promise<ResultadoSync> {
  const r = fila.then(() => enviarPendentes(id));
  fila = r.catch(() => undefined);
  return r;
}

async function enviarPendentes(id: string): Promise<ResultadoSync> {
  const backend = await getBackend();
  let d = lerDados(id);
  if (!d) return { ok: true };
  try {
    for (const q of [...d.pendResp]) {
      d = lerDados(id)!;
      const valor = d.respostas[q];
      if (valor !== undefined) {
        try {
          const r = await backend.salvarResposta(id, q, valor);
          if (!r.ok) return { ok: false, encerrada: r.status };
        } catch (e) {
          if (!(e instanceof ErroNegocio)) throw e; // resposta recusada pelo banco: não adianta reenviar
        }
      }
      d = lerDados(id)!;
      // se o aluno trocou a resposta durante o envio, continua pendente
      if (d.respostas[q] === valor) { d.pendResp = d.pendResp.filter(x => x !== q); gravarDados(id, d); }
    }
    d = lerDados(id)!;
    if (d.pendAuto) {
      const enviado = JSON.stringify(d.auto);
      const r = await backend.salvarAutoavaliacao(id, d.auto);
      if (!r.ok) return { ok: false, encerrada: r.status };
      d = lerDados(id)!;
      if (JSON.stringify(d.auto) === enviado) { d.pendAuto = false; gravarDados(id, d); }
    }
  } catch (e) {
    if (e instanceof ErroRede) return { ok: false, falhaRede: true };
    throw e;
  }
  const fim = lerDados(id)!;
  return { ok: fim.pendResp.length === 0 && !fim.pendAuto };
}

export function registrarResposta(id: string, questao: string, valor: string): Promise<ResultadoSync> {
  const d = lerDados(id);
  if (d) {
    d.respostas[questao] = valor;
    if (!d.pendResp.includes(questao)) d.pendResp.push(questao);
    gravarDados(id, d);
  }
  return sincronizar(id);
}

export function registrarAuto(id: string, item: string, valor: number): Promise<ResultadoSync> {
  const d = lerDados(id);
  if (d) {
    d.auto[item] = valor;
    d.pendAuto = true;
    gravarDados(id, d);
  }
  return sincronizar(id);
}
