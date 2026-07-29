-- ─────────────────────────────────────────────────────────────────────────────
-- Planne — Render 3D: catálogo de ativos + mapeamento + fila de jobs
--
-- Este schema é o QUE É NOVO no render 3D. A geometria LÓGICA (medidas, nº de
-- portas, divisórias, chapa, puxador) NÃO vive aqui — ela vem do motor
-- paramétrico do app, dentro de render3d_job.payload (ModuloInstanciado[]).
-- Aqui ficam só: os ativos 3D, as texturas de chapa, o mapeamento e a fila.
--
-- Aplicar no SQL editor do Supabase. Ajustar as policies de RLS conforme o
-- padrão do projeto (multi-empresa por empresa_id).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Ativos 3D: geometria-base (gerada por código) ou modelo .blend (puxadores) ──
create table if not exists render_asset (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid references empresas(id) on delete cascade,  -- null = global (padrão Planne)
  tipo          text not null check (tipo in (
                  'caixa','porta_lisa','porta_vidro','gaveta','prateleira','rodape',
                  'lateral_acabamento','tampo','fundo','puxador','porta_correr',
                  'nicho','suporte_cesto','perfil_aluminio')),
  codigo        text not null,
  nome          text not null,
  -- 'param' = a geometria é gerada por código (bpy) a partir dos params;
  -- 'blend' = carrega um arquivo .blend do storage (ex.: puxadores modelados).
  fonte         text not null default 'param' check (fonte in ('param','blend')),
  blend_path    text,                     -- storage path do .blend (quando fonte='blend')
  params        jsonb not null default '{}'::jsonb,  -- defaults da geometria/encaixe
  ativo         boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (empresa_id, tipo, codigo)
);

-- ── Chapas: só textura + código (adicionar cor nova sem modelar nada) ──
create table if not exists render_chapa (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid references empresas(id) on delete cascade,
  codigo        text not null,            -- casa com o material/cor do orçamento
  nome          text not null,
  textura_path  text,                     -- storage path da imagem (albedo)
  cor_hex       text,                     -- fallback quando não há textura
  rugosidade    real not null default 0.4,-- roughness do PBR
  metalico      real not null default 0.0,
  repeticao_mm  integer not null default 800,  -- escala da textura (tamanho real do padrão)
  created_at    timestamptz not null default now(),
  unique (empresa_id, codigo)
);

-- ── Mapeamento: tipo de módulo (do motor) → quais ativos usar ──
-- modulo_template_codigo casa com ModuloInstanciado.modulo_template_codigo.
create table if not exists modulo_asset_map (
  id                     uuid primary key default gen_random_uuid(),
  empresa_id             uuid references empresas(id) on delete cascade,
  modulo_template_codigo text not null,   -- ex.: 'base', 'aereo', 'torre'
  caixa_asset_id         uuid references render_asset(id),
  porta_asset_id         uuid references render_asset(id),
  gaveta_asset_id        uuid references render_asset(id),
  puxador_asset_id       uuid references render_asset(id),
  created_at             timestamptz not null default now(),
  unique (empresa_id, modulo_template_codigo)
);

-- ── Fila de jobs de render 3D ──
create table if not exists render3d_job (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid references empresas(id) on delete cascade,
  origem        text not null check (origem in ('orcamento','ia_projetos')),
  origem_id     uuid,                     -- id do orçamento ou do projeto
  status        text not null default 'pending'
                  check (status in ('pending','processing','completed','error')),
  -- ENTRADA: os módulos JÁ dimensionados pelo motor + as escolhas do usuário.
  -- { modulos: ModuloInstanciado[], chapa_codigo, puxador_codigo, ambiente,
  --   medidas, camera } — o worker não recalcula geometria, só monta e renderiza.
  payload       jsonb not null,
  image_path    text,                     -- storage path do PNG final
  error         text,                     -- motivo quando status='error'
  tentativas    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists render3d_job_fila_idx on render3d_job (status, created_at);

-- Bucket de storage sugerido: 'renders3d' (público de leitura, escrita pelo worker).
-- Criar em Storage → New bucket. Policies conforme padrão do projeto.

-- ── RLS (padrão do projeto: is_member / minha_empresa_id) ──
-- Catálogo: leitura de ativos globais (empresa_id null) liberada a todos os
-- membros; escrita só na própria empresa. Jobs: sempre por empresa. O worker usa
-- service_role (bypassa RLS), então continua conseguindo ler/atualizar a fila.

alter table render_asset     enable row level security;
alter table render_chapa     enable row level security;
alter table modulo_asset_map enable row level security;
alter table render3d_job     enable row level security;

do $$
declare t text;
begin
  foreach t in array array['render_asset','render_chapa','modulo_asset_map'] loop
    execute format('drop policy if exists %1$s_read on %1$s', t);
    execute format('drop policy if exists %1$s_ins on %1$s', t);
    execute format('drop policy if exists %1$s_upd on %1$s', t);
    execute format('drop policy if exists %1$s_del on %1$s', t);
    execute format('create policy %1$s_read on %1$s for select using (empresa_id is null or is_member(empresa_id))', t);
    execute format('create policy %1$s_ins on %1$s for insert with check (is_member(empresa_id))', t);
    execute format('create policy %1$s_upd on %1$s for update using (is_member(empresa_id))', t);
    execute format('create policy %1$s_del on %1$s for delete using (is_member(empresa_id))', t);
  end loop;
end $$;

drop policy if exists render3d_job_read on render3d_job;
drop policy if exists render3d_job_ins on render3d_job;
drop policy if exists render3d_job_upd on render3d_job;
create policy render3d_job_read on render3d_job for select using (is_member(empresa_id));
create policy render3d_job_ins on render3d_job for insert with check (is_member(empresa_id));
create policy render3d_job_upd on render3d_job for update using (is_member(empresa_id));
