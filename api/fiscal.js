// ARQUIVO GERADO por scripts/bundle-api.mjs — NÃO EDITAR.
// Edite src/server/http/ e rode npm run build.


// src/server/http/fiscal.ts
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

// src/server/http/fiscal.ts
function getSupabase(userToken) {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient2(url, key, {
    global: { headers: { Authorization: `Bearer ${userToken}` } }
  });
}
async function emitirNfe(req, res, sb) {
  const { orcamento_id } = req.body;
  if (!orcamento_id) return res.status(400).json({ error: "orcamento_id \xE9 obrigat\xF3rio" });
  const { data: membro } = await sb.from("empresa_membros").select("empresa_id").single();
  if (!membro) return res.status(403).json({ error: "Usu\xE1rio sem empresa" });
  const { data: empresa } = await sb.from("empresas").select("nome, cnpj, endereco, cidade, estado, email, telefone, parametros").eq("id", membro.empresa_id).single();
  if (!empresa) return res.status(404).json({ error: "Empresa n\xE3o encontrada" });
  const p = empresa.parametros ?? {};
  const focusToken = p.focus_nfe_token;
  const ambiente = p.focus_nfe_ambiente || "homologacao";
  const regimeTributario = parseInt(p.regime_tributario || "1", 10);
  if (!focusToken) {
    return res.status(400).json({
      error: "Token Focus NFe n\xE3o configurado. Acesse Configura\xE7\xF5es > Fiscal & Pagamentos."
    });
  }
  const cnpjEmpresa = (empresa.cnpj ?? "").replace(/\D/g, "");
  if (cnpjEmpresa.length !== 14) {
    return res.status(400).json({
      error: "CNPJ da empresa inv\xE1lido ou n\xE3o preenchido."
    });
  }
  const { data: orc } = await sb.from("orcamentos").select("*, clientes(*), orcamento_itens(*), fiscal_dados").eq("id", orcamento_id).single();
  if (!orc) return res.status(404).json({ error: "Or\xE7amento n\xE3o encontrado" });
  if (orc.status !== "aprovado") {
    return res.status(400).json({ error: "Apenas or\xE7amentos aprovados podem ter NF-e emitida" });
  }
  const cliente = orc.clientes;
  const cpfCnpjCliente = (cliente?.cpf_cnpj ?? "").replace(/\D/g, "");
  const itens = orc.orcamento_itens ?? [];
  const nfePayload = {
    natureza_operacao: "Venda de Mercadoria",
    tipo_documento: 1,
    local_destino: 1,
    finalidade_emissao: 1,
    consumidor_final: 1,
    presenca_comprador: 1,
    regime_tributario: regimeTributario,
    emitente: {
      cnpj: cnpjEmpresa,
      nome: empresa.nome,
      logradouro: empresa.endereco ?? "Rua n\xE3o informada",
      numero: "S/N",
      bairro: "Centro",
      municipio: empresa.cidade ?? "S\xE3o Paulo",
      uf: (empresa.estado ?? "SP").substring(0, 2).toUpperCase(),
      cep: "01001000",
      codigo_pais: "1058",
      pais: "BRASIL",
      telefone: (empresa.telefone ?? "").replace(/\D/g, ""),
      regime_tributario: regimeTributario
    },
    destinatario: cpfCnpjCliente ? {
      cpf_cnpj: cpfCnpjCliente,
      nome: cliente?.nome ?? "Consumidor",
      email: cliente?.email ?? "",
      logradouro: cliente?.endereco ?? "N\xE3o informado",
      numero: "S/N",
      bairro: "Centro",
      municipio: cliente?.cidade ?? empresa.cidade ?? "S\xE3o Paulo",
      uf: (cliente?.estado ?? empresa.estado ?? "SP").substring(0, 2).toUpperCase(),
      pais: "BRASIL",
      cep: "00000000",
      indica_ie_destinatario: 9
    } : {
      nome: cliente?.nome ?? "Consumidor",
      indica_ie_destinatario: 9
    },
    itens: itens.length > 0 ? itens.map((it, i) => ({
      numero_item: i + 1,
      codigo_produto: `PROD${String(i + 1).padStart(3, "0")}`,
      descricao: String(it.descricao ?? "M\xF3vel planejado"),
      codigo_ncm: "94036000",
      cfop: "5102",
      unidade_comercial: String(it.unidade ?? "UN"),
      quantidade_comercial: Number(it.quantidade ?? 1),
      valor_unitario_comercial: Number(it.preco_unitario ?? 0),
      valor_bruto: Number(it.preco_unitario ?? 0) * Number(it.quantidade ?? 1),
      icms_situacao_tributaria: regimeTributario === 1 ? "500" : "102",
      icms_modalidade_base_calculo: 3,
      pis_situacao_tributaria: "07",
      cofins_situacao_tributaria: "07"
    })) : [
      {
        numero_item: 1,
        codigo_produto: "PROD001",
        descricao: `Or\xE7amento ${orc.numero ?? ""}`,
        codigo_ncm: "94036000",
        cfop: "5102",
        unidade_comercial: "UN",
        quantidade_comercial: 1,
        valor_unitario_comercial: Number(orc.total ?? 0),
        valor_bruto: Number(orc.total ?? 0),
        icms_situacao_tributaria: regimeTributario === 1 ? "500" : "102",
        icms_modalidade_base_calculo: 3,
        pis_situacao_tributaria: "07",
        cofins_situacao_tributaria: "07"
      }
    ],
    formas_pagamento: [{ forma_pagamento: "99", valor: Number(orc.total ?? 0) }]
  };
  const baseUrl = ambiente === "producao" ? "https://api.focusnfe.com.br" : "https://homologacao.focusnfe.com.br";
  const ref = `ORC${(orc.numero ?? orcamento_id.slice(0, 8)).replace(/\W/g, "")}${Date.now()}`.slice(0, 50);
  try {
    const nfeRes = await fetch(`${baseUrl}/v2/nfe?ref=${ref}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`${focusToken}:`).toString("base64")
      },
      body: JSON.stringify(nfePayload)
    });
    const nfeData = await nfeRes.json();
    const existingFiscal = orc.fiscal_dados ?? {};
    try {
      await sb.from("orcamentos").update({
        fiscal_dados: {
          ...existingFiscal,
          nfe_ref: ref,
          nfe_ambiente: ambiente,
          nfe_status: nfeData.status ?? "processando",
          nfe_chave: nfeData.chave_nfe ?? null,
          nfe_emitido_em: (/* @__PURE__ */ new Date()).toISOString()
        }
      }).eq("id", orcamento_id);
    } catch {
    }
    if (!nfeRes.ok) {
      const erros = nfeData.erros ?? [];
      const msg = erros.map((e) => e.mensagem).join("; ") || JSON.stringify(nfeData);
      return res.status(400).json({ error: `Focus NFe: ${msg}`, details: nfeData });
    }
    return res.json({ ok: true, ref, status: nfeData.status, chave: nfeData.chave_nfe, ambiente });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Erro interno" });
  }
}
async function gerarCobranca(req, res, sb) {
  const { orcamento_id, tipo, vencimento_dias } = req.body;
  if (!orcamento_id || !tipo) {
    return res.status(400).json({ error: "orcamento_id e tipo s\xE3o obrigat\xF3rios" });
  }
  const { data: membro } = await sb.from("empresa_membros").select("empresa_id").single();
  if (!membro) return res.status(403).json({ error: "Usu\xE1rio sem empresa" });
  const { data: empresa } = await sb.from("empresas").select("nome, parametros").eq("id", membro.empresa_id).single();
  if (!empresa) return res.status(404).json({ error: "Empresa n\xE3o encontrada" });
  const p = empresa.parametros ?? {};
  const asaasToken = p.asaas_token;
  const asaasAmbiente = p.asaas_ambiente || "sandbox";
  if (!asaasToken) {
    return res.status(400).json({
      error: "Token Asaas n\xE3o configurado. Acesse Configura\xE7\xF5es > Fiscal & Pagamentos."
    });
  }
  const { data: orc } = await sb.from("orcamentos").select("*, clientes(*), fiscal_dados").eq("id", orcamento_id).single();
  if (!orc) return res.status(404).json({ error: "Or\xE7amento n\xE3o encontrado" });
  if (orc.status !== "aprovado") {
    return res.status(400).json({ error: "Apenas or\xE7amentos aprovados podem gerar cobran\xE7a" });
  }
  const baseUrl = asaasAmbiente === "producao" ? "https://api.asaas.com/v3" : "https://sandbox.asaas.com/api/v3";
  const headers = {
    "Content-Type": "application/json",
    access_token: asaasToken
  };
  const cliente = orc.clientes;
  const cpfCnpjCliente = (cliente?.cpf_cnpj ?? "").replace(/\D/g, "");
  let asaasCustomerId = null;
  if (cpfCnpjCliente) {
    const searchRes = await fetch(`${baseUrl}/customers?cpfCnpj=${cpfCnpjCliente}`, { headers });
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      asaasCustomerId = searchData.data?.[0]?.id ?? null;
    }
  }
  if (!asaasCustomerId) {
    const createRes = await fetch(`${baseUrl}/customers`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: cliente?.nome ?? "Consumidor",
        cpfCnpj: cpfCnpjCliente || void 0,
        email: cliente?.email || void 0,
        phone: cliente?.telefone || void 0,
        externalReference: `orc-${orcamento_id}`
      })
    });
    if (createRes.ok) {
      const created = await createRes.json();
      if (created.errors?.length) {
        return res.status(400).json({ error: `Asaas (cliente): ${created.errors.map((e) => e.description).join("; ")}` });
      }
      asaasCustomerId = created.id ?? null;
    } else {
      return res.status(400).json({ error: `Asaas (criar cliente): ${await createRes.text()}` });
    }
  }
  if (!asaasCustomerId) {
    return res.status(400).json({ error: "N\xE3o foi poss\xEDvel criar/localizar cliente no Asaas" });
  }
  const dias = vencimento_dias ?? (tipo === "BOLETO" ? 5 : 1);
  const venc = /* @__PURE__ */ new Date();
  venc.setDate(venc.getDate() + dias);
  const dueDate = venc.toISOString().slice(0, 10);
  const payRes = await fetch(`${baseUrl}/payments`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      customer: asaasCustomerId,
      billingType: tipo,
      value: Number(orc.total ?? 0),
      dueDate,
      description: `Or\xE7amento ${orc.numero ?? orcamento_id.slice(0, 8)} \u2014 ${empresa.nome}`,
      externalReference: `orc-${orcamento_id}`
    })
  });
  const payData = await payRes.json();
  if (!payRes.ok) {
    const erros = payData.errors ?? [];
    const msg = erros.map((e) => e.description).join("; ") || JSON.stringify(payData);
    return res.status(400).json({ error: `Asaas (pagamento): ${msg}` });
  }
  const payId = payData.id;
  let boletoUrl = null;
  let pixQr = null;
  let pixCopiaCola = null;
  if (tipo === "BOLETO") {
    const bankSlipRes = await fetch(`${baseUrl}/payments/${payId}/identificationField`, { headers });
    if (bankSlipRes.ok) {
      const slipData = await bankSlipRes.json();
      boletoUrl = payData.bankSlipUrl ?? null;
      pixCopiaCola = slipData.identificationField ?? null;
    } else {
      boletoUrl = payData.bankSlipUrl ?? null;
    }
  }
  if (tipo === "PIX") {
    const pixRes = await fetch(`${baseUrl}/payments/${payId}/pixQrCode`, { headers });
    if (pixRes.ok) {
      const pixData = await pixRes.json();
      pixQr = pixData.encodedImage ?? null;
      pixCopiaCola = pixData.payload ?? null;
    }
  }
  const existingFiscal = orc.fiscal_dados ?? {};
  const fiscalKey = tipo === "BOLETO" ? "boleto" : "pix";
  try {
    await sb.from("orcamentos").update({
      fiscal_dados: {
        ...existingFiscal,
        [fiscalKey]: {
          asaas_id: payId,
          url: boletoUrl ?? payData.invoiceUrl ?? null,
          qr_code: pixQr,
          copia_cola: pixCopiaCola,
          vencimento: dueDate,
          valor: orc.total,
          status: payData.status,
          criado_em: (/* @__PURE__ */ new Date()).toISOString()
        }
      }
    }).eq("id", orcamento_id);
  } catch {
  }
  return res.json({
    ok: true,
    id: payId,
    tipo,
    url: boletoUrl ?? payData.invoiceUrl ?? null,
    qr_code: pixQr,
    copia_cola: pixCopiaCola,
    vencimento: dueDate,
    status: payData.status
  });
}
async function criarAssinatura(req, res, sb) {
  const { plano_id } = req.body;
  if (!plano_id) return res.status(400).json({ error: "plano_id \xE9 obrigat\xF3rio" });
  const asaasToken = process.env.ASAAS_PLATFORM_TOKEN;
  const ambiente = process.env.ASAAS_PLATFORM_AMBIENTE || "sandbox";
  if (!asaasToken) {
    return res.status(400).json({ error: "ASAAS_PLATFORM_TOKEN n\xE3o configurado no servidor." });
  }
  const { data: membro } = await sb.from("empresa_membros").select("empresa_id").single();
  if (!membro) return res.status(403).json({ error: "Usu\xE1rio sem empresa" });
  const { data: empresa } = await sb.from("empresas").select("id, nome, cnpj, email, telefone").eq("id", membro.empresa_id).single();
  if (!empresa) return res.status(404).json({ error: "Empresa n\xE3o encontrada" });
  const { data: plano } = await sb.from("planos").select("id, nome, preco_mensal").eq("id", plano_id).single();
  if (!plano) return res.status(404).json({ error: "Plano n\xE3o encontrado" });
  const baseUrl = ambiente === "producao" ? "https://api.asaas.com/v3" : "https://sandbox.asaas.com/api/v3";
  const headers = { "Content-Type": "application/json", access_token: asaasToken };
  const cpfCnpj = (empresa.cnpj ?? "").replace(/\D/g, "");
  let customerId = null;
  if (cpfCnpj) {
    const r = await fetch(`${baseUrl}/customers?cpfCnpj=${cpfCnpj}`, { headers });
    if (r.ok) customerId = (await r.json()).data?.[0]?.id ?? null;
  }
  if (!customerId) {
    const r = await fetch(`${baseUrl}/customers`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: empresa.nome,
        cpfCnpj: cpfCnpj || void 0,
        email: empresa.email || void 0,
        phone: empresa.telefone || void 0,
        externalReference: `empresa-${empresa.id}`
      })
    });
    const c = await r.json();
    if (c.errors?.length) return res.status(400).json({ error: `Asaas (cliente): ${c.errors.map((e) => e.description).join("; ")}` });
    customerId = c.id ?? null;
  }
  if (!customerId) return res.status(400).json({ error: "N\xE3o foi poss\xEDvel criar o cliente no Asaas" });
  const nextDue = /* @__PURE__ */ new Date();
  nextDue.setDate(nextDue.getDate() + 3);
  const subRes = await fetch(`${baseUrl}/subscriptions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      customer: customerId,
      billingType: "UNDEFINED",
      // cliente escolhe boleto/pix/cartão na fatura
      value: Number(plano.preco_mensal),
      nextDueDate: nextDue.toISOString().slice(0, 10),
      cycle: "MONTHLY",
      description: `Planne \u2014 Plano ${plano.nome}`,
      externalReference: `empresa-${empresa.id}`
    })
  });
  const sub = await subRes.json();
  if (sub.errors?.length) return res.status(400).json({ error: `Asaas (assinatura): ${sub.errors.map((e) => e.description).join("; ")}` });
  if (!sub.id) return res.status(400).json({ error: "Falha ao criar assinatura no Asaas" });
  let paymentUrl = "";
  const payRes = await fetch(`${baseUrl}/subscriptions/${sub.id}/payments`, { headers });
  if (payRes.ok) {
    const pays = await payRes.json();
    paymentUrl = pays.data?.[0]?.invoiceUrl ?? "";
  }
  await sb.from("assinaturas").upsert({
    empresa_id: empresa.id,
    plano_id: plano.id,
    status: "pendente",
    asaas_customer_id: customerId,
    asaas_subscription_id: sub.id,
    asaas_payment_url: paymentUrl,
    ciclo: "MONTHLY",
    proximo_vencimento: nextDue.toISOString().slice(0, 10),
    atualizado_em: (/* @__PURE__ */ new Date()).toISOString()
  }, { onConflict: "empresa_id" });
  return res.json({ payment_url: paymentUrl, subscription_id: sub.id });
}
async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const auth = await requireUser(req, res);
  if (!auth) return;
  const { action } = req.body ?? {};
  const sb = getSupabase(auth.token);
  if (!sb) return res.status(500).json({ error: "Supabase n\xE3o configurado" });
  if (action === "emitir-nfe") return emitirNfe(req, res, sb);
  if (action === "gerar-boleto") return gerarCobranca(req, res, sb);
  if (action === "criar-assinatura") return criarAssinatura(req, res, sb);
  return res.status(400).json({ error: `A\xE7\xE3o desconhecida: ${action}` });
}
export {
  handler as default
};
