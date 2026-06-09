-- Acesso admin sem restrições para victorcapelina@gmail.com
-- Créditos praticamente ilimitados + assinatura Enterprise ativa (limites null = ilimitado).
-- Idempotente: pode rodar várias vezes.

do $$
declare
  v_empresa uuid;
begin
  for v_empresa in
    select em.empresa_id
    from auth.users au
    join public.empresa_membros em on em.user_id = au.id
    where lower(au.email) = 'victorcapelina@gmail.com'
  loop
    -- 1. Créditos altíssimos + flag admin (não bloqueia projeto IA nem render)
    update public.empresas
    set parametros = coalesce(parametros, '{}'::jsonb) || jsonb_build_object(
      'creditos_projeto_ia', 999999,
      'creditos_render', 999999,
      'admin', true
    )
    where id = v_empresa;

    -- 2. Assinatura Enterprise ativa, sem cobrança (vence em 100 anos)
    insert into public.assinaturas (empresa_id, plano_id, status, proximo_vencimento)
    values (v_empresa, 'enterprise', 'ativa', (now() + interval '100 years')::date)
    on conflict (empresa_id) do update set
      plano_id = 'enterprise',
      status = 'ativa',
      proximo_vencimento = (now() + interval '100 years')::date,
      atualizado_em = now();
  end loop;
end $$;
