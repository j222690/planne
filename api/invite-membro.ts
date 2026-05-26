import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, role, userToken } = req.body as { email: string; role: string; userToken: string };

  if (!email || !role) return res.status(400).json({ error: "email e role são obrigatórios" });
  if (!userToken) return res.status(401).json({ error: "Token não fornecido" });

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) return res.status(500).json({ error: "Supabase não configurado" });

  // Verify requester and get empresa_id
  const supabaseUser = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${userToken}` } },
  });
  const { data: membroData } = await supabaseUser
    .from("empresa_membros")
    .select("empresa_id, role")
    .single();

  if (!membroData) return res.status(403).json({ error: "Usuário não tem empresa" });
  if (membroData.role !== "owner" && membroData.role !== "admin") {
    return res.status(403).json({ error: "Apenas owner/admin podem convidar membros" });
  }

  const empresaId = membroData.empresa_id as string;

  // Use service role key if available (to send invite email), otherwise use user token
  if (serviceKey) {
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Invite user via Supabase Auth Admin API
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { empresa_id: empresaId, role_convite: role },
      redirectTo: `${process.env.SITE_URL ?? "https://planne.vercel.app"}/app`,
    });

    if (error) return res.status(400).json({ error: error.message });

    // Pre-create empresa_membros row (will be confirmed on first login via trigger or manually)
    const userId = data.user?.id;
    if (userId) {
      await supabaseAdmin.from("empresa_membros").upsert({
        user_id: userId,
        empresa_id: empresaId,
        role,
      }, { onConflict: "user_id,empresa_id" });
    }

    return res.json({ ok: true, message: `Convite enviado para ${email}` });
  }

  // Fallback without service key: just return instructions
  return res.status(501).json({
    error: "SUPABASE_SERVICE_ROLE_KEY não configurada no servidor. Configure a variável de ambiente para habilitar convites por email.",
  });
}
