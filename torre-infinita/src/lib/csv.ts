import { celulaDoMapa } from "@/engine/analise";
import { HABILIDADES } from "@/engine/habilidades";
import type { AlunoLinha, Turma } from "./professor";

/**
 * Escapa uma célula para CSV do Excel em português (separador ";").
 * Textos que começam com = + - @ ganham um apóstrofo, para o Excel não os
 * tratar como fórmula (injeção de fórmula por nomes digitados).
 */
export function celula(v: string | number | null | undefined): string {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s) && typeof v === "string") s = "'" + s;
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const data = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

/** Planilha da turma: uma linha por aluno, com o domínio de cada habilidade em porcentagem. */
export function gerarCsv(turma: Pick<Turma, "ano">, alunos: AlunoLinha[]): string {
  const habilidades = HABILIDADES.filter((h) => h.ano <= turma.ano);
  const cab = [
    "Nome", "Código", "Apelido", "Nível", "Andar", "Acerto (%)", "Evolução (0-100)", "Pontos da semana",
    "Minutos da semana", "Rodadas da semana", "Chefes derrotados", "Última atividade",
    ...habilidades.map((h) => `Domínio: ${h.nome} (%)`),
  ];
  const linhas = alunos.map((a) => {
    const e = a.estado;
    return [
      a.nome, a.codigo, a.apelido ?? "", e?.nivel ?? "", e?.andar ?? "",
      e?.respondidas ? Math.round((e.acertos / e.respondidas) * 100) : "",
      a.evolucao ?? "", a.pontosSemana, a.minutosSemana, a.rodadasSemana, e?.chefes?.length ?? 0,
      data(a.ultima ?? a.atualizadoEm),
      ...habilidades.map((h) => {
        const c = celulaDoMapa(e, h.id);
        return c.d === null ? "" : Math.round(c.d * 100);
      }),
    ].map(celula).join(";");
  });
  // BOM para o Excel reconhecer UTF-8; quebra de linha do Windows
  return "﻿" + [cab.map(celula).join(";"), ...linhas].join("\r\n") + "\r\n";
}

export function baixarCsv(nomeArquivo: string, conteudo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: nomeArquivo });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
