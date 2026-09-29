import { chaveFato, obterFato, registrar } from "./dominio";
import { aplicarXp, hojeISO } from "./estado";
import { assinaturaDe, gerarPergunta } from "./gerar";
import { POR_ID } from "./habilidades";
import { criarRng } from "./rng";
import { CONFIG_RODADA, chefeDaVez, desbloqueadas, montarRodada, perguntaDe, zonaDominante, type TipoRodada } from "./selecao";
import { infoZona } from "./zonas";
import type { EstadoAluno, Pergunta, Rng } from "./tipos";
import { verificar } from "./resposta";

export interface ResultadoResposta {
  ok: boolean;
  ganhos: number;
  rapido: boolean;
  reforco: boolean;
}

export interface ResumoRodada {
  falhou: boolean;
  zona: string;
  /** Só em rodadas de chefe. */
  chefe?: { nome: string; zona: string; venceu: boolean; primeira: boolean };
  acertos: number;
  total: number;
  pontos: number;
  bonus: { titulo: string; valor: number }[];
  xpGanho: number;
  niveisSubidos: number;
  melhorSequencia: number;
  tempoMedioMs: number;
  novasHabilidades: string[];
  fracas: { habilidade: string; cat: string }[];
}

export class Rodada {
  readonly tipo: TipoRodada;
  readonly perguntas: Pergunta[];
  readonly vidasMax: number;
  readonly chefe: string;
  /** Zona da rodada: a do chefe ou a que mais aparece nas perguntas. */
  readonly zona: string;
  /** Energia do chefe: cada acerto tira 1, cada erro devolve 0,5. */
  energia = 0;
  readonly energiaMax: number = 10;
  venceu = false;
  /** Dois tropeços seguidos no mesmo andar: vidas extras e dicas sem custo. */
  readonly guiada: boolean;
  i = 0;
  vidas: number;
  acertos = 0;
  erros = 0;
  pontos = 0;
  sequencia = 0;
  melhorSequencia = 0;
  falhou = false;
  /** 1 acerto, 0 erro, um por pergunta original (reforços não contam). */
  marcas: (1 | 0 | undefined)[] = [];
  private tempos: number[] = [];
  private antes: Set<string>;

  constructor(
    private e: EstadoAluno,
    tipo: TipoRodada,
    private r: Rng = criarRng(),
    /** Treino dirigido: todas as perguntas vêm desta habilidade. */
    readonly foco?: string,
  ) {
    this.tipo = tipo;
    this.guiada = e.quedas >= 2;
    const cfg = CONFIG_RODADA[tipo];
    this.vidasMax = this.guiada ? Math.max(5, cfg.vidas) : cfg.vidas;
    this.vidas = this.vidasMax;
    const zonaChefe = tipo === "chefe" && !foco ? chefeDaVez(e) : "";
    this.perguntas = montarRodada(e, tipo, r, foco, zonaChefe ? { zona: zonaChefe } : {});
    this.chefe = zonaChefe ? infoZona(zonaChefe).chefe.nome : "";
    this.zona = zonaChefe || zonaDominante(this.perguntas);
    if (zonaChefe) this.energia = this.energiaMax;
    this.antes = new Set(desbloqueadas(e).map((h) => h.id));
  }

  get total() {
    return CONFIG_RODADA[this.tipo].n;
  }
  atual(): Pergunta | null {
    return this.perguntas[this.i] ?? null;
  }
  get terminou() {
    return this.falhou || this.venceu || this.i >= this.perguntas.length;
  }

  responder(bruto: string, dtMs: number, usouDica: boolean): ResultadoResposta {
    const p = this.atual();
    if (!p) throw new Error("rodada sem pergunta atual");
    const ok = verificar(p, bruto);
    const f = obterFato(this.e.fatos, chaveFato(p.habilidade, p.cat));
    registrar(f, ok, dtMs, this.e.rodadas);
    this.e.respondidas++;
    if (ok) this.e.acertos++;
    this.tempos.push(dtMs);

    const reforco = !!p.reforco;
    let ganhos = 0, rapido = false;
    if (ok) {
      this.sequencia++;
      this.melhorSequencia = Math.max(this.melhorSequencia, this.sequencia);
      if (!reforco) {
        this.acertos++;
        this.marcas[this.marcaIndice()] = 1;
        rapido = dtMs < p.esperadoMs * 0.6 && !usouDica;
        // responder sem alternativas à vista vale mais que marcar
        const base = p.formato === "escolha" || p.formato === "vf" ? 10 : 15;
        const combo = Math.min(2, 1 + this.sequencia * 0.1);
        ganhos = Math.round(base * combo * (rapido ? 1.5 : 1) * (usouDica && !this.guiada ? 0.5 : 1) * CONFIG_RODADA[this.tipo].mult);
        this.pontos += ganhos;
        if (this.chefe) {
          this.energia = Math.max(0, this.energia - 1);
          if (this.energia <= 0) this.venceu = true;
        }
      } else {
        ganhos = 3;
        this.pontos += 3;
      }
    } else {
      this.sequencia = 0;
      if (!reforco) {
        this.erros++;
        this.marcas[this.marcaIndice()] = 0;
        this.vidas--;
        if (this.chefe) this.energia = Math.min(this.energiaMax, this.energia + 0.5);
        if (this.vidas <= 0) this.falhou = true;
        this.agendarReforco(p);
      }
    }
    return { ok, ganhos, rapido, reforco };
  }

  /** Passa para a próxima pergunta. Retorna false quando a rodada acabou. */
  avancar(): boolean {
    this.i++;
    // o chefe só cai quando a energia zera: repõe perguntas até um limite
    if (this.chefe && !this.venceu && !this.falhou && this.i >= this.perguntas.length) {
      if (this.perguntas.length >= 30) this.falhou = true;
      else this.perguntas.push(...montarRodada(this.e, "chefe", this.r, undefined, { n: 6, zona: this.zona }));
    }
    return !this.terminou;
  }

  private marcaIndice(): number {
    return this.perguntas.slice(0, this.i + 1).filter((q) => !q.reforco).length - 1;
  }

  /** Errou? A mesma habilidade volta em 3 perguntas, com números novos. */
  private agendarReforco(p: Pergunta) {
    const h = POR_ID.get(p.habilidade);
    if (!h || this.falhou) return;
    let q = gerarPergunta(h, p.cat, this.r, false, true);
    for (let t = 0; t < 8 && assinaturaDe(q) === assinaturaDe(p); t++) q = gerarPergunta(h, p.cat, this.r, false, true);
    this.perguntas.splice(Math.min(this.i + 4, this.perguntas.length), 0, q);
  }

  /** Aplica o resultado da rodada ao estado do aluno e devolve o resumo. */
  concluir(): ResumoRodada {
    const bonus: { titulo: string; valor: number }[] = [];
    if (!this.falhou) {
      if (this.chefe && this.venceu) bonus.push({ titulo: `${this.chefe} derrotado`, valor: Math.round(this.pontos * 0.3) });
      if (this.erros === 0) bonus.push({ titulo: "Sem nenhum erro", valor: Math.round(this.pontos * 0.4) });
      if (this.melhorSequencia >= 8) bonus.push({ titulo: `Sequência de ${this.melhorSequencia}`, valor: this.melhorSequencia * 5 });
    }
    const extra = bonus.reduce((s, b) => s + b.valor, 0);
    this.pontos += extra;

    const respondidas = Math.max(1, this.marcas.filter((m) => m !== undefined).length);
    const taxa = this.acertos / respondidas;
    const xpGanho = Math.round(this.pontos * (0.4 + 0.6 * taxa));
    const niveisSubidos = aplicarXp(this.e, xpGanho);

    const e = this.e;
    e.rodadas++;
    // treino dirigido é prática livre: não mexe em andar nem em quedas
    if (!this.foco) {
      if (this.falhou) e.quedas++;
      else { e.quedas = 0; e.andar++; }
    }
    e.melhorSequencia = Math.max(e.melhorSequencia, this.melhorSequencia);
    const hoje = hojeISO();
    if (!e.dias.includes(hoje)) e.dias = [...e.dias, hoje].slice(-90);

    const primeira = this.venceu && !e.chefes.includes(this.zona);
    if (primeira) e.chefes = [...e.chefes, this.zona];

    const novas = desbloqueadas(e).filter((h) => !this.antes.has(h.id)).map((h) => h.id);
    const fracas = this.marcas.length
      ? this.perguntas.filter((q) => !q.reforco).map((q, k) => ({ q, m: this.marcas[k] })).filter((x) => x.m === 0).map((x) => ({ habilidade: x.q.habilidade, cat: x.q.cat }))
      : [];
    return {
      falhou: this.falhou,
      zona: this.zona,
      chefe: this.chefe ? { nome: this.chefe, zona: this.zona, venceu: this.venceu, primeira } : undefined,
      acertos: this.acertos,
      total: this.falhou || this.chefe ? respondidas : this.total,
      pontos: this.pontos,
      bonus,
      xpGanho,
      niveisSubidos,
      melhorSequencia: this.melhorSequencia,
      tempoMedioMs: this.tempos.length ? this.tempos.reduce((s, v) => s + v, 0) / this.tempos.length : 0,
      novasHabilidades: novas,
      fracas,
    };
  }
}

export { perguntaDe };
