import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export type AuthUser = { id: string; token: string };

function header(req: VercelRequest, name: string): string | null {
  const value = req.headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/** Bearer do header, ou userToken/user_token no body (clientes antigos). */
export function readAccessToken(req: VercelRequest): string | null {
  const raw = header(req, "authorization");
  if (raw) {
    const match = raw.match(/^Bearer\s+(\S+)/i);
    if (match?.[1]) return match[1].trim();
  }
  const body = req.body as { userToken?: unknown; user_token?: unknown } | undefined;
  const fromBody = body?.userToken ?? body?.user_token;
  if (typeof fromBody === "string" && fromBody.trim()) return fromBody.trim();
  return null;
}

/**
 * Valida o JWT no Supabase Auth e devolve 401 antes de qualquer chamada
 * a provedor de IA ou trabalho pesado. Retorna null quando a resposta já foi enviada.
 */
export async function requireUser(req: VercelRequest, res: VercelResponse): Promise<AuthUser | null> {
  const token = readAccessToken(req);
  if (!token) {
    res.status(401).json({ error: "Não autenticado" });
    return null;
  }

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    res.status(500).json({ error: "Supabase não configurado" });
    return null;
  }

  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "Não autenticado" });
    return null;
  }
  return { id: data.user.id, token };
}
