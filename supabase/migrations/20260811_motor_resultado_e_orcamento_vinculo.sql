-- Fase 1 do plano de evolução do motor 3D paramétrico: fonte única de
-- verdade persistida.
--
-- `room_projects.motor_resultado` guarda o MotorResultado COMPLETO (não só
-- o ProjetoFabricavel que `projeto_fabricavel` já guardava) — peças,
-- ferragens, as 3 versões de orçamento, plano de corte e PCP, exatamente
-- como calculados no momento em que o projeto foi gerado. Guardar o
-- resultado completo (não recalcular ao reabrir) é proposital: um orçamento
-- já mostrado a um cliente não pode mudar de valor sozinho se a empresa
-- alterar o preço padrão de chapa depois.
--
-- `orcamentos.room_project_id` é um vínculo estruturado de volta pro
-- projeto rico do motor — diferente de `orcamentos.projeto_id`, que
-- referencia a tabela `projetos` legada (sistema comercial simples,
-- desconectado do motor paramétrico).
--
-- Idempotente.

alter table public.room_projects
  add column if not exists motor_resultado jsonb;

alter table public.orcamentos
  add column if not exists room_project_id uuid references public.room_projects(id);
