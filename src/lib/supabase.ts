import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar definidos no .env.local");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Detecta se um erro é de conectividade (backend inalcançável) — o caso mais
 * comum é o projeto Supabase do plano free ter sido pausado por inatividade,
 * o que remove o host do DNS (ERR_NAME_NOT_RESOLVED / "Failed to fetch").
 * Distingue isso de erros de credencial/validação, que têm mensagem própria.
 */
export function isConnectionError(err: unknown): boolean {
  const msg = (
    err instanceof Error ? err.message
      : typeof err === "string" ? err
        : (err as { message?: string })?.message ?? ""
  ).toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("network error") ||
    msg.includes("err_name_not_resolved") ||
    msg.includes("err_connection") ||
    msg.includes("fetch failed") ||
    msg.includes("load failed") ||
    msg.includes("conexao_indisponivel")
  );
}
