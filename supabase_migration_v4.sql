-- ============================================================
-- Planne ERP — Migration v4
-- ============================================================

-- 1. Rename orcamento_itens columns if old names still exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orcamento_itens' AND column_name = 'custo_unit'
  ) THEN
    ALTER TABLE public.orcamento_itens RENAME COLUMN custo_unit TO preco_custo;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orcamento_itens' AND column_name = 'preco_unit'
  ) THEN
    ALTER TABLE public.orcamento_itens RENAME COLUMN preco_unit TO preco_unitario;
  END IF;
END $$;

-- 2. Add material_id column to orcamento_itens if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orcamento_itens' AND column_name = 'material_id'
  ) THEN
    ALTER TABLE public.orcamento_itens
      ADD COLUMN material_id uuid REFERENCES public.materiais(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Create calendario_eventos table
CREATE TABLE IF NOT EXISTS public.calendario_eventos (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  uuid        NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  titulo      text        NOT NULL,
  descricao   text,
  data_inicio timestamptz NOT NULL,
  data_fim    timestamptz,
  tipo        text        NOT NULL DEFAULT 'evento',
  cor         text        DEFAULT '#3b82f6',
  created_by  uuid        REFERENCES auth.users(id),
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.calendario_eventos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'calendario_eventos' AND policyname = 'sel_cal_eventos') THEN
    CREATE POLICY sel_cal_eventos ON public.calendario_eventos FOR SELECT USING (is_member(empresa_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'calendario_eventos' AND policyname = 'ins_cal_eventos') THEN
    CREATE POLICY ins_cal_eventos ON public.calendario_eventos FOR INSERT WITH CHECK (is_member(empresa_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'calendario_eventos' AND policyname = 'upd_cal_eventos') THEN
    CREATE POLICY upd_cal_eventos ON public.calendario_eventos FOR UPDATE USING (is_member(empresa_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'calendario_eventos' AND policyname = 'del_cal_eventos') THEN
    CREATE POLICY del_cal_eventos ON public.calendario_eventos FOR DELETE USING (is_member(empresa_id));
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendario_eventos TO authenticated;

-- 4. replace_orcamento_itens RPC function
CREATE OR REPLACE FUNCTION public.replace_orcamento_itens(p_orcamento_id uuid, p_itens jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.orcamento_itens WHERE orcamento_id = p_orcamento_id;
  IF p_itens IS NOT NULL AND jsonb_array_length(p_itens) > 0 THEN
    INSERT INTO public.orcamento_itens
      (orcamento_id, descricao, quantidade, unidade, preco_custo, preco_unitario, material_id)
    SELECT
      p_orcamento_id,
      (elem->>'descricao')::text,
      COALESCE((elem->>'quantidade')::numeric, 1),
      COALESCE(elem->>'unidade', 'un'),
      COALESCE((elem->>'preco_custo')::numeric, 0),
      COALESCE((elem->>'preco_unitario')::numeric, 0),
      CASE
        WHEN elem->>'material_id' IS NOT NULL AND elem->>'material_id' <> ''
        THEN (elem->>'material_id')::uuid
        ELSE NULL
      END
    FROM jsonb_array_elements(p_itens) AS elem;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.replace_orcamento_itens(uuid, jsonb) TO authenticated;

-- 5. Price history trigger on materiais
CREATE OR REPLACE FUNCTION public.log_material_price_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (OLD.preco_custo IS DISTINCT FROM NEW.preco_custo)
     OR (OLD.preco_venda IS DISTINCT FROM NEW.preco_venda) THEN
    INSERT INTO public.materiais_historico_preco
      (material_id, preco_custo, preco_venda, fonte, vigente_em)
    VALUES
      (NEW.id, NEW.preco_custo, NEW.preco_venda, 'update_manual', now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_material_price_change ON public.materiais;
CREATE TRIGGER trg_material_price_change
  AFTER UPDATE OF preco_custo, preco_venda ON public.materiais
  FOR EACH ROW EXECUTE FUNCTION public.log_material_price_change();

-- 6. Auto-create perfil row when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.perfis (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
