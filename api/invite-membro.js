// ARQUIVO GERADO por scripts/bundle-api.mjs — NÃO EDITAR.
// Edite src/server/http/ e rode npm run build.


// src/server/http/invite-membro.ts
import { createClient as createClient2 } from "@supabase/supabase-js";

// src/server/require-user.ts
import { createClient } from "@supabase/supabase-js";
function header(req, name) {
  const value = req.headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
function readAccessToken(req) {
  const raw = header(req, "authorization");
  if (raw) {
    const match = raw.match(/^Bearer\s+(\S+)/i);
    if (match?.[1]) return match[1].trim();
  }
  const body = req.body;
  const fromBody = body?.userToken ?? body?.user_token;
  if (typeof fromBody === "string" && fromBody.trim()) return fromBody.trim();
  return null;
}
async function requireUser(req, res) {
  const token = readAccessToken(req);
  if (!token) {
    res.status(401).json({ error: "N\xE3o autenticado" });
    return null;
  }
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    res.status(500).json({ error: "Supabase n\xE3o configurado" });
    return null;
  }
  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "N\xE3o autenticado" });
    return null;
  }
  return { id: data.user.id, token };
}

// src/server/http/invite-membro.ts
async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const auth = await requireUser(req, res);
  if (!auth) return;
  const { email, role } = req.body ?? {};
  const userToken = auth.token;
  if (!email || !role) return res.status(400).json({ error: "email e role s\xE3o obrigat\xF3rios" });
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return res.status(500).json({ error: "Supabase n\xE3o configurado" });
  const supabaseUser = createClient2(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${userToken}` } }
  });
  const { data: membroData } = await supabaseUser.from("empresa_membros").select("empresa_id, role").single();
  if (!membroData) return res.status(403).json({ error: "Usu\xE1rio n\xE3o tem empresa" });
  if (membroData.role !== "owner" && membroData.role !== "admin") {
    return res.status(403).json({ error: "Apenas owner/admin podem convidar membros" });
  }
  const empresaId = membroData.empresa_id;
  if (serviceKey) {
    const supabaseAdmin = createClient2(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { empresa_id: empresaId, role_convite: role },
      redirectTo: `${process.env.SITE_URL ?? "https://planne.vercel.app"}/app`
    });
    if (error) return res.status(400).json({ error: error.message });
    const userId = data.user?.id;
    if (userId) {
      await supabaseAdmin.from("empresa_membros").upsert({
        user_id: userId,
        empresa_id: empresaId,
        role
      }, { onConflict: "user_id,empresa_id" });
    }
    return res.json({ ok: true, message: `Convite enviado para ${email}` });
  }
  return res.status(501).json({
    error: "SUPABASE_SERVICE_ROLE_KEY n\xE3o configurada no servidor. Configure a vari\xE1vel de ambiente para habilitar convites por email."
  });
}
export {
  handler as default
};
