import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export const supabaseConfigurado = Boolean(url && anonKey);

/** Cliente Supabase, ou `null` no modo local (sem variáveis de ambiente). */
export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigurado || typeof window === "undefined") return null;
  // alunos não têm sessão; só o professor entra (e a sessão dele fica guardada)
  client ??= createClient(url as string, anonKey as string, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return client;
}
