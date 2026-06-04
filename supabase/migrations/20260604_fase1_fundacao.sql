-- ─────────────────────────────────────────────────────────────────────────────
-- PLANNE — Fase 1: Fundação
-- Migração: suporte ao Motor Paramétrico no banco de dados
--
-- ROLLBACK: ver comentário no final do arquivo
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Coluna para armazenar o ProjetoFabricavel gerado pelo motor paramétrico
ALTER TABLE room_projects
  ADD COLUMN IF NOT EXISTS projeto_fabricavel JSONB,
  ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'ia_vision'
    CHECK (origem IN ('ia_vision', 'motor_parametrico', 'manual'));

COMMENT ON COLUMN room_projects.projeto_fabricavel IS
  'ProjetoFabricavel serializado (Fase 1). Presente quando origem = motor_parametrico.';

COMMENT ON COLUMN room_projects.origem IS
  'Origem do projeto: ia_vision | motor_parametrico | manual';

-- 2. Índice para consultas por origem (usado em relatórios e analytics)
CREATE INDEX IF NOT EXISTS idx_room_projects_origem
  ON room_projects (empresa_id, origem);

-- 3. Índice para consultas no JSONB (tipo_ambiente frequentemente filtrado)
CREATE INDEX IF NOT EXISTS idx_room_projects_ambiente
  ON room_projects ((projeto_fabricavel->>'tipo_ambiente'))
  WHERE projeto_fabricavel IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- ROLLBACK (executar para desfazer):
--
--   DROP INDEX IF EXISTS idx_room_projects_ambiente;
--   DROP INDEX IF EXISTS idx_room_projects_origem;
--   ALTER TABLE room_projects
--     DROP COLUMN IF EXISTS projeto_fabricavel,
--     DROP COLUMN IF EXISTS origem;
-- ─────────────────────────────────────────────────────────────────────────────
