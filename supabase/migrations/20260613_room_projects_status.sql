-- 3.7: persistência robusta do wizard de IA Projetos.
-- Coluna status para rastrear o ciclo do projeto: analisando | pronto | erro.
-- Idempotente.

alter table public.room_projects
  add column if not exists status text default 'pronto';

-- Projetos antigos sem status ficam como 'pronto'.
update public.room_projects set status = 'pronto' where status is null;
