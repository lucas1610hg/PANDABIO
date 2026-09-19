-- =========================================================
-- PANDA BIO
-- MÓDULO: MINHA PÁGINA
-- PostgreSQL / Supabase
-- Versão: 1.0 - Produção
-- =========================================================


-- =========================================================
-- 1. EXTENSÕES
-- =========================================================

create extension if not exists "pgcrypto";


-- =========================================================
-- 2. ENUMS
-- =========================================================

create type public.page_status as enum (
    'draft',
    'published',
    'archived'
);

create type public.block_type as enum (
    'link',
    'text',
    'image',
    'video',
    'social',
    'booking',
    'product',
    'music',
    'contact',
    'location',
    'divider',
    'custom'
);

create type public.block_visibility as enum (
    'visible',
    'hidden',
    'scheduled'
);


-- =========================================================
-- 3. PERFIL DO USUÁRIO
-- =========================================================

-- A tabela profiles já existe no schema principal
-- Apenas adicionamos as colunas necessárias
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS display_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Remover e recriar a constraint de username se necessário
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS username_format;

ALTER TABLE public.profiles
ADD CONSTRAINT username_format
CHECK (
    username IS NULL
    OR username ~ '^[a-zA-Z0-9._-]+$'
);


-- =========================================================
-- 4. PÁGINAS
-- =========================================================

create table if not exists public.bio_pages (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    username varchar(30) not null,

    title varchar(100),

    description text,

    status public.page_status not null default 'draft',

    is_public boolean not null default false,

    published_at timestamptz,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique(username)
);


-- =========================================================
-- 5. CONFIGURAÇÕES DA PÁGINA
-- =========================================================

create table if not exists public.page_settings (
    page_id uuid primary key
        references public.bio_pages(id)
        on delete cascade,

    show_avatar boolean not null default true,
    show_name boolean not null default true,
    show_bio boolean not null default true,

    show_username boolean not null default true,

    show_branding boolean not null default true,

    enable_animations boolean not null default true,

    enable_share_button boolean not null default true,

    enable_qr_code boolean not null default true,

    seo_title varchar(70),
    seo_description varchar(160),

    og_image_url text,

    custom_css text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- =========================================================
-- 6. TEMA / APARÊNCIA
-- =========================================================

create table if not exists public.page_themes (
    page_id uuid primary key
        references public.bio_pages(id)
        on delete cascade,

    theme_id varchar(100) default 'default',

    background_type varchar(30)
        not null default 'color',

    background_color varchar(20)
        default '#ffffff',

    background_gradient jsonb,

    background_image_url text,

    background_video_url text,

    text_color varchar(20)
        default '#111111',

    secondary_text_color varchar(20)
        default '#666666',

    button_background varchar(20)
        default '#111111',

    button_text_color varchar(20)
        default '#ffffff',

    button_border_color varchar(20),

    button_radius integer
        not null default 16,

    button_style varchar(30)
        not null default 'filled',

    font_family varchar(100)
        default 'Inter',

    font_weight integer
        default 500,

    page_width integer
        not null default 680,

    custom_theme jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- =========================================================
-- 7. BLOCOS DA PÁGINA
-- =========================================================

create table if not exists public.page_blocks (
    id uuid primary key default gen_random_uuid(),

    page_id uuid not null
        references public.bio_pages(id)
        on delete cascade,

    type public.block_type not null,

    title varchar(200),

    description text,

    position integer not null default 0,

    visibility public.block_visibility
        not null default 'visible',

    is_active boolean not null default true,

    starts_at timestamptz,
    ends_at timestamptz,

    data jsonb not null default '{}'::jsonb,

    style jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint valid_schedule
        check (
            starts_at is null
            or ends_at is null
            or starts_at < ends_at
        )
);


-- =========================================================
-- 8. LINKS SOCIAIS
-- =========================================================

create table if not exists public.social_links (
    id uuid primary key default gen_random_uuid(),

    page_id uuid not null
        references public.bio_pages(id)
        on delete cascade,

    platform varchar(50) not null,

    username varchar(150),

    url text not null,

    icon varchar(100),

    position integer not null default 0,

    is_active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- =========================================================
-- 9. ÍNDICES
-- =========================================================

create index if not exists idx_profiles_username
    on public.profiles(username);

create index if not exists idx_bio_pages_user_id
    on public.bio_pages(user_id);

create index if not exists idx_bio_pages_username
    on public.bio_pages(username);

create index if not exists idx_page_blocks_page_id
    on public.page_blocks(page_id);

create index if not exists idx_page_blocks_position
    on public.page_blocks(page_id, position);

create index if not exists idx_page_blocks_type
    on public.page_blocks(type);

create index if not exists idx_social_links_page_id
    on public.social_links(page_id);

create index if not exists idx_social_links_position
    on public.social_links(page_id, position);


-- =========================================================
-- 10. FUNÇÃO DE UPDATED_AT
-- =========================================================

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


-- =========================================================
-- 11. TRIGGERS UPDATED_AT
-- =========================================================

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at();

drop trigger if exists bio_pages_updated_at on public.bio_pages;
create trigger bio_pages_updated_at
before update on public.bio_pages
for each row
execute function public.update_updated_at();

drop trigger if exists page_settings_updated_at on public.page_settings;
create trigger page_settings_updated_at
before update on public.page_settings
for each row
execute function public.update_updated_at();

drop trigger if exists page_themes_updated_at on public.page_themes;
create trigger page_themes_updated_at
before update on public.page_themes
for each row
execute function public.update_updated_at();

drop trigger if exists page_blocks_updated_at on public.page_blocks;
create trigger page_blocks_updated_at
before update on public.page_blocks
for each row
execute function public.update_updated_at();

drop trigger if exists social_links_updated_at on public.social_links;
create trigger social_links_updated_at
before update on public.social_links
for each row
execute function public.update_updated_at();


-- =========================================================
-- 12. ATUALIZAR TRIGGER DE PERFIL (JÁ EXISTE NO SCHEMA PRINCIPAL)
-- =========================================================

-- O trigger handle_new_user já existe no schema principal
-- Não precisamos recriá-lo aqui


-- =========================================================
-- 13. ROW LEVEL SECURITY
-- =========================================================

alter table public.profiles enable row level security;
alter table public.bio_pages enable row level security;
alter table public.page_settings enable row level security;
alter table public.page_themes enable row level security;
alter table public.page_blocks enable row level security;
alter table public.social_links enable row level security;


-- =========================================================
-- 14. POLICIES - PROFILES
-- =========================================================

-- As policies para profiles já existem no schema principal
-- Não precisamos recriá-las aqui


-- =========================================================
-- 15. POLICIES - PÁGINAS
-- =========================================================

drop policy if exists "Users can view their own pages" on public.bio_pages;
create policy "Users can view their own pages"
on public.bio_pages
for select
using (auth.uid() = user_id);

drop policy if exists "Users can create their own pages" on public.bio_pages;
create policy "Users can create their own pages"
on public.bio_pages
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own pages" on public.bio_pages;
create policy "Users can update their own pages"
on public.bio_pages
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own pages" on public.bio_pages;
create policy "Users can delete their own pages"
on public.bio_pages
for delete
using (auth.uid() = user_id);


-- =========================================================
-- 16. POLICIES - CONFIGURAÇÕES
-- =========================================================

drop policy if exists "Users can manage page settings" on public.page_settings;
create policy "Users can manage page settings"
on public.page_settings
for all
using (
    exists (
        select 1
        from public.bio_pages
        where bio_pages.id = page_settings.page_id
        and bio_pages.user_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.bio_pages
        where bio_pages.id = page_settings.page_id
        and bio_pages.user_id = auth.uid()
    )
);


-- =========================================================
-- 17. POLICIES - TEMAS
-- =========================================================

drop policy if exists "Users can manage page themes" on public.page_themes;
create policy "Users can manage page themes"
on public.page_themes
for all
using (
    exists (
        select 1
        from public.bio_pages
        where bio_pages.id = page_themes.page_id
        and bio_pages.user_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.bio_pages
        where bio_pages.id = page_themes.page_id
        and bio_pages.user_id = auth.uid()
    )
);


-- =========================================================
-- 18. POLICIES - BLOCOS
-- =========================================================

drop policy if exists "Users can manage page blocks" on public.page_blocks;
create policy "Users can manage page blocks"
on public.page_blocks
for all
using (
    exists (
        select 1
        from public.bio_pages
        where bio_pages.id = page_blocks.page_id
        and bio_pages.user_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.bio_pages
        where bio_pages.id = page_blocks.page_id
        and bio_pages.user_id = auth.uid()
    )
);


-- =========================================================
-- 19. POLICIES - REDES SOCIAIS
-- =========================================================

drop policy if exists "Users can manage social links" on public.social_links;
create policy "Users can manage social links"
on public.social_links
for all
using (
    exists (
        select 1
        from public.bio_pages
        where bio_pages.id = social_links.page_id
        and bio_pages.user_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.bio_pages
        where bio_pages.id = social_links.page_id
        and bio_pages.user_id = auth.uid()
    )
);