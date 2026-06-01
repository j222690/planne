// Supabase Edge Function: follow-up-alert
// Runs daily via Supabase cron (configure in dashboard)
// Finds orçamentos in "analise" status updated more than 5 days ago
// Sends reminder emails via Resend API
// Required env vars: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req) => {
  // Allow cron trigger (no auth) or authenticated calls
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Supabase não configurado" }), { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Find orçamentos in análise há mais de 5 dias
  const cincosDiasAtras = new Date();
  cincosDiasAtras.setDate(cincosDiasAtras.getDate() - 5);

  const { data: orcs, error } = await supabase
    .from("orcamentos")
    .select("id, numero, total, updated_at, clientes(nome), empresas(nome, email)")
    .eq("status", "analise")
    .lt("updated_at", cincosDiasAtras.toISOString())
    .limit(50);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!orcs || orcs.length === 0) {
    return new Response(JSON.stringify({ processados: 0, mensagem: "Nenhum orçamento em análise há mais de 5 dias" }), { status: 200 });
  }

  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY não configurado. Orçamentos que seriam notificados:", orcs.length);
    return new Response(JSON.stringify({ aviso: "RESEND_API_KEY não configurado", orcs: orcs.length }), { status: 200 });
  }

  let enviados = 0;
  const erros: string[] = [];

  for (const orc of orcs) {
    const empresa = orc.empresas as { nome: string; email: string | null } | null;
    const cliente = orc.clientes as { nome: string } | null;
    const emailDestino = empresa?.email;

    if (!emailDestino) continue;

    const dias = Math.floor((Date.now() - new Date(orc.updated_at).getTime()) / 86400000);
    const total = Number(orc.total).toLocaleString("pt-BR", { minimumFractionDigits: 2, style: "currency", currency: "BRL" });

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Planne <noreply@planne.app>",
          to: emailDestino,
          subject: `Lembrete: Orçamento #${orc.numero} aguarda resposta`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
              <h2 style="font-size:18px;margin-bottom:8px">Lembrete de follow-up</h2>
              <p style="color:#555;font-size:14px;margin-bottom:20px">
                O orçamento abaixo está em análise há <strong>${dias} dias</strong> sem resposta.
              </p>
              <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin-bottom:20px">
                <div style="font-size:13px;color:#666">Orçamento</div>
                <div style="font-size:18px;font-weight:700">#${orc.numero}</div>
                <div style="font-size:13px;margin-top:4px"><strong>Cliente:</strong> ${cliente?.nome ?? "—"}</div>
                <div style="font-size:13px"><strong>Valor:</strong> ${total}</div>
                <div style="font-size:13px;color:#e85252"><strong>Em análise há:</strong> ${dias} dias</div>
              </div>
              <p style="font-size:13px;color:#555">
                Entre em contato com o cliente para perguntar se há dúvidas ou se precisa de ajustes no orçamento.
              </p>
              <p style="font-size:12px;color:#999;margin-top:24px">
                Enviado automaticamente pelo Planne ERP · ${new Date().toLocaleDateString("pt-BR")}
              </p>
            </div>
          `,
        }),
      });

      if (res.ok) enviados++;
      else {
        const err = await res.text();
        erros.push(`ORC ${orc.numero}: ${err}`);
      }
    } catch (e) {
      erros.push(`ORC ${orc.numero}: ${e}`);
    }
  }

  return new Response(JSON.stringify({
    processados: orcs.length,
    enviados,
    erros: erros.length > 0 ? erros : undefined,
  }), { status: 200 });
});
