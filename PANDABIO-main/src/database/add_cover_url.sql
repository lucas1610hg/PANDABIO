-- =========================================================
-- PANDA BIO
-- MIGRAÇÃO: COLUNA cover_url NO PERFIL
-- Versão: 1.1
-- =========================================================
-- IMPORTANTE: feche/deslogue o app antes de rodar. O autosave faz
-- UPDATE em profiles a cada ~2s e segura o lock da tabela, o que
-- faz o ALTER/backfill estourar o statement_timeout.
-- =========================================================

set statement_timeout = '10min';

-- 1. Coluna
alter table public.profiles
add column if not exists cover_url text;

-- 2. Backfill em lotes (evita timeout em tabelas grandes)
do $$
declare
  affected int;
  batch int := 500;
begin
  loop
    update public.profiles p
    set cover_url = p.page_data->'profile'->>'coverUrl'
    where p.id in (
        select id
        from public.profiles
        where cover_url is null
          and page_data->'profile'->>'coverUrl' is not null
        limit batch
    );
    get diagnostics affected = row_count;
    exit when affected = 0;
  end loop;
end $$;

reset statement_timeout;

-- Expõe a capa na view pública de perfis publicados
-- DROP antes de CREATE: CREATE OR REPLACE VIEW não permite realinhar/renomear colunas.
drop view if exists public.public_profile_pages;

create view public.public_profile_pages as
select
  id,
  username,
  name,
  bio_url,
  page_title,
  bio_description,
  avatar_url,
  cover_url,
  category,
  location,
  custom_link,
  page_data,
  updated_at
from profiles
where published = true
  and page_data is not null;

grant select on public.public_profile_pages to anon, authenticated;
revoke all on public.public_profile_pages from public;

-- =========================================================
-- VALIDAÇÃO
-- =========================================================

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'profiles' and column_name = 'cover_url'
  ) then
    raise exception 'Coluna cover_url não foi criada';
  end if;
  raise notice 'Coluna cover_url configurada com sucesso';
end $$;