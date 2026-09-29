import { chaveFato, obterFato, registrar } from "./dominio";
import { gerarPergunta } from "./gerar";
import { HABILIDADES } from "./habilidades";
import { verificar } from "./resposta";
import { criarRng } from "./rng";
import type { EstadoAluno, Habilidade, Pergunta, Rng } from "./tipos";

export const MAX_PERGUNTAS_NIVELAMENTO = 30;

/**
 * Teste de nivelamento adaptativo. Percorre as habilidades na ordem dos
 * requisitos: uma habilidade só é testada se todos os requisitos foram
 * dominados. Uma pergunta certa marca a habilidade como conhecida; um erro
 * pede uma segunda pergunta, e só dois erros a reprovam. As respostas são
 * digitadas sempre que possível, para o chute não inflar o resultado.
 */
export class Nivelamento {
  private ordem: Habilidade[];
  private passadas = new Set<string>();
  private idx = -1;
  private tentativa = 0;
  private atualP: Pergunta | null = null;
  private feitas = 0;
  private usadas = new Set<string>();

  constructor(
    private e: EstadoAluno,
    private r: Rng = criarRng(),
  ) {
    this.ordem = HABILIDADES.filter((h) => h.ano <= e.ano);
    this.proximaHabilidade();
  }

  get respondidas() {
    return this.feitas;
  }
  /** Estimativa de progresso de 0 a 1, para a barra da tela. */
  get progresso() {
    return Math.min(1, this.feitas / Math.min(MAX_PERGUNTAS_NIVELAMENTO, this.ordem.length + 4));
  }
  get terminou() {
    return this.atualP === null;
  }
  atual() {
    return this.atualP;
  }

  private podeTestar(h: Habilidade) {
    return h.requisitos.every((id) => this.passadas.has(id));
  }

  private proximaHabilidade() {
    this.tentativa = 0;
    this.usadas.clear();
    do this.idx++;
    while (this.idx < this.ordem.length && !this.podeTestar(this.ordem[this.idx]!));
    this.montar();
  }

  private montar() {
    const h = this.ordem[this.idx];
    if (!h || this.feitas >= MAX_PERGUNTAS_NIVELAMENTO) { this.atualP = null; return; }
    /* categorias vêm da mais fácil para a mais difícil: em habilidades grandes
       (tabuada) testa-se a metade difícil, senão um fato fácil aprovaria tudo */
    const alvo = h.categorias.length >= 10 ? h.categorias.slice(Math.floor(h.categorias.length / 2)) : h.categorias;
    const livres = alvo.filter((c) => !this.usadas.has(c));
    const cat = this.r.pick(livres.length ? livres : alvo);
    this.usadas.add(cat);
    this.atualP = gerarPergunta(h, cat, this.r, true);
  }

  responder(bruto: string, dtMs: number): boolean {
    const p = this.atualP;
    if (!p) throw new Error("nivelamento encerrado");
    const ok = verificar(p, bruto);
    registrar(obterFato(this.e.fatos, chaveFato(p.habilidade, p.cat)), ok, dtMs, 0);
    this.feitas++;
    this.tentativa++;
    if (ok) {
      this.passadas.add(p.habilidade);
      this.proximaHabilidade();
    } else if (this.tentativa >= 2) {
      this.proximaHabilidade();
    } else {
      this.montar();
    }
    return ok;
  }

  /** Grava o resultado no estado do aluno. */
  concluir() {
    this.e.colocadas = [...this.passadas];
    this.e.nivelamentoFeito = true;
    return { colocadas: this.e.colocadas };
  }
}
