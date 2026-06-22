import { supabase } from "./supabase";

// ─── Input types ──────────────────────────────────────────────────────────────

export interface ClienteInput {
  id?: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  cidade?: string | null;
  estado?: string | null;
  origem?: string | null;
  observacoes?: string | null;
  cpf_cnpj?: string | null;
  tipo?: string | null;
}

export interface MaterialInput {
  id?: string;
  nome: string;
  codigo?: string | null;
  unidade?: string;
  preco_custo?: number;
  preco_venda?: number;
  cor?: string | null;
  espessura_mm?: number | null;
  largura_mm?: number | null;
  comprimento_mm?: number | null;
  fornecedor_id?: string | null;
  categoria_id?: string | null;
  imagem_url?: string | null;
}

export interface ProjetoInput {
  id?: string;
  nome: string;
  descricao?: string | null;
  status?: string;
  cliente_id?: string | null;
}

export interface OrcamentoInput {
  id?: string;
  status?: string;
  margem_pct?: number;
  subtotal?: number;
  total?: number;
  observacoes?: string | null;
  cliente_id?: string | null;
  projeto_id?: string | null;
  moveis_config?: unknown;
}

export interface LancamentoInput {
  id?: string;
  tipo: "entrada" | "saida";
  valor: number;
  descricao?: string | null;
  vencimento?: string | null;
  pago_em?: string | null;
  status?: string;
  categoria?: string | null;
}

// ─── Empresa do usuário atual ─────────────────────────────────────────────────
export async function getEmpresaAtual() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data } = await supabase
    .from("empresa_membros")
    .select("empresa_id, role, empresas(id,nome,cnpj,cidade,estado,endereco,logo_url,cor_primaria,email,telefone,parametros)")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!data) return null;
  const emp = Array.isArray(data.empresas) ? (data.empresas as Record<string, unknown>[])[0] : data.empresas as Record<string, unknown>;
  return {
    ...(emp ?? {}),
    id: data.empresa_id,
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

export async function upsertCliente(empresaId: string, cliente: ClienteInput) {
  const { data: { session } } = await supabase.auth.getSession();

  if (cliente.id) {
    const { id, ...fields } = cliente;
    const { data, error } = await supabase
      .from("clientes")
      .update(fields)
      .eq("id", id)
      .eq("empresa_id", empresaId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

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
export async function getMateriais(empresaId?: string) {
  let q = supabase
    .from("materiais")
    .select("id,codigo,nome,unidade,preco_custo,preco_venda,ativo,cor,espessura_mm,imagem_url,largura_mm,comprimento_mm,fornecedor_id,fornecedores(nome),categoria_id")
    .eq("ativo", true);
  if (empresaId) q = q.eq("empresa_id", empresaId);
  const { data, error } = await q.order("nome");
  if (error) throw error;
  return data ?? [];
}

export async function upsertMaterial(empresaId: string, material: MaterialInput) {
  if (material.id) {
    const { id, ...fields } = material;
    const { data, error } = await supabase
      .from("materiais")
      .update(fields)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("materiais")
    .insert({ ...material, empresa_id: empresaId, ativo: true })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Projetos ─────────────────────────────────────────────────────────────────
export async function upsertProjeto(empresaId: string, projeto: ProjetoInput) {
  if (projeto.id) {
    const { id, ...fields } = projeto;
    const { data, error } = await supabase
      .from("projetos")
      .update(fields)
      .eq("id", id)
      .eq("empresa_id", empresaId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("projetos")
    .insert({ ...projeto, empresa_id: empresaId })
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
    .select("id,numero,status,total,margem_pct,subtotal,created_at,cliente_id,projeto_id,moveis_config,clientes(nome),projetos(nome)")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getOrcamentoMoveis(orcamentoId: string) {
  const { data, error } = await supabase
    .from("orcamentos")
    .select("moveis_config")
    .eq("id", orcamentoId)
    .single();
  if (error) throw error;
  return (data as Record<string, unknown>)?.moveis_config ?? null;
}

export async function upsertOrcamento(empresaId: string, orc: OrcamentoInput) {
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

export async function upsertLancamento(empresaId: string, lancamento: LancamentoInput) {
  if (lancamento.id) {
    const { id, ...fields } = lancamento;
    const { data, error } = await supabase
      .from("financeiro")
      .update(fields)
      .eq("id", id)
      .eq("empresa_id", empresaId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

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
export async function updateCliente(id: string, data: Partial<ClienteInput>) {
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

export async function updateMaterial(id: string, data: Partial<MaterialInput>) {
  const { error } = await supabase.from("materiais").update(data).eq("id", id);
  if (error) throw error;
}
export async function deleteMaterial(id: string) {
  const { error } = await supabase.from("materiais").update({ ativo: false }).eq("id", id);
  if (error) throw error;
}

export async function updateLancamento(id: string, data: Partial<LancamentoInput>) {
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
  const { error: errMoveis } = await supabase.from("orcamento_moveis").delete().eq("orcamento_id", id);
  if (errMoveis) throw new Error(`Erro ao limpar orcamento_moveis: ${errMoveis.message}`);

  const { error: errItens } = await supabase.from("orcamento_itens").delete().eq("orcamento_id", id);
  if (errItens) throw new Error(`Erro ao limpar orcamento_itens: ${errItens.message}`);

  const { error } = await supabase.from("orcamentos").delete().eq("id", id);
  if (error) throw error;
}

export async function getOrcamentoItens(orcamentoId: string) {
  const { data, error } = await supabase
    .from("orcamento_itens")
    .select("*")
    .eq("orcamento_id", orcamentoId)
    .order("id");
  if (error) throw error;
  return data ?? [];
}

export async function updateOrcamento(id: string, data: Partial<OrcamentoInput>) {
  const { error } = await supabase.from("orcamentos").update(data).eq("id", id);
  if (error) throw error;
}

export async function replaceOrcamentoItens(orcamentoId: string, itens: Record<string, unknown>[]) {
  const { error } = await supabase.rpc("replace_orcamento_itens", {
    p_orcamento_id: orcamentoId,
    p_itens: itens,
  });
  if (error) throw error;
}

// ─── Calendário ───────────────────────────────────────────────────────────────
export async function getCalendarioEventos(empresaId: string) {
  const { data, error } = await supabase
    .from("calendario_eventos")
    .select("id,titulo,descricao,data_inicio,data_fim,tipo,cor,created_at")
    .eq("empresa_id", empresaId)
    .order("data_inicio");
  if (error) throw error;
  return data ?? [];
}

export async function createCalendarioEvento(empresaId: string, evento: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await supabase
    .from("calendario_eventos")
    .insert({ ...evento, empresa_id: empresaId, created_by: session?.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCalendarioEvento(id: string, evento: Record<string, unknown>) {
  const { error } = await supabase.from("calendario_eventos").update(evento).eq("id", id);
  if (error) throw error;
}

export async function deleteCalendarioEvento(id: string) {
  const { error } = await supabase.from("calendario_eventos").delete().eq("id", id);
  if (error) throw error;
}

// ─── Onboarding: garantir empresa ──────────────────────────────────────────────

/**
 * Garante que o usuário logado tenha uma empresa vinculada.
 * Fallback em app para o trigger SQL handle_new_user (caso o trigger não exista
 * ou o usuário seja anterior à migração). Idempotente.
 */
export async function garantirEmpresa() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const existente = await getEmpresaAtual();
  if (existente) return existente;

  const meta = session.user.user_metadata as { company_name?: string } | undefined;
  const nome = meta?.company_name?.trim()
    || session.user.email?.split("@")[0]
    || "Minha Marcenaria";

  // Cria empresa + vínculo (depende de RLS permitir; o trigger SQL é o caminho principal)
  const { data: emp, error: empErr } = await supabase
    .from("empresas").insert({ nome }).select("id").single();
  if (empErr) {
    // RLS bloqueou — o trigger SQL deve cuidar disso; retorna null silenciosamente
    return null;
  }
  await supabase.from("empresa_membros").insert({
    user_id: session.user.id, empresa_id: (emp as { id: string }).id, role: "owner",
  });
  return getEmpresaAtual();
}

// ─── Billing: planos e assinaturas ─────────────────────────────────────────────

export interface Plano {
  id: string;
  nome: string;
  preco_mensal: number;
  limite_orcamentos: number | null;
  limite_renders: number | null;
  limite_usuarios: number | null;
  recursos: string[];
  destaque: boolean;
  ordem: number;
}

export async function getPlanos(): Promise<Plano[]> {
  const { data, error } = await supabase
    .from("planos")
    .select("*")
    .eq("ativo", true)
    .order("ordem");
  if (error) throw error;
  return (data ?? []) as Plano[];
}

export interface Assinatura {
  id: string;
  empresa_id: string;
  plano_id: string;
  status: "pendente" | "ativa" | "atrasada" | "cancelada";
  asaas_payment_url: string | null;
  proximo_vencimento: string | null;
}

export async function getAssinatura(empresaId: string): Promise<Assinatura | null> {
  const { data } = await supabase
    .from("assinaturas")
    .select("id,empresa_id,plano_id,status,asaas_payment_url,proximo_vencimento")
    .eq("empresa_id", empresaId)
    .maybeSingle();
  return (data as Assinatura) ?? null;
}

/**
 * Inicia o checkout de um plano: chama o backend (Asaas) e devolve o link de
 * pagamento. O webhook do Asaas ativa a assinatura quando o pagamento confirma.
 */
export async function iniciarCheckout(planoId: string): Promise<{ payment_url: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Sessão expirada");

  const res = await fetch("/api/fiscal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "criar-assinatura", user_token: session.access_token, plano_id: planoId }),
  });
  const data = await res.json() as { payment_url?: string; error?: string };
  if (!res.ok || !data.payment_url) throw new Error(data.error ?? "Erro ao iniciar checkout");
  return { payment_url: data.payment_url };
}
