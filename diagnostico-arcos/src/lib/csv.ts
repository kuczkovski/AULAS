/**
 * CSV para Excel/Planilhas em pt-BR (separador ";"). Como o nome vem do próprio aluno, células que
 * começam com = + - @ (ou tab/CR) ganham um apóstrofo para não virarem fórmula ao abrir na planilha.
 */
export function celulaCsv(valor: string | number | null | undefined): string {
  let t = valor === null || valor === undefined ? "" : String(valor);
  if (/^[=+\-@\t\r]/.test(t)) t = "'" + t;
  return /[;"\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

export const linhasParaCsv = (linhas: (string | number | null | undefined)[][]) =>
  "﻿" + linhas.map(l => l.map(celulaCsv).join(";")).join("\r\n") + "\r\n";

export function baixarCsv(nome: string, conteudo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}
