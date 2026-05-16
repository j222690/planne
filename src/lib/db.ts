import { supabase } from "./supabase";

// ─── Empresa do usuário atual ─────────────────────────────────────────────────
export async function getEmpresaAtual() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data } = await supabase
    .from("empresa_membros")
    .select("empresa_id, role, empresas(id,nome,cnpj,cidade,logo_url,cor_primaria,email,telefone,estado,endereco)")
    .eq("user_id", session.user.id)
    .single();

  if (!data) return null;
  return {
    ...(data.empresas as any),
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
export async function getMateriais(empresaId: string) {
  const { data, error } = await supabase
    .from("materiais")
    .select("id,codigo,nome,unidade,preco_custo,preco_venda,ativo,fornecedor_id,fornecedores(nome),categoria_id,categorias_material(nome)")
    .eq("empresa_id", empresaId)
    .eq("ativo", true)
    .order("nome");
  if (error) throw error;
  return data ?? [];
}

// ─── Projetos ─────────────────────────────────────────────────────────────────
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
  // Usa a view vw_dashboard_kpis que já existe no banco!
  const { data } = await supabase
    .from("vw_dashboard_kpis")
    .select("*")
    .eq("empresa_id", empresaId)
    .single();

  return {
    faturamentoMes:   Number(data?.faturamento_mes  ?? 0),
    margemMedia:      Number(data?.margem_media      ?? 0),
    projetosAtivos:   Number(data?.projetos_ativos   ?? 0),
    emAnalise:        Number(data?.orcamentos_aguardando ?? 0),
    totalClientes:    Number(data?.total_clientes    ?? 0),
    orcamentosAprov:  Number(data?.orcamentos_aprovados ?? 0),
  };
}

// ─── Financeiro (6 meses) ─────────────────────────────────────────────────────
export async function getFinanceiroMeses(empresaId: string) {
  const { data } = await supabase
    .from("financeiro")
    .select("tipo,valor,pago_em,vencimento,status,created_at")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });
  return data ?? [];
}
