-- =============================================================
-- PLANNE — Migration v8
-- Execute no SQL Editor do Supabase UMA VEZ.
-- Adiciona controle de estoque em materiais.
-- =============================================================

-- Estoque atual de chapas/unidades
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'materiais' AND column_name = 'estoque_atual'
  ) THEN
    ALTER TABLE public.materiais ADD COLUMN estoque_atual NUMERIC DEFAULT NULL;
  END IF;
END $$;

-- Estoque mínimo (threshold de alerta)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'materiais' AND column_name = 'estoque_minimo'
  ) THEN
    ALTER TABLE public.materiais ADD COLUMN estoque_minimo NUMERIC DEFAULT NULL;
  END IF;
END $$;
