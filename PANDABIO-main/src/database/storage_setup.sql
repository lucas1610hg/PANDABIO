-- =========================================================
-- PANDA BIO
-- MÓDULO: STORAGE DE IMAGENS DO USUÁRIO
-- PostgreSQL / Supabase Storage
-- Versão: 1.0
-- =========================================================
-- Cria o bucket público "user-assets" e as políticas de RLS
-- que permitem cada usuário autenticado escrever apenas dentro
-- da própria pasta: user-assets/<auth.uid()>/<pasta>/arquivo
-- =========================================================


-- =========================================================
-- 1. BUCKET
-- =========================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'user-assets',
    'user-assets',
    true,
    5242880, -- 5 MB
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;


-- =========================================================
-- 2. RLS
-- =========================================================

alter table storage.objects enable row level security;


-- =========================================================
-- 3. POLICIES
-- =========================================================
-- Leitura pública: as imagens aparecem na bio pública.
-- Escrita (insert/update/delete): apenas o dono da pasta.

drop policy if exists "user_assets_public_read" on storage.objects;
create policy "user_assets_public_read"
on storage.objects
for select
using (bucket_id = 'user-assets');

drop policy if exists "user_assets_insert_own" on storage.objects;
create policy "user_assets_insert_own"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'user-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "user_assets_update_own" on storage.objects;
create policy "user_assets_update_own"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'user-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
    bucket_id = 'user-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "user_assets_delete_own" on storage.objects;
create policy "user_assets_delete_own"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'user-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
);


-- =========================================================
-- 4. VALIDAÇÃO
-- =========================================================

do $$
begin
    if not exists (select 1 from storage.buckets where id = 'user-assets') then
        raise exception 'Bucket user-assets não foi criado';
    end if;

    raise notice 'Storage de imagens configurado com sucesso';
end $$;
