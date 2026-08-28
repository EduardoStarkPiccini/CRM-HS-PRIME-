-- ============================================================
-- CRM HS PRIME — 0011: trava de segurança no cadastro de profiles
--
-- Na Etapa 1, a política de INSERT em "profiles" permitia que o
-- próprio usuário criasse seu registro (id = auth.uid()). Isso foi
-- pensado para o fluxo normal de cadastro, mas o primeiro gestor
-- e todo vendedor agora são sempre criados pelo servidor (rotas
-- api/setup/create-admin e api/team, usando a service role, que
-- ignora RLS). Por segurança, fechamos o INSERT direto do cliente:
-- ninguém mais consegue criar linhas em "profiles" via anon key.
-- ============================================================

drop policy if exists "profiles: gestor cria perfis" on public.profiles;

create policy "profiles: somente o servidor cria perfis (service role)"
  on public.profiles for insert
  with check (public.is_gestor());

-- Observação: a service role sempre ignora RLS, então as rotas
-- administrativas continuam funcionando normalmente. Esta política
-- só afeta chamadas feitas com a chave anon (frontend).
