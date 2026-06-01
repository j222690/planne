-- =============================================================
-- PLANNE — Migration v7
-- Execute no SQL Editor do Supabase UMA VEZ.
-- Adiciona coluna fiscal_dados em orcamentos para NF-e e boleto/PIX.
-- =============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orcamentos' AND column_name = 'fiscal_dados'
  ) THEN
    ALTER TABLE public.orcamentos ADD COLUMN fiscal_dados jsonb;
  END IF;
END $$;
