-- =============================================================
-- PLANNE — Schema completo v2
-- Cole no SQL Editor do Supabase e execute UMA VEZ.
-- =============================================================

create extension if not exists "pgcrypto";

-- ─── 1. EMPRESAS (multi-tenant) ──────────────────────────────
create table if not exists public.empresas (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  cnpj         text,
  cidade       text,
  logo_url     text,
  cor_primaria text,
  created_at   timestamptz not null default now()
);

do $$ begin
  create type public.app_role as enum ('admin','vendedor','arquiteto','producao');
exception when duplicate_object then null; end $$;

create table if not exists public.empresa_membros (
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       public.app_role not null default 'admin',
  created_at timestamptz not null default now(),
  primary key (empresa_id, user_id)
);

-- ─── 2. HELPERS RLS (sem recursão) ───────────────────────────
create or replace function public.is_member(_empresa uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.empresa_membros where empresa_id=_empresa and user_id=auth.uid());
$$;

create or replace function public.has_role(_empresa uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.empresa_membros where empresa_id=_empresa and user_id=auth.uid() and role=_role);
$$;

-- ─── 3. CLIENTES ─────────────────────────────────────────────
create table if not exists public.clientes (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references public.empresas(id) on delete cascade,
  nome         text not null,
  email        text,
  telefone     text,
  origem       text,
  cidade       text,
  observacoes  text,
  created_at   timestamptz not null default now()
);
create index if not exists idx_clientes_empresa on public.clientes(empresa_id);

-- ─── 4. FORNECEDORES ─────────────────────────────────────────
create table if not exists public.fornecedores (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome       text not null,
  categoria  text,
  modo_sync  text default 'manual',   -- api | planilha | pdf | manual
  ativo      boolean default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_fornecedores_empresa on public.fornecedores(empresa_id);

-- ─── 5. MATERIAIS ────────────────────────────────────────────
create table if not exists public.materiais (
  id               uuid primary key default gen_random_uuid(),
  empresa_id       uuid not null references public.empresas(id) on delete cascade,
  fornecedor_id    uuid references public.fornecedores(id) on delete set null,
  codigo           text,
  nome             text not null,
  nome_normalizado text,
  categoria        text,      -- chapas|ferragens|fitas|puxadores|vidro|acessorios
  unidade          text default 'un',
  custo            numeric(12,2) default 0,
  estoque          numeric(12,2) default 0,
  estoque_minimo   numeric(12,2) default 5,
  metadata         jsonb default '{}'::jsonb,
  updated_at       timestamptz not null default now(),
  created_at       timestamptz not null default now()
);
create index if not exists idx_materiais_empresa    on public.materiais(empresa_id);
create index if not exists idx_materiais_categoria  on public.materiais(empresa_id, categoria);

-- ─── 6. PROJETOS ─────────────────────────────────────────────
create table if not exists public.projetos (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references public.empresas(id) on delete cascade,
  cliente_id   uuid references public.clientes(id) on delete set null,
  nome         text not null,
  descricao    text,
  status       text default 'briefing',  -- briefing|projeto|aprovacao|producao|entregue
  responsavel  uuid references auth.users(id),
  created_at   timestamptz not null default now()
);
create index if not exists idx_projetos_empresa on public.projetos(empresa_id);

-- ─── 7. ORÇAMENTOS ───────────────────────────────────────────
create table if not exists public.orcamentos (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references public.empresas(id) on delete cascade,
  projeto_id   uuid references public.projetos(id) on delete set null,
  cliente_id   uuid references public.clientes(id) on delete set null,
  numero       text,
  status       text default 'rascunho',  -- rascunho|analise|aprovado|recusado
  subtotal     numeric(12,2) default 0,
  margem_pct   numeric(5,2)  default 0,
  total        numeric(12,2) default 0,
  observacoes  text,
  pdf_url      text,
  assinado_em  timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists idx_orcamentos_empresa on public.orcamentos(empresa_id);

-- ─── 8. ITENS DO ORÇAMENTO ───────────────────────────────────
create table if not exists public.orcamento_itens (
  id            uuid primary key default gen_random_uuid(),
  orcamento_id  uuid not null references public.orcamentos(id) on delete cascade,
  material_id   uuid references public.materiais(id) on delete set null,
  descricao     text not null,
  quantidade    numeric(12,3) not null default 1,
  unidade       text default 'un',
  custo_unit    numeric(12,2) default 0,
  preco_unit    numeric(12,2) default 0
);
create index if not exists idx_oi_orcamento on public.orcamento_itens(orcamento_id);

-- ─── 9. ORDENS DE PRODUÇÃO ───────────────────────────────────
create table if not exists public.ordens_producao (
  id           uuid primary key default gen_random_uuid(),
  empresa_id   uuid not null references public.empresas(id) on delete cascade,
  projeto_id   uuid references public.projetos(id) on delete set null,
  numero       text,
  status       text default 'aberta',  -- aberta|corte|montagem|inspecao|entregue
  etapa_atual  text,
  created_at   timestamptz not null default now()
);
create index if not exists idx_op_empresa on public.ordens_producao(empresa_id);

-- ─── 10. RLS ─────────────────────────────────────────────────
alter table public.empresas          enable row level security;
alter table public.empresa_membros   enable row level security;
alter table public.clientes          enable row level security;
alter table public.fornecedores      enable row level security;
alter table public.materiais         enable row level security;
alter table public.projetos          enable row level security;
alter table public.orcamentos        enable row level security;
alter table public.orcamento_itens   enable row level security;
alter table public.ordens_producao   enable row level security;

-- Empresas
drop policy if exists "membro_ve_empresa"      on public.empresas;
drop policy if exists "admin_atualiza_empresa" on public.empresas;
create policy "membro_ve_empresa"      on public.empresas for select using (public.is_member(id));
create policy "admin_atualiza_empresa" on public.empresas for update using (public.has_role(id,'admin'));

-- Membros
drop policy if exists "membro_ve_membros"      on public.empresa_membros;
drop policy if exists "admin_gerencia_membros" on public.empresa_membros;
create policy "membro_ve_membros"      on public.empresa_membros for select using (public.is_member(empresa_id));
create policy "admin_gerencia_membros" on public.empresa_membros for all
  using (public.has_role(empresa_id,'admin')) with check (public.has_role(empresa_id,'admin'));

-- Tabelas com empresa_id
do $$
declare t text;
begin
  for t in select unnest(array['clientes','fornecedores','materiais','projetos','orcamentos','ordens_producao'])
  loop
    execute format($f$
      drop policy if exists "membro_le_%1$s"       on public.%1$s;
      drop policy if exists "membro_insere_%1$s"   on public.%1$s;
      drop policy if exists "membro_atualiza_%1$s" on public.%1$s;
      drop policy if exists "admin_remove_%1$s"    on public.%1$s;
      create policy "membro_le_%1$s"       on public.%1$s for select using (public.is_member(empresa_id));
      create policy "membro_insere_%1$s"   on public.%1$s for insert with check (public.is_member(empresa_id));
      create policy "membro_atualiza_%1$s" on public.%1$s for update using (public.is_member(empresa_id));
      create policy "admin_remove_%1$s"    on public.%1$s for delete using (public.has_role(empresa_id,'admin'));
    $f$, t);
  end loop;
end $$;

-- Itens do orçamento (via join)
drop policy if exists "membro_le_oi"    on public.orcamento_itens;
drop policy if exists "membro_grava_oi" on public.orcamento_itens;
create policy "membro_le_oi" on public.orcamento_itens for select using (
  exists(select 1 from public.orcamentos o where o.id=orcamento_itens.orcamento_id and public.is_member(o.empresa_id))
);
create policy "membro_grava_oi" on public.orcamento_itens for all using (
  exists(select 1 from public.orcamentos o where o.id=orcamento_itens.orcamento_id and public.is_member(o.empresa_id))
) with check (
  exists(select 1 from public.orcamentos o where o.id=orcamento_itens.orcamento_id and public.is_member(o.empresa_id))
);

-- ─── 11. TRIGGER: cria empresa + admin no signup ─────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_empresa uuid;
  v_nome    text;
begin
  v_nome := coalesce(new.raw_user_meta_data->>'company_name', split_part(new.email,'@',1));
  insert into public.empresas (nome) values (v_nome) returning id into v_empresa;
  insert into public.empresa_membros (empresa_id, user_id, role) values (v_empresa, new.id, 'admin');
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- FIM DO SCHEMA PLANNE v2
