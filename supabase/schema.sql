-- Anniversary Gallery — run once in Supabase SQL Editor
-- Dashboard → SQL → New query → paste → Run

-- Gallery metadata (single JSON document)
create table if not exists public.gallery (
  id text primary key default 'main',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.gallery enable row level security;

drop policy if exists "gallery public read" on public.gallery;
create policy "gallery public read"
  on public.gallery for select
  using (true);

drop policy if exists "gallery auth write" on public.gallery;
create policy "gallery auth write"
  on public.gallery for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Storage bucket: create "images" in Dashboard → Storage → New bucket
-- Set bucket to PUBLIC, then run the policies below.

drop policy if exists "images public read" on storage.objects;
create policy "images public read"
  on storage.objects for select
  using (bucket_id = 'images');

drop policy if exists "images auth upload" on storage.objects;
create policy "images auth upload"
  on storage.objects for insert
  with check (bucket_id = 'images' and auth.role() = 'authenticated');

drop policy if exists "images auth update" on storage.objects;
create policy "images auth update"
  on storage.objects for update
  using (bucket_id = 'images' and auth.role() = 'authenticated');

drop policy if exists "images auth delete" on storage.objects;
create policy "images auth delete"
  on storage.objects for delete
  using (bucket_id = 'images' and auth.role() = 'authenticated');
