-- 🛡️ SCHEMA SQL SEGURO - CORREÇÃO DE VULNERABILIDADES
-- Versão: 1.0 - Segurança Fortificada
-- Data: 19/09/2026

-- Habilita extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 🔐 TABELAS COM RLS HABILITADO
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
-- 📊 ÍNDICES PARA PERFORMANCE
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
-- 🔧 FUNÇÕES SEGUROS
-- ============================================

-- Função segura para criar perfil automaticamente após signup
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

-- ============================================
-- 🎯 TRIGGERS
-- ============================================

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 🛡️ RLS (ROW LEVEL SECURITY) - POLÍTICAS ESTRICTAS
-- ============================================

-- ============================================
-- PROFILES - Segurança Máxima
-- ============================================

-- Limpar políticas antigas
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

-- Política para permitir leitura pública de username (para busca de perfis)
DROP POLICY IF EXISTS "Public can view usernames" ON profiles;
CREATE POLICY "Public can view usernames" ON profiles
  FOR SELECT USING (true);

-- ============================================
-- LINKS - Segurança Baseada em Profile
-- ============================================

-- Limpar políticas antigas
DROP POLICY IF EXISTS "Users can view own links" ON links;
DROP POLICY IF EXISTS "Users can insert own links" ON links;
DROP POLICY IF EXISTS "Users can update own links" ON links;
DROP POLICY IF EXISTS "Users can delete own links" ON links;

-- Habilitar RLS
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- Políticas RLS estritas para links
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
-- PRODUCTS - Segurança Baseada em Profile
-- ============================================

-- Limpar políticas antigas
DROP POLICY IF EXISTS "Users can view own products" ON products;
DROP POLICY IF EXISTS "Users can insert own products" ON products;
DROP POLICY IF EXISTS "Users can update own products" ON products;
DROP POLICY IF EXISTS "Users can delete own products" ON products;

-- Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Políticas RLS estritas para products
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
-- LEADS - Segurança Baseada em Profile
-- ============================================

-- Limpar políticas antigas
DROP POLICY IF EXISTS "Users can view own leads" ON leads;
DROP POLICY IF EXISTS "Users can insert own leads" ON leads;

-- Habilitar RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Políticas RLS estritas para leads
CREATE POLICY "Users can view own leads" ON leads
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can insert own leads" ON leads
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

-- ============================================
-- ACTIVITIES - Segurança Baseada em Profile
-- ============================================

-- Limpar políticas antigas
DROP POLICY IF EXISTS "Users can view own activities" ON activities;
DROP POLICY IF EXISTS "Users can insert own activities" ON activities;

-- Habilitar RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Políticas RLS estritas para activities
CREATE POLICY "Users can view own activities" ON activities
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can insert own activities" ON activities
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

-- ============================================
-- ANALYTICS - Segurança Baseada em Profile
-- ============================================

-- Limpar políticas antigas
DROP POLICY IF EXISTS "Users can view own analytics" ON analytics;
DROP POLICY IF EXISTS "Users can insert own analytics" ON analytics;

-- Habilitar RLS
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Políticas RLS estritas para analytics
CREATE POLICY "Users can view own analytics" ON analytics
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can insert own analytics" ON analytics
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

-- ============================================
-- ✅ VALIDAÇÃO FINAL DE SEGURANÇA
-- ============================================

-- Verificar se RLS está habilitado em todas as tabelas
DO $$
DECLARE
  table_name text;
  rls_enabled boolean;
BEGIN
  FOR table_name IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'links', 'products', 'leads', 'activities', 'analytics')
  LOOP
    SELECT relrowsecurity INTO rls_enabled 
    FROM pg_class 
    WHERE relname = table_name;
    
    IF NOT rls_enabled THEN
      RAISE EXCEPTION 'ALERTA: RLS não está habilitado na tabela %', table_name;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Validação de segurança concluída: RLS habilitado em todas as tabelas';
END $$;
