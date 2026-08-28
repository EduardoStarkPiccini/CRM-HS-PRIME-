-- ============================================================
-- CRM HS PRIME — 0009: Storage — fotos dos vendedores
-- Bucket "avatars" já preparado para quando o upload de fotos
-- dos vendedores for implementado (profiles.avatar_url).
-- ============================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Qualquer pessoa autenticada pode ver as fotos (bucket público de leitura).
create policy "avatars: leitura pública"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Um usuário autenticado só pode enviar/atualizar/remover a própria foto,
-- identificada pelo prefixo "<user_id>/..." no caminho do arquivo.
create policy "avatars: usuário gerencia a própria foto (insert)"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars: usuário gerencia a própria foto (update)"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars: usuário gerencia a própria foto (delete)"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
