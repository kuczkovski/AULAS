/** Subcaminho de publicação (vazio quando o app fica na raiz do domínio). */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefixa um caminho absoluto com o subcaminho de publicação. */
export function withBase(path: string): string {
  return `${BASE_PATH}${path}`;
}
