-- =============================================================
-- PLANNE — Migration v5
-- Execute no SQL Editor do Supabase UMA VEZ.
-- =============================================================

-- 1. projetos: cliente_id deve ser nullable (form permite "Sem cliente")
ALTER TABLE public.projetos
  ALTER COLUMN cliente_id DROP NOT NULL;

-- 2. projetos: status check constraint deve aceitar os valores usados pelo app
ALTER TABLE public.projetos DROP CONSTRAINT IF EXISTS projetos_status_check;
ALTER TABLE public.projetos
  ADD CONSTRAINT projetos_status_check
  CHECK (status IN ('briefing','projeto','aprovacao','producao','entregue'));

-- 3. fornecedores: adicionar coluna categoria se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'fornecedores'
      AND column_name  = 'categoria'
  ) THEN
    ALTER TABLE public.fornecedores ADD COLUMN categoria text;
  END IF;
END $$;
