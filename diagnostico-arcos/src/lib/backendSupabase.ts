import { getSupabase } from "./supabase";
import { ErroNegocio, ErroRede, type Backend, type EstadoTentativa, type ResultadoInicio, type Status } from "./tipos";

/** Chama uma função do banco. Erro de regra (P0001) vira ErroNegocio; qualquer outra falha, ErroRede. */
async function rpc<T>(nome: string, args: Record<string, unknown>): Promise<T> {
  const sb = getSupabase();
  if (!sb) throw new ErroRede("Supabase não configurado");
  let res;
  try {
    res = await sb.rpc(nome, args);
  } catch {
    throw new ErroRede("sem conexão");
  }
  if (res.error) {
    if (res.error.code === "P0001") throw new ErroNegocio(res.error.message);
    throw new ErroRede(res.error.message);
  }
  return res.data as T;
}

export const backendSupabase: Backend = {
  iniciar: (nome, turma, continuar) =>
    rpc<ResultadoInicio>("iniciar_tentativa", { p_nome: nome, p_turma: turma, p_continuar: continuar }),
  obter: id => rpc<EstadoTentativa>("obter_tentativa", { p_id: id }),
  salvarResposta: (id, questao, resposta) =>
    rpc<{ ok: boolean; status?: Status }>("salvar_resposta", { p_id: id, p_questao: questao, p_resposta: resposta }),
  salvarAutoavaliacao: (id, itens) =>
    rpc<{ ok: boolean; status?: Status }>("salvar_autoavaliacao", { p_id: id, p_itens: itens }),
  finalizar: (id, porTempo) => rpc<EstadoTentativa>("finalizar_tentativa", { p_id: id, p_por_tempo: porTempo }),
};
