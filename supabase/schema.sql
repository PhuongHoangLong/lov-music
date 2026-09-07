-- Project mới: thay b2f7d0e8-bd6c-4e1b-834b-31d9b65547e8 bằng UUID quản trị trong Authentication > Users.
create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null default 'Chưa rõ nghệ sĩ',
  storage_path text not null unique,
  cover_url text,
  duration_seconds numeric check (duration_seconds >= 0),
  created_at timestamptz not null default now()
);
alter table public.tracks enable row level security;
create policy "Public reads tracks" on public.tracks for select to anon, authenticated using (true);
create policy "Admin manages tracks" on public.tracks for all to authenticated
using (auth.uid() = 'b2f7d0e8-bd6c-4e1b-834b-31d9b65547e8'::uuid)
with check (auth.uid() = 'b2f7d0e8-bd6c-4e1b-834b-31d9b65547e8'::uuid);
-- Tạo bucket public 'music' trong Storage trước khi upload.
create policy "Admin uploads music" on storage.objects for insert to authenticated
with check (bucket_id = 'music' and auth.uid() = 'b2f7d0e8-bd6c-4e1b-834b-31d9b65547e8'::uuid);
create policy "Admin reads music objects" on storage.objects for select to authenticated
using (bucket_id = 'music' and auth.uid() = 'b2f7d0e8-bd6c-4e1b-834b-31d9b65547e8'::uuid);
create policy "Admin updates music" on storage.objects for update to authenticated
using (bucket_id = 'music' and auth.uid() = 'b2f7d0e8-bd6c-4e1b-834b-31d9b65547e8'::uuid)
with check (bucket_id = 'music' and auth.uid() = 'b2f7d0e8-bd6c-4e1b-834b-31d9b65547e8'::uuid);
create policy "Admin deletes music" on storage.objects for delete to authenticated
using (bucket_id = 'music' and auth.uid() = 'b2f7d0e8-bd6c-4e1b-834b-31d9b65547e8'::uuid);
