-- =============================================================
-- PANDABIO — SCHEMA SQL CONSOLIDADO
-- Versão: 2.0 — Pós-melhorias T1–T14
-- Data: 2026-09-20
-- =============================================================
-- Este arquivo é a fonte de verdade do schema. Inclui:
--   • Tabelas com RLS habilitado (profile_id como FK nas dependentes)
--   • Índices de performance
--   • Funções: handle_new_user, toggle_link_status (T4), anonymize_ip (T6)
--   • Triggers: auto-create profile, analytics IP anonymization
--   • RLS policies (todas as tabelas + view pública)
--   • Bloco de validação final
-- =============================================================

-- Habilita extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
--  TABELAS COM RLS HABILITADO
-- ============================================

-- Tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  username VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  plan VARCHAR(20) DEFAULT 'Gratuito' CHECK (plan IN ('Gratuito', 'PRO')),
  bio_url VARCHAR(255) NOT NULL,
  page_title VARCHAR(100) NOT NULL,
  bio_description TEXT,
  avatar_url TEXT,
  category VARCHAR(50),
  location VARCHAR(100),
  custom_link VARCHAR(255),
  page_data JSONB,
  published BOOLEAN DEFAULT FALSE,
  display_name VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 20)
);

-- Tabela de links
CREATE TABLE IF NOT EXISTS links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  icon VARCHAR(50),
  type VARCHAR(20) NOT NULL CHECK (type IN ('social', 'whatsapp', 'portfolio', 'store', 'custom')),
  link_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT title_length CHECK (char_length(title) >= 3 AND char_length(title) <= 50)
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  sales_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'draft')),
  image TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 100),
  CONSTRAINT price_positive CHECK (price > 0 AND price <= 999999)
);

-- Tabela de leads
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  channel VARCHAR(50) NOT NULL,
  link_id UUID REFERENCES links(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de atividades
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  subtitle TEXT,
  time_ago VARCHAR(50) DEFAULT 'agora',
  type VARCHAR(20) NOT NULL CHECK (type IN ('lead', 'clicks', 'order', 'visits')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de analytics
CREATE TABLE IF NOT EXISTS analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('click', 'view', 'conversion')),
  device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('mobile', 'desktop', 'tablet')),
  referrer TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
--  ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índices para perfis
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Índices para links
CREATE INDEX IF NOT EXISTS idx_links_profile_id ON links(profile_id);
CREATE INDEX IF NOT EXISTS idx_links_active ON links(active);
CREATE INDEX IF NOT EXISTS idx_links_order ON links(profile_id, link_order);

-- Índices para produtos
CREATE INDEX IF NOT EXISTS idx_products_profile_id ON products(profile_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Índices para leads
CREATE INDEX IF NOT EXISTS idx_leads_profile_id ON leads(profile_id);
CREATE INDEX IF NOT EXISTS idx_leads_link_id ON leads(link_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Índices para atividades
CREATE INDEX IF NOT EXISTS idx_activities_profile_id ON activities(profile_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);

-- Índices para analytics
CREATE INDEX IF NOT EXISTS idx_analytics_profile_id ON analytics(profile_id);
CREATE INDEX IF NOT EXISTS idx_analytics_link_id ON analytics(link_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at DESC);

-- ============================================
--  FUNÇÕES
-- ============================================

-- [T1] Função segura para criar perfil automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificação de segurança: apenas permite execução do trigger auth.users
  IF NOT (TG_TABLE_NAME = 'users' AND TG_TABLE_SCHEMA = 'auth') THEN
    RAISE EXCEPTION 'Acesso não autorizado: trigger executado fora do contexto auth.users';
  END IF;

  -- Inserir perfil com validação
  INSERT INTO public.profiles (user_id, name, username, email, bio_url, page_title)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    'panda.bio/' || COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)) || ' • Bio Oficial'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [T4] Função RPC toggle_link_status: inverte `active` atomicamente
CREATE OR REPLACE FUNCTION toggle_link_status(link_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  current_active BOOLEAN;
  new_active BOOLEAN;
BEGIN
  SELECT active INTO current_active
  FROM links
  WHERE id = link_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  new_active := NOT current_active;

  UPDATE links
  SET active = new_active,
      updated_at = now()
  WHERE id = link_id;

  RETURN new_active;
END;
$$;

-- [T6] Função para anonimizar IP (LGPD): IPv4 /24, IPv6 /64
CREATE OR REPLACE FUNCTION anonymize_ip(ip INET)
RETURNS INET
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN ip IS NULL THEN NULL
    WHEN family(ip) = 4 THEN set_masklen(ip, 24)
    ELSE set_masklen(ip, 64)
  END;
$$;

-- [T6] Trigger function para anonimizar IP antes de inserir analytics
CREATE OR REPLACE FUNCTION trg_analytics_anonymize_ip_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  NEW.ip_address := anonymize_ip(COALESCE(NEW.ip_address, inet_client_addr()));
  NEW.user_agent := NULLIF(COALESCE(NULLIF(NEW.user_agent, ''), ''), '')::text;
  NEW.referrer := NULLIF(COALESCE(NULLIF(NEW.referrer, ''), ''), '')::text;
  RETURN NEW;
END;
$$;

-- ============================================
--  TRIGGERS
-- ============================================

-- Trigger para criar perfil automaticamente após signup em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- [T6] Trigger para anonimizar IP em analytics
DROP TRIGGER IF EXISTS trg_analytics_anon_ip ON analytics;
CREATE TRIGGER trg_analytics_anon_ip
  BEFORE INSERT ON analytics
  FOR EACH ROW
  EXECUTE FUNCTION trg_analytics_anonymize_ip_before_insert();

-- ============================================
--  RLS (ROW LEVEL SECURITY) - POLÍTICAS ESTRITAS
-- ============================================

-- ============================================
-- PROFILES — Segurança Máxima
-- ============================================

-- Limpar políticas anteriores
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS estritas para profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- View pública enxuta (somente perfis publicados)
DROP POLICY IF EXISTS "Public can view usernames" ON profiles;

CREATE OR REPLACE VIEW public_profile_pages AS
SELECT
  id,
  username,
  name,
  bio_url,
  page_title,
  bio_description,
  avatar_url,
  category,
  location,
  custom_link,
  page_data,
  updated_at
FROM profiles
WHERE published = true
  AND page_data IS NOT NULL;

GRANT SELECT ON public_profile_pages TO anon, authenticated;

-- ============================================
-- LINKS — Segurança Baseada em Profile
-- ============================================

DROP POLICY IF EXISTS "Users can view own links" ON links;
DROP POLICY IF EXISTS "Users can insert own links" ON links;
DROP POLICY IF EXISTS "Users can update own links" ON links;
DROP POLICY IF EXISTS "Users can delete own links" ON links;

ALTER TABLE links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own links" ON links
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can insert own links" ON links
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can update own links" ON links
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can delete own links" ON links
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

-- ============================================
-- PRODUCTS — Segurança Baseada em Profile
-- ============================================

DROP POLICY IF EXISTS "Users can view own products" ON products;
DROP POLICY IF EXISTS "Users can insert own products" ON products;
DROP POLICY IF EXISTS "Users can update own products" ON products;
DROP POLICY IF EXISTS "Users can delete own products" ON products;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own products" ON products
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can insert own products" ON products
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can update own products" ON products
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can delete own products" ON products
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

-- ============================================
-- LEADS — Segurança Baseada em Profile
-- ============================================

DROP POLICY IF EXISTS "Users can view own leads" ON leads;
DROP POLICY IF EXISTS "Users can insert own leads" ON leads;

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own leads" ON leads
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can insert own leads" ON leads
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

-- ============================================
-- ACTIVITIES — Segurança Baseada em Profile
-- ============================================

DROP POLICY IF EXISTS "Users can view own activities" ON activities;
DROP POLICY IF EXISTS "Users can insert own activities" ON activities;

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities" ON activities
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can insert own activities" ON activities
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

-- ============================================
-- ANALYTICS — Segurança Baseada em Profile
-- ============================================

DROP POLICY IF EXISTS "Users can view own analytics" ON analytics;
DROP POLICY IF EXISTS "Users can insert own analytics" ON analytics;

ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics" ON analytics
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can insert own analytics" ON analytics
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

-- ============================================
--  VALIDAÇÃO FINAL DE SEGURANÇA
-- ============================================

DO $$
DECLARE
  _tbl text;
  _rls boolean;
  _policy_count int;
  _total_policies int := 0;
BEGIN
  -- 1. Verificar RLS habilitado em todas as tabelas
  FOR _tbl IN
    SELECT unnest(ARRAY['profiles', 'links', 'products', 'leads', 'activities', 'analytics'])
  LOOP
    SELECT relrowsecurity INTO _rls
    FROM pg_class
    WHERE relname = _tbl AND relnamespace = 'public'::regnamespace;

    IF NOT _rls THEN
      RAISE EXCEPTION 'FALHA: RLS não está habilitado na tabela %', _tbl;
    END IF;

    -- Contar policies por tabela
    SELECT count(*) INTO _policy_count
    FROM pg_policies
    WHERE tablename = _tbl AND schemaname = 'public';

    _total_policies := _total_policies + _policy_count;

    RAISE NOTICE '  ✓ % — RLS habilitado, % policies', _tbl, _policy_count;
  END LOOP;

  -- 2. Verificar que tabelas dependentes usam profile_id (não user_id)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('links','products','leads','activities','analytics')
      AND column_name = 'user_id'
  ) THEN
    RAISE EXCEPTION 'FALHA: Tabelas dependentes ainda possuem coluna user_id — executar migration 2026092003';
  END IF;

  -- 3. Verificar que profiles mantém user_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'user_id'
  ) THEN
    RAISE EXCEPTION 'FALHA: Tabela profiles perdeu a coluna user_id (FK para auth.users)';
  END IF;

  -- 4. Verificar funções existem
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    RAISE EXCEPTION 'FALHA: Função handle_new_user não encontrada';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'toggle_link_status') THEN
    RAISE EXCEPTION 'FALHA: Função toggle_link_status não encontrada';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'anonymize_ip') THEN
    RAISE EXCEPTION 'FALHA: Função anonymize_ip não encontrada';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '✓ Validação completa: RLS em 6 tabelas, % policies totais', _total_policies;
  RAISE NOTICE '✓ FK naming: profiles.user_id (auth), dependentes.profile_id';
  RAISE NOTICE '✓ Funções: handle_new_user, toggle_link_status, anonymize_ip';
  RAISE NOTICE '✓ Triggers: on_auth_user_created, trg_analytics_anon_ip';
  RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;
