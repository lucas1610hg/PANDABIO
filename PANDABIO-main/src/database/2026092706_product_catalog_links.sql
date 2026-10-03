-- Mantém URL de origem de produtos importados para reutilização no bloco de produtos.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS source_url TEXT;