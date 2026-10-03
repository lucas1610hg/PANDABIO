-- Sincroniza catálogo de produtos com cadastro manual e importação por URL.
-- A importação salva: título em name, preço em price, descrição em description,
-- primeira imagem em image e link original em source_url.
-- Idempotente: pode ser executada mais de uma vez com segurança.

BEGIN;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS image TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS purchase_url TEXT,
  ADD COLUMN IF NOT EXISTS purchase_type VARCHAR(20);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_purchase_type_check'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_purchase_type_check
      CHECK (purchase_type IS NULL OR purchase_type IN ('sales', 'whatsapp'));
  END IF;
END $$;

COMMENT ON COLUMN public.products.name IS
  'Título do produto cadastrado manualmente ou importado por URL.';

COMMENT ON COLUMN public.products.price IS
  'Preço do produto extraído do link ou informado manualmente.';

COMMENT ON COLUMN public.products.image IS
  'URL da primeira imagem do produto ou imagem enviada manualmente.';

COMMENT ON COLUMN public.products.description IS
  'Descrição do produto extraída do link ou informada manualmente.';

COMMENT ON COLUMN public.products.source_url IS
  'URL original usada para importar as informações do produto.';

COMMENT ON COLUMN public.products.purchase_url IS
  'URL usada pelo botão Comprar: página de vendas ou WhatsApp.';

COMMENT ON COLUMN public.products.purchase_type IS
  'Destino do botão Comprar: sales ou whatsapp.';

CREATE INDEX IF NOT EXISTS idx_products_profile_source_url
  ON public.products (profile_id, source_url)
  WHERE source_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_profile_purchase_type
  ON public.products (profile_id, purchase_type)
  WHERE purchase_url IS NOT NULL;

COMMIT;

-- Verificação:
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'products'
--   AND column_name IN (
--     'name', 'price', 'image', 'description', 'source_url',
--     'purchase_url', 'purchase_type'
--   )
-- ORDER BY ordinal_position;