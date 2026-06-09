-- Verificação (apenas RAISE NOTICE, não altera dados): confirma o acesso admin.
do $$
declare
  v_empresas int;
  v_creditos int;
  v_assinatura text;
begin
  select count(*) into v_empresas
  from auth.users au
  join public.empresa_membros em on em.user_id = au.id
  where lower(au.email) = 'victorcapelina@gmail.com';

  select (e.parametros->>'creditos_render')::int into v_creditos
  from auth.users au
  join public.empresa_membros em on em.user_id = au.id
  join public.empresas e on e.id = em.empresa_id
  where lower(au.email) = 'victorcapelina@gmail.com'
  limit 1;

  select a.plano_id || '/' || a.status into v_assinatura
  from auth.users au
  join public.empresa_membros em on em.user_id = au.id
  join public.assinaturas a on a.empresa_id = em.empresa_id
  where lower(au.email) = 'victorcapelina@gmail.com'
  limit 1;

  raise notice 'ADMIN CHECK: empresas vinculadas=% | creditos_render=% | assinatura=%',
    v_empresas, coalesce(v_creditos::text, 'NULL'), coalesce(v_assinatura, 'NENHUMA');
end $$;
