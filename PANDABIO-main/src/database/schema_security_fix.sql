--  SCHEMA - CORRECOES DE SEGURANCA E DADOS
--  Versao: 1.1
--  Data: 19/09/2026
--  Aplica as correcoes identificadas na analise do funcionamento do banco.
--
--  1) A politica "Public can view usernames" (FOR SELECT USING true) EXPOS
--     todos os dados de todos os perfis (email, page_data, plan, bio_url, etc.)
--     para qualquer pessoa, inclusive anonimos. Solucao: restringir a politica
--     publica apenas a usuarios publicados e expor via VIEW dedicada apenas
--     os campos necessarios.
--
--  2) O trigger handle_new_user grava bio_url com prefixo "panda.bio/"
--     enquanto o app exibe "pandabio.com/". Corrige o prefixo no trigger.
--
--  3) A coluna user_id sem UNIQUE: o codigo anterior usava upsert() com
--     user_id, o que criava perfis duplicados. O codigo foi corrigido para
--     update-then-insert, mas a constraint UNIQUE previne futuras duplicatas.

-- ============================================
-- 1) RLS: politica publica nao expoe dados sensiveis
-- ============================================

-- Remove a politica que libera SELECT de todos os campos de todos os usuarios.
DROP POLICY IF EXISTS "Public can view usernames" ON profiles;

-- Cria uma view publica enxuta: apenas perfis publicados com somente os
-- campos necessarios para renderizar a pagina publica.
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

-- A view NÃO expõe email, plan, user_id nem colunas internas.

-- Autorizacao: leitura publica apenas via view.
GRANT SELECT ON public_profile_pages TO anon, authenticated;

-- ============================================
-- 2) Trigger: prefixo consistente do bio_url
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

-- ============================================
-- 3) UNIQUE em user_id (impede perfis duplicados)
-- ============================================

-- Remove duplicatas existentes caso existam (mantem a mais antiga).
DELETE FROM profiles a
USING profiles b
WHERE a.user_id = b.user_id
  AND a.created_at > b.created_at;

-- Cria indice unico; se ja existir, nao falha.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_user_id_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_profiles_user_id_unique ON profiles(user_id);
  END IF;
END $$;

-- ============================================
-- 4) Indexacao JSONB mais eficiente
-- ============================================

-- O indice GIN sobre o documento inteiro e pesado. Como o acesso e por
-- perfil (chave primaria), um indice BTREE nao era necessario; porem, caso
-- haja busca por conteudo, um GIN com jsonb_path_ops e mais compacto.
DROP INDEX IF EXISTS idx_profiles_page_data;
CREATE INDEX IF NOT EXISTS idx_profiles_page_data_path ON profiles USING GIN (page_data jsonb_path_ops);