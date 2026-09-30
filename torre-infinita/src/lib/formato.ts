/** Troca o hífen por sinal de menos verdadeiro quando ele indica número negativo. */
export const sinal = (t: string) => t.replace(/(^|[\s(=×÷+])-(?=\d)/g, "$1−");

export const pt = (n: number) => n.toLocaleString("pt-BR");
