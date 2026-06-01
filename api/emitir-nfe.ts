import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { orcamento_id, user_token } = req.body as {
    orcamento_id: string;
    user_token: string;
  };

  if (!orcamento_id || !user_token) {
    return res.status(400).json({ error: "orcamento_id e user_token são obrigatórios" });
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) return res.status(500).json({ error: "Supabase não configurado" });

  const sb = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${user_token}` } },
  });

  // Verifica sessão
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return res.status(401).json({ error: "Não autorizado" });

  // Busca empresa e config fiscal
  const { data: membro } = await sb.from("empresa_membros")
    .select("empresa_id").single();
  if (!membro) return res.status(403).json({ error: "Usuário sem empresa" });

  const empresaId = membro.empresa_id as string;

  const { data: empresa } = await sb.from("empresas")
    .select("nome, cnpj, endereco, cidade, estado, email, telefone, parametros")
    .eq("id", empresaId)
    .single();

  if (!empresa) return res.status(404).json({ error: "Empresa não encontrada" });

  const p = (empresa.parametros ?? {}) as Record<string, unknown>;
  const focusToken = p.focus_nfe_token as string | undefined;
  const ambiente = (p.focus_nfe_ambiente as string) || "homologacao";
  const regimeTributario = parseInt((p.regime_tributario as string) || "1", 10);

  if (!focusToken) {
    return res.status(400).json({
      error: "Token Focus NFe não configurado. Acesse Configurações > Fiscal & Pagamentos.",
    });
  }

  const cnpjEmpresa = (empresa.cnpj ?? "").replace(/\D/g, "");
  if (cnpjEmpresa.length !== 14) {
    return res.status(400).json({
      error: "CNPJ da empresa inválido ou não preenchido. Configure em Configurações > Dados da empresa.",
    });
  }

  // Busca orçamento com itens e cliente
  const { data: orc } = await sb.from("orcamentos")
    .select("*, clientes(*), orcamento_itens(*), fiscal_dados")
    .eq("id", orcamento_id)
    .single();

  if (!orc) return res.status(404).json({ error: "Orçamento não encontrado" });
  if (orc.status !== "aprovado") {
    return res.status(400).json({ error: "Apenas orçamentos aprovados podem ter NF-e emitida" });
  }

  const cliente = orc.clientes as Record<string, unknown> | null;
  const cpfCnpjCliente = ((cliente?.cpf_cnpj as string) ?? "").replace(/\D/g, "");

  const itens = (orc.orcamento_itens ?? []) as Record<string, unknown>[];

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
      logradouro: empresa.endereco ?? "Rua não informada",
      numero: "S/N",
      bairro: "Centro",
      municipio: empresa.cidade ?? "São Paulo",
      uf: (empresa.estado ?? "SP").substring(0, 2).toUpperCase(),
      cep: "01001000",
      codigo_pais: "1058",
      pais: "BRASIL",
      telefone: (empresa.telefone ?? "").replace(/\D/g, ""),
      regime_tributario: regimeTributario,
    },
    destinatario: cpfCnpjCliente
      ? {
          cpf_cnpj: cpfCnpjCliente,
          nome: (cliente?.nome as string) ?? "Consumidor",
          email: (cliente?.email as string) ?? "",
          logradouro: (cliente?.endereco as string) ?? "Não informado",
          numero: "S/N",
          bairro: "Centro",
          municipio: (cliente?.cidade as string) ?? empresa.cidade ?? "São Paulo",
          uf: ((cliente?.estado as string) ?? empresa.estado ?? "SP").substring(0, 2).toUpperCase(),
          pais: "BRASIL",
          cep: "00000000",
          indica_ie_destinatario: 9,
        }
      : {
          // NF-e para consumidor sem CPF (NFC-e simplificada)
          nome: (cliente?.nome as string) ?? "Consumidor",
          indica_ie_destinatario: 9,
        },
    itens: itens.length > 0
      ? itens.map((it, i) => ({
          numero_item: i + 1,
          codigo_produto: `PROD${String(i + 1).padStart(3, "0")}`,
          descricao: String(it.descricao ?? "Móvel planejado"),
          codigo_ncm: "94036000",
          cfop: "5102",
          unidade_comercial: String(it.unidade ?? "UN"),
          quantidade_comercial: Number(it.quantidade ?? 1),
          valor_unitario_comercial: Number(it.preco_unitario ?? 0),
          valor_bruto: Number(it.preco_unitario ?? 0) * Number(it.quantidade ?? 1),
          icms_situacao_tributaria: regimeTributario === 1 ? "500" : "102",
          icms_modalidade_base_calculo: 3,
          pis_situacao_tributaria: "07",
          cofins_situacao_tributaria: "07",
        }))
      : [{
          numero_item: 1,
          codigo_produto: "PROD001",
          descricao: `Orçamento ${orc.numero ?? ""}`,
          codigo_ncm: "94036000",
          cfop: "5102",
          unidade_comercial: "UN",
          quantidade_comercial: 1,
          valor_unitario_comercial: Number(orc.total ?? 0),
          valor_bruto: Number(orc.total ?? 0),
          icms_situacao_tributaria: regimeTributario === 1 ? "500" : "102",
          icms_modalidade_base_calculo: 3,
          pis_situacao_tributaria: "07",
          cofins_situacao_tributaria: "07",
        }],
    formas_pagamento: [{ forma_pagamento: "99", valor: Number(orc.total ?? 0) }],
  };

  const baseUrl = ambiente === "producao"
    ? "https://api.focusnfe.com.br"
    : "https://homologacao.focusnfe.com.br";

  const ref = `ORC${(orc.numero ?? orcamento_id.slice(0, 8)).replace(/\W/g, "")}${Date.now()}`.slice(0, 50);

  try {
    const nfeRes = await fetch(`${baseUrl}/v2/nfe?ref=${ref}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(`${focusToken}:`).toString("base64"),
      },
      body: JSON.stringify(nfePayload),
    });

    const nfeData = await nfeRes.json() as Record<string, unknown>;

    const existingFiscal = (orc.fiscal_dados as Record<string, unknown>) ?? {};
    try {
      await sb.from("orcamentos").update({
        fiscal_dados: {
          ...existingFiscal,
          nfe_ref: ref,
          nfe_ambiente: ambiente,
          nfe_status: (nfeData.status as string) ?? "processando",
          nfe_chave: (nfeData.chave_nfe as string) ?? null,
          nfe_emitido_em: new Date().toISOString(),
        },
      }).eq("id", orcamento_id);
    } catch { /* coluna pode não existir ainda */ }

    if (!nfeRes.ok) {
      const erros = (nfeData.erros as { codigo: string; mensagem: string }[]) ?? [];
      const msg = erros.map((e) => e.mensagem).join("; ") || JSON.stringify(nfeData);
      return res.status(400).json({ error: `Focus NFe: ${msg}`, details: nfeData });
    }

    return res.json({
      ok: true,
      ref,
      status: nfeData.status,
      chave: nfeData.chave_nfe,
      ambiente,
    });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : "Erro interno" });
  }
}
