import type { Habilidade } from "../tipos";
import { decimais, divisao, divisibilidade, mmcMdc, ordemOperacoes, potencias, somaSub, tabuada } from "./base6";
import { fracaoComparar, fracaoDeQuantidade, fracaoEquivalente, fracaoSimplificar } from "./fracoes";
import { equacao1grau, inteirosMult, inteirosSoma, porcentagem, razaoProporcao } from "./ano7";
import { encontreErroEquacao, encontreErroOrdem, fracaoNaReta, inteirosNaReta, ordenarRacionais, problemas6 } from "./formatos";
import { problemas7, problemas8, problemas9 } from "./problemas";
import { equacao2grau, estatistica, notacaoCientifica, pitagoras, potenciasRegras, raizQuadrada, valorNumerico } from "./ano89";

/** Ordem topológica: toda habilidade vem depois de seus requisitos. */
export const HABILIDADES: Habilidade[] = [
  somaSub, tabuada, divisao, ordemOperacoes, potencias, divisibilidade, decimais, mmcMdc,
  fracaoEquivalente, fracaoSimplificar, fracaoDeQuantidade, fracaoComparar,
  inteirosSoma, inteirosMult, porcentagem, razaoProporcao, equacao1grau,
  potenciasRegras, raizQuadrada, valorNumerico, notacaoCientifica,
  equacao2grau, pitagoras, estatistica,
  // formatos com toque, leitura crítica e problemas: entram na prática, não no nivelamento
  ordenarRacionais, fracaoNaReta, inteirosNaReta, encontreErroOrdem, encontreErroEquacao, problemas6,
  problemas7, problemas8, problemas9,
];

export const POR_ID = new Map(HABILIDADES.map((h) => [h.id, h]));
