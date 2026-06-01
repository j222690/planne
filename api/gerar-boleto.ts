import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { orcamento_id, user_token, tipo, vencimento_dias } = req.body as {
    orcamento_id: string;
    user_token: string;
    tipo: "BOLETO" | "PIX";
    vencimento_dias?: number;
  };

  if (!orcamento_id || !user_token || !tipo) {
    return res.status(400).json({ error: "orcamento_id, user_token e tipo são obrigatórios" });
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) return res.status(500).json({ error: "Supabase não configurado" });

  const sb = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${user_token}` } },
  });

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return res.status(401).json({ error: "Não autorizado" });

  const { data: membro } = await sb.from("empresa_membros")
    .select("empresa_id").single();
  if (!membro) return res.status(403).json({ error: "Usuário sem empresa" });

  const empresaId = membro.empresa_id as string;

  const { data: empresa } = await sb.from("empresas")
    .select("nome, parametros")
    .eq("id", empresaId)
    .single();

  if (!empresa) return res.status(404).json({ error: "Empresa não encontrada" });

  const p = (empresa.parametros ?? {}) as Record<string, unknown>;
  const asaasToken = p.asaas_token as string | undefined;
  const asaasAmbiente = (p.asaas_ambiente as string) || "sandbox";

  if (!asaasToken) {
    return res.status(400).json({
      error: "Token Asaas não configurado. Acesse Configurações > Fiscal & Pagamentos.",
    });
  }

  const { data: orc } = await sb.from("orcamentos")
    .select("*, clientes(*), fiscal_dados")
    .eq("id", orcamento_id)
    .single();

  if (!orc) return res.status(404).json({ error: "Orçamento não encontrado" });
  if (orc.status !== "aprovado") {
    return res.status(400).json({ error: "Apenas orçamentos aprovados podem gerar cobrança" });
  }

  const baseUrl = asaasAmbiente === "producao"
    ? "https://api.asaas.com/v3"
    : "https://sandbox.asaas.com/api/v3";

  const headers = {
    "Content-Type": "application/json",
    "access_token": asaasToken,
  };

  const cliente = orc.clientes as Record<string, unknown> | null;
  const cpfCnpjCliente = ((cliente?.cpf_cnpj as string) ?? "").replace(/\D/g, "");

  // Busca ou cria cliente no Asaas
  let asaasCustomerId: string | null = null;

  if (cpfCnpjCliente) {
    const searchRes = await fetch(`${baseUrl}/customers?cpfCnpj=${cpfCnpjCliente}`, {
      headers,
    });
    if (searchRes.ok) {
      const searchData = await searchRes.json() as { data?: { id: string }[] };
      asaasCustomerId = searchData.data?.[0]?.id ?? null;
    }
  }

  if (!asaasCustomerId) {
    const createRes = await fetch(`${baseUrl}/customers`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: (cliente?.nome as string) ?? "Consumidor",
        cpfCnpj: cpfCnpjCliente || undefined,
        email: (cliente?.email as string) || undefined,
        phone: (cliente?.telefone as string) || undefined,
        externalReference: `orc-${orcamento_id}`,
      }),
    });
    if (createRes.ok) {
      const created = await createRes.json() as { id?: string; errors?: { description: string }[] };
      if (created.errors?.length) {
        const msg = created.errors.map((e) => e.description).join("; ");
        return res.status(400).json({ error: `Asaas (cliente): ${msg}` });
      }
      asaasCustomerId = created.id ?? null;
    } else {
      const errText = await createRes.text();
      return res.status(400).json({ error: `Asaas (criar cliente): ${errText}` });
    }
  }

  if (!asaasCustomerId) {
    return res.status(400).json({ error: "Não foi possível criar/localizar cliente no Asaas" });
  }

  // Calcula vencimento
  const dias = vencimento_dias ?? (tipo === "BOLETO" ? 5 : 1);
  const venc = new Date();
  venc.setDate(venc.getDate() + dias);
  const dueDate = venc.toISOString().slice(0, 10);

  // Cria cobrança
  const payRes = await fetch(`${baseUrl}/payments`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      customer: asaasCustomerId,
      billingType: tipo,
      value: Number(orc.total ?? 0),
      dueDate,
      description: `Orçamento ${orc.numero ?? orcamento_id.slice(0, 8)} — ${empresa.nome}`,
      externalReference: `orc-${orcamento_id}`,
    }),
  });

  const payData = await payRes.json() as Record<string, unknown>;

  if (!payRes.ok) {
    const erros = (payData.errors as { description: string }[]) ?? [];
    const msg = erros.map((e) => e.description).join("; ") || JSON.stringify(payData);
    return res.status(400).json({ error: `Asaas (pagamento): ${msg}` });
  }

  // Busca link de boleto / QR Code PIX
  let boletoUrl: string | null = null;
  let pixQr: string | null = null;
  let pixCopiaCola: string | null = null;
  const payId = payData.id as string;

  if (tipo === "BOLETO") {
    const bankSlipRes = await fetch(`${baseUrl}/payments/${payId}/identificationField`, { headers });
    if (bankSlipRes.ok) {
      const slipData = await bankSlipRes.json() as { identificationField?: string };
      boletoUrl = (payData.bankSlipUrl as string) ?? null;
      pixCopiaCola = slipData.identificationField ?? null;
    } else {
      boletoUrl = (payData.bankSlipUrl as string) ?? null;
    }
  }

  if (tipo === "PIX") {
    const pixRes = await fetch(`${baseUrl}/payments/${payId}/pixQrCode`, { headers });
    if (pixRes.ok) {
      const pixData = await pixRes.json() as { encodedImage?: string; payload?: string };
      pixQr = pixData.encodedImage ?? null;
      pixCopiaCola = pixData.payload ?? null;
    }
  }

  // Salva no fiscal_dados
  const existingFiscal = (orc.fiscal_dados as Record<string, unknown>) ?? {};
  const fiscalKey = tipo === "BOLETO" ? "boleto" : "pix";
  try {
    await sb.from("orcamentos").update({
      fiscal_dados: {
        ...existingFiscal,
        [fiscalKey]: {
          asaas_id: payId,
          url: boletoUrl ?? (payData.invoiceUrl as string) ?? null,
          qr_code: pixQr,
          copia_cola: pixCopiaCola,
          vencimento: dueDate,
          valor: orc.total,
          status: payData.status,
          criado_em: new Date().toISOString(),
        },
      },
    }).eq("id", orcamento_id);
  } catch { /* coluna pode não existir ainda */ }

  return res.json({
    ok: true,
    id: payId,
    tipo,
    url: boletoUrl ?? (payData.invoiceUrl as string) ?? null,
    qr_code: pixQr,
    copia_cola: pixCopiaCola,
    vencimento: dueDate,
    status: payData.status,
  });
}
