--  MIGRAÇÃO CONSOLIDADA - PANDA BIO
--  Versão: 1.2
--  Data: 19/09/2026
--  O que faz:
--   1) Remove política pública que expõe email/plan/page_data de todos os perfis
--   2) Cria view enxuta pública public_profile_pages (só perfis publicados)
--   3) Corrige prefixo do bio_url no trigger handle_new_user (pandabio.com/)
--   4) Garante UNIQUE em profiles(user_id) para evitar perfis duplicados
--   5) Índice GIN compacto para page_data
--  É idempotente: pode rodar quantas vezes for necessário.

-- ============================================
-- 0) PRÉ-CONDIÇÕES: extensão pgcrypto
-- ============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 1) RLS: política pública não expõe dados sensíveis
-- ============================================
DROP POLICY IF EXISTS "Public can view usernames" ON profiles;
DROP POLICY IF EXISTS "Profiles are publicly viewable" ON profiles;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Garante políticas básicas do dono (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- 2) View pública enxuta
-- ============================================
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
REVOKE ALL ON public_profile_pages FROM PUBLIC;

-- ============================================
-- 3) Trigger: prefixo consistente do bio_url
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT (TG_TABLE_NAME = 'users' AND TG_TABLE_SCHEMA = 'auth') THEN
    RAISE EXCEPTION 'Acesso nao autorizado: trigger executado fora do contexto auth.users';
  END IF;

  INSERT INTO public.profiles (user_id, name, username, email, bio_url, page_title)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    'pandabio.com/' || COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)) || ' • Bio Oficial'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 4) UNIQUE em user_id (impede perfis duplicados)
-- ============================================
DELETE FROM profiles a
USING profiles b
WHERE a.user_id = b.user_id
  AND a.id <> b.id
  AND a.created_at > b.created_at;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_user_id_unique') THEN
    CREATE UNIQUE INDEX idx_profiles_user_id_unique ON profiles(user_id);
  END IF;
END $$;

-- ============================================
-- 5) Indexação JSONB compacta
-- ============================================
DROP INDEX IF EXISTS idx_profiles_page_data;
CREATE INDEX IF NOT EXISTS idx_profiles_page_data_path ON profiles USING GIN (page_data jsonb_path_ops);

-- ============================================
-- VALIDAÇÃO
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='page_data') THEN
    RAISE EXCEPTION 'page_data ausente';
  END IF;
  RAISE NOTICE 'Migração 1.2 aplicada com sucesso';
END $$;