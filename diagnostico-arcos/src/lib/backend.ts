import type { Backend } from "./tipos";

/**
 * Escolhe o backend. A condição lê a variável diretamente para que a build de produção
 * (com o Supabase configurado) descarte o ramo local e o gabarito não vá ao navegador do aluno.
 */
export async function getBackend(): Promise<Backend> {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (await import("./backendSupabase")).backendSupabase;
  }
  return (await import("./backendLocal")).backendLocal;
}
