import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Supabase service key não configurada" });
  }

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const event = req.body as {
    event: string;
    payment?: {
      id: string;
      status: string;
      externalReference?: string;
      value?: number;
      paymentDate?: string;
    };
  };

  const confirmedEvents = new Set([
    "PAYMENT_RECEIVED",
    "PAYMENT_CONFIRMED",
    "PAYMENT_APPROVED_BY_RISK_ANALYSIS",
  ]);

  if (!confirmedEvents.has(event.event) || !event.payment) {
    return res.json({ ok: true, ignored: true });
  }

  const payment = event.payment;
  const externalRef = payment.externalReference ?? "";

  // externalReference "empresa-{id}" → pagamento de assinatura de plano
  if (externalRef.startsWith("empresa-")) {
    const empresaId = externalRef.slice(8);
    const venc = new Date();
    venc.setMonth(venc.getMonth() + 1);
    await sb.from("assinaturas").update({
      status: "ativa",
      proximo_vencimento: venc.toISOString().slice(0, 10),
      atualizado_em: new Date().toISOString(),
    }).eq("empresa_id", empresaId);
    return res.json({ ok: true, assinatura: "ativa" });
  }

  // externalReference "orc-{orcamento_id}" → pagamento de orçamento
  const orcId = externalRef.startsWith("orc-") ? externalRef.slice(4) : null;
  if (!orcId) return res.json({ ok: true, ignored: true });

  // Busca o orçamento para encontrar o lançamento associado
  const { data: orc } = await sb.from("orcamentos")
    .select("fiscal_dados, numero, empresa_id")
    .eq("id", orcId)
    .single();

  if (!orc) return res.json({ ok: true, not_found: true });

  // Atualiza fiscal_dados com status confirmado
  const existing = (orc.fiscal_dados as Record<string, unknown>) ?? {};
  const tipo = existing.boleto
    ? "boleto"
    : existing.pix
    ? "pix"
    : null;

  if (tipo) {
    const tipoData = (existing[tipo] as Record<string, unknown>) ?? {};
    await sb.from("orcamentos").update({
      fiscal_dados: {
        ...existing,
        [tipo]: { ...tipoData, status: "CONFIRMED", pago_em: payment.paymentDate ?? new Date().toISOString() },
      },
    }).eq("id", orcId);
  }

  // Marca o lançamento financeiro correspondente como pago
  const { data: lancamentos } = await sb.from("lancamentos")
    .select("id, status")
    .eq("empresa_id", orc.empresa_id)
    .ilike("descricao", `%${orc.numero ?? orcId}%`)
    .eq("tipo", "entrada");

  if (lancamentos?.length) {
    const pendentes = lancamentos.filter((l: { id: string; status: string }) => l.status !== "pago");
    for (const l of pendentes) {
      await sb.from("lancamentos").update({
        status: "pago",
        pago_em: payment.paymentDate ?? new Date().toISOString(),
      }).eq("id", l.id);
    }
  }

  return res.json({ ok: true });
}
