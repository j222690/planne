-- Bucket das imagens que passam pela IA (plantas, fotos, referências, renders).
-- Leitura pública: a OpenAI busca a URL, e o render salvo em room_projects.render_url
-- precisa continuar abrindo depois. Escrita só do usuário autenticado, na própria pasta.
-- Rodar no SQL Editor do Supabase (o deploy da Vercel não aplica migration).

insert into storage.buckets (id, name, public, file_size_limit)
values ('ia-uploads', 'ia-uploads', true, 20971520)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit;

drop policy if exists "ia_uploads_select" on storage.objects;
create policy "ia_uploads_select" on storage.objects
  for select
  to public
  using (bucket_id = 'ia-uploads');

drop policy if exists "ia_uploads_insert" on storage.objects;
create policy "ia_uploads_insert" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'ia-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "ia_uploads_update" on storage.objects;
create policy "ia_uploads_update" on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'ia-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
