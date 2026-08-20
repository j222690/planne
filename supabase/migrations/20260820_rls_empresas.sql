-- RLS da tabela `empresas` estava habilitada (relrowsecurity=true) mas SEM
-- NENHUMA policy — Postgres nega tudo por padrão nesse caso. Efeito real:
-- getEmpresaAtual() (src/lib/db.ts) sempre lia `empresas` vazio via embed
-- (empresa_membros -> empresas(...)), então toda config de empresa
-- (mdf_custo_chapa, acabamentos padrão, ferragem padrão, tokens fiscais,
-- book_* do book técnico) sempre caía no default do código-fonte, nunca no
-- valor real salvo. Nome/cidade também sempre caíam no fallback ("Planne" /
-- "Plano Pro"), o que mascarou o bug por parecer dado real.
--
-- Reaproveita as mesmas funções SECURITY DEFINER já usadas em
-- empresa_membros/room_projects (is_member, has_role) — evita recursão de
-- RLS porque elas fazem select direto em empresa_membros, não em empresas.

drop policy if exists "empresas_select_membro" on public.empresas;
create policy "empresas_select_membro" on public.empresas
  for select
  using (public.is_member(id));

drop policy if exists "empresas_update_admin" on public.empresas;
create policy "empresas_update_admin" on public.empresas
  for update
  using (public.has_role(id, 'admin') or public.has_role(id, 'owner'))
  with check (public.has_role(id, 'admin') or public.has_role(id, 'owner'));

-- Onboarding (getOrCreateEmpresa em src/lib/db.ts) insere `empresas` com o
-- usuário recém-logado, ANTES de existir vínculo em empresa_membros — não
-- dá pra checar membership ainda nesse momento. O caminho principal é um
-- trigger SQL (SECURITY DEFINER, ignora RLS); isto só destrava o fallback
-- client-side pra qualquer usuário autenticado sem empresa ainda.
drop policy if exists "empresas_insert_autenticado" on public.empresas;
create policy "empresas_insert_autenticado" on public.empresas
  for insert
  with check (auth.uid() is not null);
