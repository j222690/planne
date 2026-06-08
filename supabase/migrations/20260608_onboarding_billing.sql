-- PLANNE — Onboarding automático de empresa + Billing (planos e assinaturas)
-- Rode este arquivo no SQL Editor do Supabase.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ONBOARDING: ao criar usuário, cria a empresa e o vínculo (owner)
-- ─────────────────────────────────────────────────────────────────────────────
-- Resolve o cadastro: hoje o signup cria o usuário mas não a empresa, deixando
-- a marcenaria sem empresa_id. Este trigger cria tudo automaticamente.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
  v_nome text;
begin
  -- Só cria se o usuário ainda não tem vínculo (idempotente)
  if exists (select 1 from public.empresa_membros where user_id = new.id) then
    return new;
  end if;

  v_nome := coalesce(
    nullif(new.raw_user_meta_data->>'company_name', ''),
    split_part(coalesce(new.email, 'marcenaria'), '@', 1),
    'Minha Marcenaria'
  );

  insert into public.empresas (nome)
  values (v_nome)
  returning id into v_empresa_id;

  insert into public.empresa_membros (user_id, empresa_id, role)
  values (new.id, v_empresa_id, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: cria empresa para usuários existentes que ficaram sem vínculo
do $$
declare
  u record;
  v_empresa_id uuid;
begin
  for u in
    select au.id, au.email, au.raw_user_meta_data
    from auth.users au
    left join public.empresa_membros em on em.user_id = au.id
    where em.user_id is null
  loop
    insert into public.empresas (nome)
    values (coalesce(nullif(u.raw_user_meta_data->>'company_name',''), split_part(coalesce(u.email,'marcenaria'),'@',1), 'Minha Marcenaria'))
    returning id into v_empresa_id;
    insert into public.empresa_membros (user_id, empresa_id, role)
    values (u.id, v_empresa_id, 'owner');
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. PLANOS (catálogo público)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.planos (
  id text primary key,
  nome text not null,
  preco_mensal numeric not null,
  limite_orcamentos int,          -- null = ilimitado
  limite_renders int,             -- null = ilimitado
  limite_usuarios int,            -- null = ilimitado
  recursos jsonb default '[]'::jsonb,
  destaque boolean default false,
  ativo boolean default true,
  ordem int default 0
);

insert into public.planos (id, nome, preco_mensal, limite_orcamentos, limite_renders, limite_usuarios, recursos, destaque, ordem)
values
  ('starter', 'Starter', 297, 30, 10, 2,
   '["Motor paramétrico (cozinha, quarto, banheiro)","Orçamento em 3 versões","Plano de corte CNC (DXF/CSV)","Lista de peças e ferragens"]'::jsonb, false, 1),
  ('pro', 'Profissional', 597, 120, 50, 5,
   '["Tudo do Starter","PCP e cronograma de produção","Render premium (Flux/DALL-E)","Emissão de NF-e, boleto e PIX","Todos os ambientes (L, U, ilha, closet)"]'::jsonb, true, 2),
  ('enterprise', 'Enterprise', 997, null, null, null,
   '["Tudo do Profissional","Orçamentos e renders ilimitados","Usuários ilimitados","Copiloto da marcenaria","Suporte prioritário"]'::jsonb, false, 3)
on conflict (id) do update set
  nome = excluded.nome, preco_mensal = excluded.preco_mensal,
  limite_orcamentos = excluded.limite_orcamentos, limite_renders = excluded.limite_renders,
  limite_usuarios = excluded.limite_usuarios, recursos = excluded.recursos,
  destaque = excluded.destaque, ordem = excluded.ordem;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ASSINATURAS (uma por empresa)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  plano_id text not null references public.planos(id),
  status text not null default 'pendente',   -- pendente | ativa | atrasada | cancelada
  asaas_customer_id text,
  asaas_subscription_id text,
  asaas_payment_url text,
  ciclo text default 'MONTHLY',
  proximo_vencimento date,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

create unique index if not exists idx_assinaturas_empresa on public.assinaturas(empresa_id);
create index if not exists idx_assinaturas_asaas_sub on public.assinaturas(asaas_subscription_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RLS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.planos enable row level security;
alter table public.assinaturas enable row level security;

drop policy if exists "planos_select_all" on public.planos;
create policy "planos_select_all" on public.planos
  for select using (true);

drop policy if exists "assinaturas_por_empresa" on public.assinaturas;
create policy "assinaturas_por_empresa" on public.assinaturas
  using (empresa_id in (select empresa_id from public.empresa_membros where user_id = auth.uid()))
  with check (empresa_id in (select empresa_id from public.empresa_membros where user_id = auth.uid()));
