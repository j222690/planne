import { supabase } from "./supabase";

// ─── Empresa do usuário atual ─────────────────────────────────────────────────
export async function getEmpresaAtual() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data } = await supabase
    .from("empresa_membros")
    .select("empresa_id, role, empresas(id,nome,cnpj,cidade,estado,endereco,logo_url,cor_primaria,email,telefone,parametros)")
    .eq("user_id", session.user.id)
    .single();

  if (!data) return null;
  return {
    ...(data.empresas as Record<string, unknown>),
    role: data.role,
  };
}

// ─── Clientes ─────────────────────────────────────────────────────────────────
export async function getClientes(empresaId: string) {
  const { data, error } = await supabase
    .from("clientes")
    .select("id,nome,email,telefone,whatsapp,cidade,estado,origem,observacoes,cpf_cnpj,tipo,created_at")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function upsertCliente(empresaId: string, cliente: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await supabase
    .from("clientes")
    .insert({ ...cliente, empresa_id: empresaId, created_by: session?.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Fornecedores ─────────────────────────────────────────────────────────────
export async function getFornecedores(empresaId: string) {
  const { data, error } = await supabase
    .from("fornecedores")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("nome");
  if (error) throw error;
  return data ?? [];
}

// ─── Materiais ────────────────────────────────────────────────────────────────
export async function getMateriais(_empresaId?: string) {
  const { data, error } = await supabase
    .from("materiais")
    .select("id,codigo,nome,unidade,preco_custo,preco_venda,ativo,cor,espessura_mm,imagem_url,largura_mm,comprimento_mm,fornecedor_id,fornecedores(nome),categoria_id")
    .eq("ativo", true)
    .order("nome");
  if (error) throw error;
  return data ?? [];
}

export async function upsertMaterial(empresaId: string, material: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("materiais")
    .insert({ ...material, empresa_id: empresaId, ativo: true })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Projetos ─────────────────────────────────────────────────────────────────
export async function upsertProjeto(empresaId: string, projeto: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await supabase
    .from("projetos")
    .insert({ ...projeto, empresa_id: empresaId, criado_por: session?.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getProjetos(empresaId: string) {
  const { data, error } = await supabase
    .from("projetos")
    .select("id,nome,descricao,status,created_at,cliente_id,clientes(nome)")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ─── Orçamentos ───────────────────────────────────────────────────────────────
export async function getOrcamentos(empresaId: string) {
  const { data, error } = await supabase
    .from("orcamentos")
    .select("id,numero,status,total,margem_pct,subtotal,created_at,cliente_id,projeto_id,clientes(nome),projetos(nome)")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function upsertOrcamento(empresaId: string, orc: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await supabase
    .from("orcamentos")
    .insert({ ...orc, empresa_id: empresaId, criado_por: session?.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────
export async function getDashboardStats(empresaId: string) {
  const { data } = await supabase
    .from("vw_dashboard_kpis")
    .select("*")
    .eq("empresa_id", empresaId)
    .single();

  return {
    faturamentoMes:  Number(data?.faturamento_mes       ?? 0),
    margemMedia:     Number(data?.margem_media           ?? 0),
    projetosAtivos:  Number(data?.projetos_ativos        ?? 0),
    emAnalise:       Number(data?.orcamentos_aguardando  ?? 0),
    totalClientes:   Number(data?.total_clientes         ?? 0),
    orcamentosAprov: Number(data?.orcamentos_aprovados   ?? 0),
  };
}

// ─── Margem semanal (últimas 4 semanas) ───────────────────────────────────────
export async function getMargemSemanal(empresaId: string) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 28);

  const { data, error } = await supabase
    .from("orcamentos")
    .select("margem_pct, status, created_at")
    .eq("empresa_id", empresaId)
    .gte("created_at", cutoff.toISOString())
    .order("created_at");
  if (error) throw error;

  const rows = data ?? [];
  return Array.from({ length: 4 }, (_, i) => {
    const start = new Date();
    start.setDate(start.getDate() - (3 - i + 1) * 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setDate(end.getDate() - (3 - i) * 7);
    end.setHours(23, 59, 59, 999);

    const week = rows.filter((o) => {
      const d = new Date(o.created_at as string);
      return d >= start && d <= end;
    });

    const withMargem = week.filter((o) => Number(o.margem_pct) > 0);
    const approved   = withMargem.filter((o) => o.status === "aprovado");

    const avg = (arr: typeof withMargem) =>
      arr.length ? Math.round((arr.reduce((s, o) => s + Number(o.margem_pct), 0) / arr.length) * 10) / 10 : 0;

    return { m: `Sem ${i + 1}`, real: avg(approved), est: avg(withMargem) };
  });
}

// ─── Financeiro (6 meses) ─────────────────────────────────────────────────────
export async function getFinanceiroMeses(empresaId: string) {
  const { data, error } = await supabase
    .from("financeiro")
    .select("tipo,valor,pago_em,vencimento,status,created_at")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function upsertLancamento(empresaId: string, lancamento: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("financeiro")
    .insert({ ...lancamento, empresa_id: empresaId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Ordens de produção ───────────────────────────────────────────────────────
export async function upsertOrdemProducao(empresaId: string, ordem: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("ordens_producao")
    .insert({ ...ordem, empresa_id: empresaId, status: "aberta" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Updates e deletes ────────────────────────────────────────────────────────
export async function updateCliente(id: string, data: Record<string, unknown>) {
  const { error } = await supabase.from("clientes").update(data).eq("id", id);
  if (error) throw error;
}
export async function deleteCliente(id: string) {
  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error) throw error;
}

export async function updateFornecedor(id: string, data: Record<string, unknown>) {
  const { error } = await supabase.from("fornecedores").update(data).eq("id", id);
  if (error) throw error;
}
export async function deleteFornecedor(id: string) {
  const { error } = await supabase.from("fornecedores").delete().eq("id", id);
  if (error) throw error;
}

export async function updateMaterial(id: string, data: Record<string, unknown>) {
  const { error } = await supabase.from("materiais").update(data).eq("id", id);
  if (error) throw error;
}
export async function deleteMaterial(id: string) {
  const { error } = await supabase.from("materiais").update({ ativo: false }).eq("id", id);
  if (error) throw error;
}

export async function updateLancamento(id: string, data: Record<string, unknown>) {
  const { error } = await supabase.from("financeiro").update(data).eq("id", id);
  if (error) throw error;
}
export async function deleteLancamento(id: string) {
  const { error } = await supabase.from("financeiro").delete().eq("id", id);
  if (error) throw error;
}

export async function updateOrcamentoStatus(id: string, status: string) {
  const { error } = await supabase.from("orcamentos").update({ status }).eq("id", id);
  if (error) throw error;
}
export async function deleteOrcamento(id: string) {
  await supabase.from("orcamento_moveis").delete().eq("orcamento_id", id);
  await supabase.from("orcamento_itens").delete().eq("orcamento_id", id);
  const { error } = await supabase.from("orcamentos").delete().eq("id", id);
  if (error) throw error;
}
export async function getOrcamentoItens(orcamentoId: string) {
  const { data, error } = await supabase
    .from("orcamento_itens")
    .select("*")
    .eq("orcamento_id", orcamentoId)
    .order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function updateOrcamento(id: string, data: Record<string, unknown>) {
  const { error } = await supabase.from("orcamentos").update(data).eq("id", id);
  if (error) throw error;
}

export async function replaceOrcamentoItens(orcamentoId: string, itens: Record<string, unknown>[]) {
  await supabase.from("orcamento_itens").delete().eq("orcamento_id", orcamentoId);
  if (itens.length > 0) {
    const { error } = await supabase.from("orcamento_itens").insert(itens);
    if (error) throw error;
  }
}
