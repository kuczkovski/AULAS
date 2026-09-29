/** Utilitários de formatação e correção de respostas em texto. */

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
export const sup = (n: number) =>
  String(n).split("").map((c) => (c === "-" ? "⁻" : SUP[Number(c)] ?? c)).join("");

/** Número no padrão brasileiro: vírgula decimal e sinal de menos tipográfico ausente (usa "-"). */
export function num(n: number): string {
  const s = String(Math.round(n * 1e9) / 1e9);
  return s.replace(".", ",");
}

/** Parênteses em negativos dentro de expressões: 3 + (-4). */
export const par = (n: number) => (n < 0 ? `(${n})` : String(n));

export const mdc = (a: number, b: number): number => (b === 0 ? Math.abs(a) : mdc(b, a % b));
export const mmc = (a: number, b: number) => Math.abs(a * b) / mdc(a, b);

export function frac(n: number, d: number) {
  return `${n}/${d}`;
}

/** Forma canônica para comparar respostas digitadas. */
export function canonico(bruto: string): string {
  let s = bruto.trim().toLowerCase().replace(/\s+/g, "");
  s = s.replace(/[−–—]/g, "-").replace(",", ".");
  if (/^-?\d+\/-?\d+$/.test(s)) {
    let [n, d] = s.split("/").map(Number) as [number, number];
    if (d < 0) [n, d] = [-n, -d];
    return `${n}/${d}`;
  }
  if (/^-?\d*\.?\d+$/.test(s)) return String(Number(s));
  return s;
}
