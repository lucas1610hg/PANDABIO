-- Adiciona destino do botão Comprar para cada produto.
-- Permite página de vendas ou atendimento via WhatsApp.
-- Idempotente: pode ser executada mais de uma vez com segurança.

BEGIN;

ALTER TABLE public.products
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

COMMENT ON COLUMN public.products.purchase_url IS
  'URL usada pelo botão Comprar: página de vendas ou link do WhatsApp.';

COMMENT ON COLUMN public.products.purchase_type IS
  'Tipo de destino do botão Comprar: sales ou whatsapp.';

CREATE INDEX IF NOT EXISTS idx_products_profile_purchase_type
  ON public.products (profile_id, purchase_type)
  WHERE purchase_url IS NOT NULL;

COMMIT;

-- Verificação opcional:
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'products'
--   AND column_name IN ('purchase_url', 'purchase_type')
-- ORDER BY column_name;
