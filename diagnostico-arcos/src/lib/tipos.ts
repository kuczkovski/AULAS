import type { Dim } from "@/dominio/questoes";
import type { Nivel } from "@/dominio/pontuacao";

export type Status = "em_andamento" | "concluida" | "encerrada_por_tempo";

export interface ResumoDim { acertos: number; total: number; pct: number; nivel: Nivel }

export interface Resumo {
  dimensoes: Record<Dim, ResumoDim>;
  total_correct: number;
  total_questions: number;
}

/** Estado de uma tentativa, como o aluno a enxerga (sem gabarito nem correção). */
export interface EstadoTentativa {
  id: string;
  nome: string;
  turma: string;
  status: Status;
  inicio: string;
  prazo: string;
  /** Hora do servidor no momento da resposta; serve para corrigir o relógio do aluno. */
  agora: string;
  respostas: Record<string, string>;
  autoavaliacao: Record<string, number>;
  resumo: Resumo | null;
}

export type ResultadoInicio = EstadoTentativa | { conflito: true; respondidas: number; inicio: string };

export interface Backend {
  iniciar(nome: string, turma: string, continuar: boolean): Promise<ResultadoInicio>;
  obter(id: string): Promise<EstadoTentativa>;
  salvarResposta(id: string, questao: string, resposta: string): Promise<{ ok: boolean; status?: Status }>;
  salvarAutoavaliacao(id: string, itens: Record<string, number>): Promise<{ ok: boolean; status?: Status }>;
  finalizar(id: string, porTempo: boolean): Promise<EstadoTentativa>;
}

/** Erro de regra de negócio vindo do banco (mensagem = código, ex.: "nome-invalido"). */
export class ErroNegocio extends Error {}
/** Falha de conexão: a operação pode ser repetida depois. */
export class ErroRede extends Error {}

const MENSAGENS: Record<string, string> = {
  "nome-invalido": "Escreva seu nome completo (nome e sobrenome).",
  "turma-invalida": "Escolha uma das turmas da lista.",
  "tentativa-inexistente": "Não encontramos essa avaliação. Volte ao início e identifique-se de novo.",
  "resposta-invalida": "Essa resposta não é válida. Use apenas números, por exemplo 90.",
  "incompleta": "Ainda há questões sem resposta.",
  "tempo-nao-esgotado": "O tempo ainda não acabou.",
};
export const mensagemDeErro = (e: unknown) =>
  e instanceof ErroNegocio
    ? (MENSAGENS[e.message] ?? "Algo deu errado. Avise o professor.")
    : "Sem conexão com o servidor. Suas respostas ficam guardadas neste aparelho e serão enviadas quando a conexão voltar.";
