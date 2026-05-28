-- =============================================================
-- PLANNE — Migration v6
-- Execute no SQL Editor do Supabase UMA VEZ.
-- Adiciona colunas faltantes em orcamento_itens e atualiza RPC.
-- =============================================================

-- 1. Adicionar colunas faltantes em orcamento_itens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orcamento_itens' AND column_name = 'movel'
  ) THEN
    ALTER TABLE public.orcamento_itens ADD COLUMN movel text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orcamento_itens' AND column_name = 'justificativa'
  ) THEN
    ALTER TABLE public.orcamento_itens ADD COLUMN justificativa text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orcamento_itens' AND column_name = 'total'
  ) THEN
    ALTER TABLE public.orcamento_itens ADD COLUMN total numeric(14,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orcamento_itens' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.orcamento_itens ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

-- 2. Adicionar moveis_config em orcamentos se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orcamentos' AND column_name = 'moveis_config'
  ) THEN
    ALTER TABLE public.orcamentos ADD COLUMN moveis_config jsonb;
  END IF;
END $$;

-- 3. Atualizar RPC replace_orcamento_itens para incluir movel e justificativa
CREATE OR REPLACE FUNCTION public.replace_orcamento_itens(p_orcamento_id uuid, p_itens jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.orcamento_itens WHERE orcamento_id = p_orcamento_id;
  IF p_itens IS NOT NULL AND jsonb_array_length(p_itens) > 0 THEN
    INSERT INTO public.orcamento_itens
      (orcamento_id, movel, justificativa, descricao, quantidade, unidade, preco_custo, preco_unitario, total, material_id)
    SELECT
      p_orcamento_id,
      (elem->>'movel')::text,
      (elem->>'justificativa')::text,
      (elem->>'descricao')::text,
      COALESCE((elem->>'quantidade')::numeric, 1),
      COALESCE(elem->>'unidade', 'un'),
      COALESCE((elem->>'preco_custo')::numeric, 0),
      COALESCE((elem->>'preco_unitario')::numeric, 0),
      COALESCE((elem->>'total')::numeric, 0),
      CASE WHEN elem->>'material_id' IS NOT NULL THEN (elem->>'material_id')::uuid ELSE NULL END
    FROM jsonb_array_elements(p_itens) AS elem;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.replace_orcamento_itens(uuid, jsonb) TO authenticated;
