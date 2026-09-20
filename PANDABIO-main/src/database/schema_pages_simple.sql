--  SCHEMA SQL SIMPLE - ADICIONAR COLUNAS À TABELA PROFILES
-- Versão: 1.0 Simplificada
-- Data: 19/09/2026
-- Descrição: Adiciona apenas as colunas necessárias para a funcionalidade de páginas

-- ============================================
-- ADICIONAR COLUNAS À TABELA PROFILES
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
  
  RAISE NOTICE ' Colunas para páginas do usuário adicionadas com sucesso';
END $$;