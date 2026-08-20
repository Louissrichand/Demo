-- ============================================================
-- root+ — Supabase Storage setup for profile avatars
-- Run in Supabase → SQL Editor → New query → Run (Database engine).
-- Safe to run more than once.
-- ============================================================

-- 1) Public "avatars" bucket (anyone can READ; writes are restricted below)
--    file_size_limit = 1 MB (1048576 bytes); only image types allowed.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 1048576,
      allowed_mime_types = array['image/jpeg','image/png','image/webp'];

-- 2) Each user may upload / change / delete files ONLY inside a folder
--    named after their own user id:  avatars/<uid>/<file>
drop policy if exists "avatars upload own" on storage.objects;
create policy "avatars upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars update own" on storage.objects;
create policy "avatars update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars delete own" on storage.objects;
create policy "avatars delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- (Public read needs no policy — a public bucket is served via its public URL.)
