-- Privilégios de tabela para os roles da API (complementa o RLS de billing).
grant select on public.planos to anon, authenticated;
grant select, insert, update on public.assinaturas to authenticated;
