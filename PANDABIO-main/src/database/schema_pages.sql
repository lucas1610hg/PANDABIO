--  SCHEMA SQL - PÁGINA DO USUÁRIO (Minha Página)
-- Versão: 1.0
-- Data: 19/09/2026
-- Descrição: Estrutura para armazenar dados da página personalizada do usuário

-- ============================================
-- ATUALIZAÇÃO DA TABELA PROFILES
-- ============================================

-- Adicionar colunas para armazenar dados da página personalizada
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS location VARCHAR(100),
ADD COLUMN IF NOT EXISTS custom_link VARCHAR(255),
ADD COLUMN IF NOT EXISTS page_data JSONB,
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT FALSE;

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índice para busca por custom_link
CREATE INDEX IF NOT EXISTS idx_profiles_custom_link ON profiles(custom_link) WHERE custom_link IS NOT NULL;

-- Índice para páginas publicadas
CREATE INDEX IF NOT EXISTS idx_profiles_published ON profiles(published) WHERE published = true;

-- Índice para JSONB searches (GIN index para page_data)
CREATE INDEX IF NOT EXISTS idx_profiles_page_data ON profiles USING GIN (page_data);

-- ============================================
-- TABELA DE BLOCOS DA PÁGINA (Opcional - se preferir normalização)
-- ============================================

-- Se preferir uma estrutura normalizada em vez de JSONB,
-- descomente as linhas abaixo para criar uma tabela separada de blocos

/*
CREATE TABLE IF NOT EXISTS page_blocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN (
    'link', 'text', 'image', 'video', 'agendamento', 
    'produto', 'social', 'contact', 'music', 'location'
  )),
  title VARCHAR(200),
  content TEXT,
  url TEXT,
  image_url TEXT,
  video_url TEXT,
  icon VARCHAR(50),
  active BOOLEAN DEFAULT TRUE,
  block_order INTEGER DEFAULT 0,
  -- Campos específicos para agendamento
  appointment_title VARCHAR(200),
  appointment_description TEXT,
  service VARCHAR(100),
  show_price BOOLEAN DEFAULT FALSE,
  show_duration BOOLEAN DEFAULT FALSE,
  -- Campos específicos para produto
  product_name VARCHAR(200),
  product_price DECIMAL(10, 2),
  -- Catálogo de produtos (JSONB): [{ id, name, price, image_url, link }]
  products JSONB DEFAULT '[]'::jsonb,
  -- Campos específicos para social
  platform VARCHAR(50),
  -- Campos específicos para localização
  address TEXT,
  map_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT block_order_positive CHECK (block_order >= 0)
);

-- Índices para page_blocks
CREATE INDEX IF NOT EXISTS idx_page_blocks_profile_id ON page_blocks(profile_id);
CREATE INDEX IF NOT EXISTS idx_page_blocks_type ON page_blocks(type);
CREATE INDEX IF NOT EXISTS idx_page_blocks_order ON page_blocks(profile_id, block_order);
CREATE INDEX IF NOT EXISTS idx_page_blocks_active ON page_blocks(active);

-- RLS para page_blocks
ALTER TABLE page_blocks ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para page_blocks
DROP POLICY IF EXISTS "Users can view own blocks" ON page_blocks;
DROP POLICY IF EXISTS "Users can insert own blocks" ON page_blocks;
DROP POLICY IF EXISTS "Users can update own blocks" ON page_blocks;
DROP POLICY IF EXISTS "Users can delete own blocks" ON page_blocks;

CREATE POLICY "Users can view own blocks" ON page_blocks
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can insert own blocks" ON page_blocks
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can update own blocks" ON page_blocks
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );

CREATE POLICY "Users can delete own blocks" ON page_blocks
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
  );
*/

-- ============================================
-- FUNÇÃO PARA VALIDAR page_data JSONB
-- ============================================

CREATE OR REPLACE FUNCTION public.validate_page_data(page_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar se page_data tem a estrutura básica esperada
  IF NOT (page_data ? 'blocks' AND page_data ? 'theme' AND page_data ? 'published') THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se blocks é um array
  IF jsonb_typeof(page_data->'blocks') != 'array' THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se theme é um objeto
  IF jsonb_typeof(page_data->'theme') != 'object' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- TRIGGER PARA VALIDAR page_data
-- ============================================

CREATE OR REPLACE FUNCTION public.check_page_data()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.page_data IS NOT NULL THEN
    IF NOT public.validate_page_data(NEW.page_data) THEN
      RAISE EXCEPTION 'page_data inválido: estrutura JSON incorreta';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS validate_page_data_trigger ON profiles;
CREATE TRIGGER validate_page_data_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  WHEN (NEW.page_data IS NOT NULL)
  EXECUTE FUNCTION public.check_page_data();

-- ============================================
-- FUNÇÃO PARA CRIAR ESTRUTURA PADRÃO DE page_data
-- ============================================

CREATE OR REPLACE FUNCTION public.create_default_page_data()
RETURNS JSONB AS $$
DECLARE
  default_data JSONB;
BEGIN
  default_data := '{
    "blocks": [],
    "theme": {
      "theme": "light",
      "backgroundColor": "#ffffff",
      "backgroundType": "color",
      "buttonStyle": "rounded",
      "fontFamily": "Inter",
      "animationsEnabled": true
    },
    "published": false,
    "lastUpdated": "' || to_jsonb(now()) || '"
  }'::jsonb;
  
  RETURN default_data;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- FUNÇÃO HELPER PARA ADICIONAR BLOCO AO page_data
-- ============================================

CREATE OR REPLACE FUNCTION public.add_block_to_page(
  profile_id_param UUID,
  block_type VARCHAR,
  block_data JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  current_data JSONB;
  new_block JSONB;
  new_blocks JSONB;
  block_count INTEGER;
BEGIN
  -- Obter page_data atual
  SELECT COALESCE(page_data, public.create_default_page_data())
  INTO current_data
  FROM profiles
  WHERE id = profile_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil não encontrado';
  END IF;
  
  -- Contar blocos atuais
  block_count := jsonb_array_length(current_data->'blocks');
  
  -- Criar novo bloco
  new_block := jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', block_type,
    'order', block_count,
    'active', true
  ) || block_data;
  
  -- Adicionar bloco ao array
  new_blocks := current_data->'blocks' || to_jsonb(new_block);
  
  -- Atualizar page_data
  current_data := current_data || jsonb_build_object(
    'blocks', new_blocks,
    'lastUpdated', to_jsonb(now())
  );
  
  -- Atualizar tabela
  UPDATE profiles
  SET page_data = current_data,
      updated_at = NOW()
  WHERE id = profile_id_param;
  
  RETURN current_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNÇÃO HELPER PARA REMOVER BLOCO DO page_data
-- ============================================

CREATE OR REPLACE FUNCTION public.remove_block_from_page(
  profile_id_param UUID,
  block_id_param TEXT
)
RETURNS JSONB AS $$
DECLARE
  current_data JSONB;
  new_blocks JSONB;
BEGIN
  -- Obter page_data atual
  SELECT page_data
  INTO current_data
  FROM profiles
  WHERE id = profile_id_param;
  
  IF NOT FOUND OR current_data IS NULL THEN
    RAISE EXCEPTION 'Perfil ou page_data não encontrado';
  END IF;
  
  -- Remover bloco do array
  new_blocks := (
    SELECT jsonb_agg(elem)
    FROM jsonb_array_elements(current_data->'blocks') elem
    WHERE elem->>'id' != block_id_param
  );
  
  -- Reordenar blocos
  new_blocks := (
    SELECT jsonb_agg(jsonb_set(elem, '{order}', to_jsonb(row_number - 1)))
    FROM jsonb_array_elements(new_blocks) WITH ORDINALITY AS t(elem, row_number)
  );
  
  -- Atualizar page_data
  current_data := current_data || jsonb_build_object(
    'blocks', COALESCE(new_blocks, '[]'::jsonb),
    'lastUpdated', to_jsonb(now())
  );
  
  -- Atualizar tabela
  UPDATE profiles
  SET page_data = current_data,
      updated_at = NOW()
  WHERE id = profile_id_param;
  
  RETURN current_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNÇÃO HELPER PARA ATUALIZAR BLOCO NO page_data
-- ============================================

CREATE OR REPLACE FUNCTION public.update_block_in_page(
  profile_id_param UUID,
  block_id_param TEXT,
  block_updates JSONB
)
RETURNS JSONB AS $$
DECLARE
  current_data JSONB;
  new_blocks JSONB;
BEGIN
  -- Obter page_data atual
  SELECT page_data
  INTO current_data
  FROM profiles
  WHERE id = profile_id_param;
  
  IF NOT FOUND OR current_data IS NULL THEN
    RAISE EXCEPTION 'Perfil ou page_data não encontrado';
  END IF;
  
  -- Atualizar bloco específico
  new_blocks := (
    SELECT jsonb_agg(
      CASE
        WHEN elem->>'id' = block_id_param THEN elem || block_updates
        ELSE elem
      END
    )
    FROM jsonb_array_elements(current_data->'blocks') elem
  );
  
  -- Atualizar page_data
  current_data := current_data || jsonb_build_object(
    'blocks', new_blocks,
    'lastUpdated', to_jsonb(now())
  );
  
  -- Atualizar tabela
  UPDATE profiles
  SET page_data = current_data,
      updated_at = NOW()
  WHERE id = profile_id_param;
  
  RETURN current_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNÇÃO HELPER PARA REORDENAR BLOCOS
-- ============================================

CREATE OR REPLACE FUNCTION public.reorder_blocks(
  profile_id_param UUID,
  block_id_param TEXT,
  new_order INTEGER
)
RETURNS JSONB AS $$
DECLARE
  current_data JSONB;
  new_blocks JSONB;
  target_block JSONB;
  other_blocks JSONB;
BEGIN
  -- Obter page_data atual
  SELECT page_data
  INTO current_data
  FROM profiles
  WHERE id = profile_id_param;
  
  IF NOT FOUND OR current_data IS NULL THEN
    RAISE EXCEPTION 'Perfil ou page_data não encontrado';
  END IF;
  
  -- Encontrar bloco alvo
  SELECT elem INTO target_block
  FROM jsonb_array_elements(current_data->'blocks') elem
  WHERE elem->>'id' = block_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bloco não encontrado';
  END IF;
  
  -- Atualizar ordem do bloco alvo
  target_block := jsonb_set(target_block, '{order}', to_jsonb(new_order));
  
  -- Reordenar todos os blocos
  new_blocks := (
    SELECT jsonb_agg(
      CASE
        WHEN elem->>'id' = block_id_param THEN target_block
        WHEN (elem->>'order')::INTEGER >= new_order AND (elem->>'id') != block_id_param 
        THEN jsonb_set(elem, '{order}', to_jsonb((elem->>'order')::INTEGER + 1))
        ELSE elem
      END
    )
    FROM jsonb_array_elements(current_data->'blocks') elem
  );
  
  -- Atualizar page_data
  current_data := current_data || jsonb_build_object(
    'blocks', new_blocks,
    'lastUpdated', to_jsonb(now())
  );
  
  -- Atualizar tabela
  UPDATE profiles
  SET page_data = current_data,
      updated_at = NOW()
  WHERE id = profile_id_param;
  
  RETURN current_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEW PARA PÁGINAS PUBLICADAS
-- ============================================

DROP VIEW IF EXISTS public.published_pages;

CREATE VIEW public.published_pages AS
SELECT 
  p.id,
  p.username,
  p.name,
  p.bio_url,
  p.page_title,
  p.bio_description,
  p.avatar_url,
  p.category,
  p.location,
  p.custom_link,
  jsonb_build_object(
    'profile', jsonb_build_object(
      'name', p.name,
      'username', p.username,
      'bioUrl', p.bio_url,
      'pageTitle', p.page_title,
      'bioDescription', p.bio_description,
      'avatarUrl', p.avatar_url,
      'coverUrl', p.page_data -> 'profile' ->> 'coverUrl',
      'category', p.category,
      'location', p.location,
      'customLink', p.custom_link
    ),
    'blocks', COALESCE(p.page_data -> 'blocks', '[]'::jsonb),
    'theme', COALESCE(p.page_data -> 'theme', '{}'::jsonb),
    'published', true,
    'lastUpdated', p.updated_at
  ) AS page_data,
  p.updated_at
FROM profiles p
WHERE p.published = true
  AND p.page_data IS NOT NULL;

-- NOTA: Views não suportam políticas RLS
-- A view published_pages já expõe apenas dados públicos (published = true)
-- O acesso é controlado pela tabela profiles subjacente

-- ============================================
-- VALIDAÇÃO FINAL
-- ============================================

DO $$
BEGIN
  -- Verificar se as colunas foram adicionadas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'page_data'
  ) THEN
    RAISE EXCEPTION 'Coluna page_data não foi adicionada';
  END IF;
  
  -- Verificar se os índices foram criados
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_profiles_page_data'
  ) THEN
    RAISE NOTICE 'Índice idx_profiles_page_data não foi criado (pode ser opcional)';
  END IF;
  
  RAISE NOTICE ' Schema de páginas do usuário configurado com sucesso';
END $$;
