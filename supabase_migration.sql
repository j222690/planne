-- =============================================================
-- PLANNE — Migration v2 → v3
-- Cole no SQL Editor do Supabase e execute UMA VEZ.
-- =============================================================

-- ─── 1. empresas: colunas de contato ─────────────────────────
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS email    text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS estado   text,
  ADD COLUMN IF NOT EXISTS endereco text;

-- ─── 2. clientes: colunas extras ─────────────────────────────
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS whatsapp   text,
  ADD COLUMN IF NOT EXISTS estado     text,
  ADD COLUMN IF NOT EXISTS cpf_cnpj   text,
  ADD COLUMN IF NOT EXISTS tipo       text DEFAULT 'pessoa_fisica',
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- ─── 3. materiais: renomear custo → preco_custo + novas colunas
ALTER TABLE public.materiais RENAME COLUMN custo TO preco_custo;
ALTER TABLE public.materiais
  ADD COLUMN IF NOT EXISTS preco_venda  numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ativo        boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS categoria_id uuid;

-- ─── 4. categorias_material ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categorias_material (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cat_material_empresa ON public.categorias_material(empresa_id);

ALTER TABLE public.materiais
  ADD CONSTRAINT fk_materiais_categoria
  FOREIGN KEY (categoria_id) REFERENCES public.categorias_material(id) ON DELETE SET NULL;

-- ─── 5. orcamentos: coluna criado_por ────────────────────────
ALTER TABLE public.orcamentos
  ADD COLUMN IF NOT EXISTS criado_por uuid REFERENCES auth.users(id);

-- ─── 6. ordens_producao: trigger de número automático ────────
CREATE SEQUENCE IF NOT EXISTS op_numero_seq;

CREATE OR REPLACE FUNCTION public.gen_op_numero()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.numero IS NULL THEN
    NEW.numero := 'OP-' || LPAD(NEXTVAL('op_numero_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS op_numero_trigger ON public.ordens_producao;
CREATE TRIGGER op_numero_trigger
  BEFORE INSERT ON public.ordens_producao
  FOR EACH ROW EXECUTE FUNCTION public.gen_op_numero();

-- ─── 7. orcamentos: trigger de número automático ─────────────
CREATE SEQUENCE IF NOT EXISTS orcamento_numero_seq;

CREATE OR REPLACE FUNCTION public.gen_orcamento_numero()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.numero IS NULL THEN
    NEW.numero := 'ORC-' || LPAD(NEXTVAL('orcamento_numero_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS orcamento_numero_trigger ON public.orcamentos;
CREATE TRIGGER orcamento_numero_trigger
  BEFORE INSERT ON public.orcamentos
  FOR EACH ROW EXECUTE FUNCTION public.gen_orcamento_numero();

-- ─── 8. financeiro ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.financeiro (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo        text NOT NULL,         -- entrada | saida
  descricao   text NOT NULL,
  valor       numeric(12,2) NOT NULL DEFAULT 0,
  categoria   text,
  status      text DEFAULT 'pendente',  -- pendente | pago | atrasado
  vencimento  date,
  pago_em     date,
  projeto_id  uuid REFERENCES public.projetos(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_financeiro_empresa ON public.financeiro(empresa_id);

ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;
CREATE POLICY "membro_le_financeiro"       ON public.financeiro FOR SELECT USING (public.is_member(empresa_id));
CREATE POLICY "membro_insere_financeiro"   ON public.financeiro FOR INSERT WITH CHECK (public.is_member(empresa_id));
CREATE POLICY "membro_atualiza_financeiro" ON public.financeiro FOR UPDATE USING (public.is_member(empresa_id));
CREATE POLICY "admin_remove_financeiro"    ON public.financeiro FOR DELETE USING (public.has_role(empresa_id,'admin'));

-- ─── 9. categorias_material: RLS ─────────────────────────────
ALTER TABLE public.categorias_material ENABLE ROW LEVEL SECURITY;
CREATE POLICY "membro_le_cat"      ON public.categorias_material FOR SELECT USING (public.is_member(empresa_id));
CREATE POLICY "membro_insere_cat"  ON public.categorias_material FOR INSERT WITH CHECK (public.is_member(empresa_id));
CREATE POLICY "membro_atualiza_cat" ON public.categorias_material FOR UPDATE USING (public.is_member(empresa_id));
CREATE POLICY "admin_remove_cat"   ON public.categorias_material FOR DELETE USING (public.has_role(empresa_id,'admin'));

-- ─── 10. vw_dashboard_kpis ───────────────────────────────────
CREATE OR REPLACE VIEW public.vw_dashboard_kpis AS
SELECT
  e.id AS empresa_id,
  COALESCE(SUM(CASE WHEN o.status = 'aprovado'
    AND date_trunc('month', o.created_at) = date_trunc('month', NOW())
    THEN o.total ELSE 0 END), 0)                                         AS faturamento_mes,
  COALESCE(AVG(CASE WHEN o.status IN ('aprovado','analise')
    AND o.margem_pct > 0 THEN o.margem_pct END), 0)                      AS margem_media,
  (SELECT COUNT(*) FROM public.projetos p
    WHERE p.empresa_id = e.id AND p.status <> 'entregue')                AS projetos_ativos,
  COALESCE(SUM(CASE WHEN o.status = 'analise'  THEN 1 ELSE 0 END), 0)   AS orcamentos_aguardando,
  (SELECT COUNT(*) FROM public.clientes c WHERE c.empresa_id = e.id)     AS total_clientes,
  COALESCE(SUM(CASE WHEN o.status = 'aprovado' THEN 1 ELSE 0 END), 0)   AS orcamentos_aprovados
FROM public.empresas e
LEFT JOIN public.orcamentos o ON o.empresa_id = e.id
GROUP BY e.id;

GRANT SELECT ON public.vw_dashboard_kpis TO authenticated;

-- FIM DA MIGRATION v3
