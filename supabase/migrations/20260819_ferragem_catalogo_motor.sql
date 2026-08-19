-- Fase 6 do plano de evolução do motor 3D paramétrico: catálogo de
-- ferragens real conectado ao motor (cadastro/custo — modelo 3D fica
-- explicitamente pra depois).
--
-- Opt-in por design, e de propósito NÃO depende de `materiais.categoria_id`
-- (achado real: introspecção mostrou 8860 linhas em produção, 0 com
-- categoria_id preenchido — a UI de categoria hoje é só cosmética/heurística
-- por nome, não persiste). tipo_ferragem_motor é o sinal direto: qualquer
-- material com esse campo preenchido vira candidato a sobrescrever o preço
-- de referência do motor pro tipo de ferragem correspondente
-- (ConfiguracaoCusto.precos_ferragem, src/lib/motor-parametrico/
-- orcamento-inteligente.ts).
--
-- Idempotente.

alter table public.materiais
  add column if not exists tipo_ferragem_motor text;
