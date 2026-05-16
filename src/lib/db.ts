// Helpers de banco — abstraem queries Supabase usadas nas rotas
import { supabase } from "./supabase";

// ─── Empresa do usuário atual ─────────────────────────────────────────────────
export async function getEmpresaAtual() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from("empresa_membros")
    .select("empresa_id, role, empresas(id, nome, cnpj, cidade, cor_primaria, logo_url)")
    .eq("user_id", session.user.id)
    .single();

  if (error || !data) return null;
  return {
    ...data.empresas as {id:string;nome:string;cnpj:string|null;cidade:string|null;cor_primaria:string|null;logo_url:string|null},
    role: data.role,
  };
}

// ─── Clientes ─────────────────────────────────────────────────────────────────
export async function getClientes(empresaId: string) {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function upsertCliente(empresaId: string, cliente: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("clientes")
    .upsert({ ...cliente, empresa_id: empresaId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Orçamentos ───────────────────────────────────────────────────────────────
export async function getOrcamentos(empresaId: string) {
  const { data, error } = await supabase
    .from("orcamentos")
    .select(`*, clientes(nome), projetos(nome)`)
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function upsertOrcamento(empresaId: string, orc: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("orcamentos")
    .upsert({ ...orc, empresa_id: empresaId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Materiais ────────────────────────────────────────────────────────────────
export async function getMateriais(empresaId: string) {
  const { data, error } = await supabase
    .from("materiais")
    .select(`*, fornecedores(nome)`)
    .eq("empresa_id", empresaId)
    .order("categoria")
    .order("nome");
  if (error) throw error;
  return data ?? [];
}

// ─── Projetos ─────────────────────────────────────────────────────────────────
export async function getProjetos(empresaId: string) {
  const { data, error } = await supabase
    .from("projetos")
    .select(`*, clientes(nome)`)
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────
export async function getDashboardStats(empresaId: string) {
  const [orcsRes, projsRes] = await Promise.all([
    supabase
      .from("orcamentos")
      .select("status, total, created_at")
      .eq("empresa_id", empresaId),
    supabase
      .from("projetos")
      .select("status")
      .eq("empresa_id", empresaId),
  ]);

  const orcs = orcsRes.data ?? [];
  const projs = projsRes.data ?? [];

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const faturamentoMes = orcs
    .filter((o) => o.status === "aprovado" && new Date(o.created_at) >= startOfMonth)
    .reduce((s, o) => s + (o.total ?? 0), 0);

  const margemMedia = orcs.length
    ? orcs.reduce((s: number, o: {margem_pct?: number}) => s + (o.margem_pct ?? 0), 0) / orcs.length
    : 0;

  const projetosAtivos = projs.filter((p) => !["entregue"].includes(p.status)).length;

  const emAnalise = orcs.filter((o) => o.status === "analise").length;

  return { faturamentoMes, margemMedia, projetosAtivos, emAnalise };
}
