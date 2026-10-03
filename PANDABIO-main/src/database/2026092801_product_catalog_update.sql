-- Atualiza catálogo de produtos para cadastro manual e importação por URL.
-- Idempotente: pode ser executada mais de uma vez com segurança.

BEGIN;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT;

COMMENT ON COLUMN public.products.description IS
  'Descrição exibida no catálogo e no bloco Produto da página.';

COMMENT ON COLUMN public.products.source_url IS
  'URL original do produto usada para importar e abrir o link de compra.';

CREATE INDEX IF NOT EXISTS idx_products_profile_source_url
  ON public.products (profile_id, source_url)
  WHERE source_url IS NOT NULL;

COMMIT;

-- Verificação opcional:
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'products'
--   AND column_name IN ('description', 'source_url')
-- ORDER BY column_name;
