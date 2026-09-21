-- =============================================================
-- Migration T14a: Sincronizar colunas profile_id nas tabelas dependentes
-- Data: 2026-09-20
-- Descrição:
--   Renomeia user_id → profile_id nas tabelas links, products, leads,
--   activities e analytics, caso o banco real ainda use a coluna antiga.
--   A tabela profiles mantém user_id (FK para auth.users).
--   Idempotente: IF EXISTS guards em cada ALTER.
-- =============================================================

-- UP

-- Helper: renomeia coluna somente se a coluna antiga existir e a nova não.
-- Necessário pois ALTER TABLE ... RENAME COLUMN falha se a coluna não existe.
DO $$
DECLARE
  _tbl  text;
BEGIN
  FOR _tbl IN SELECT unnest(ARRAY['links','products','leads','activities','analytics'])
  LOOP
    -- Verifica se a coluna user_id existe na tabela
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name  = _tbl
        AND column_name = 'user_id'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name  = _tbl
        AND column_name = 'profile_id'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I RENAME COLUMN user_id TO profile_id', _tbl);
      RAISE NOTICE 'Renamed user_id → profile_id in table %', _tbl;
    ELSE
      RAISE NOTICE 'Table % already has profile_id (or no user_id to rename) — skipping', _tbl;
    END IF;
  END LOOP;
END $$;

-- Atualizar FK constraints para referenciar profiles(id) se ainda apontam user_id
-- (as tabelas do schema.sql já usam profile_id, então isso é proteção extra)

-- Atualizar índices: dropar os antigos (idx_*_user_id) e criar novos (idx_*_profile_id)
-- Idempotente via IF NOT EXISTS / IF EXISTS

DO $$
DECLARE
  _tbl text;
BEGIN
  FOR _tbl IN SELECT unnest(ARRAY['links','products','leads','activities','analytics'])
  LOOP
    -- Drop old index if exists
    EXECUTE format('DROP INDEX IF EXISTS idx_%s_user_id', _tbl);
    -- Create new index if not exists
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_profile_id ON public.%I(profile_id)', _tbl, _tbl);
  END LOOP;
END $$;

-- Validação: verificar que NENHUMA tabela dependente ainda tem coluna user_id
DO $$
DECLARE
  _count int;
BEGIN
  SELECT count(*) INTO _count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name IN ('links','products','leads','activities','analytics')
    AND column_name = 'user_id';

  IF _count > 0 THEN
    RAISE EXCEPTION 'FALHA: % tabelas dependentes ainda possuem coluna user_id', _count;
  END IF;

  RAISE NOTICE '✓ Todas as tabelas dependentes usam profile_id corretamente';
END $$;


-- DOWN
-- Reverte profile_id → user_id nas tabelas dependentes
-- ATENÇÃO: Só executar se precisar reverter a migration acima.

-- DO $$
-- DECLARE
--   _tbl text;
-- BEGIN
--   FOR _tbl IN SELECT unnest(ARRAY['links','products','leads','activities','analytics'])
--   LOOP
--     IF EXISTS (
--       SELECT 1 FROM information_schema.columns
--       WHERE table_schema = 'public'
--         AND table_name  = _tbl
--         AND column_name = 'profile_id'
--     ) AND NOT EXISTS (
--       SELECT 1 FROM information_schema.columns
--       WHERE table_schema = 'public'
--         AND table_name  = _tbl
--         AND column_name = 'user_id'
--     ) THEN
--       EXECUTE format('ALTER TABLE public.%I RENAME COLUMN profile_id TO user_id', _tbl);
--       RAISE NOTICE 'Reverted profile_id → user_id in table %', _tbl;
--     END IF;
--   END LOOP;
-- END $$;
--
-- DO $$
-- DECLARE
--   _tbl text;
-- BEGIN
--   FOR _tbl IN SELECT unnest(ARRAY['links','products','leads','activities','analytics'])
--   LOOP
--     EXECUTE format('DROP INDEX IF EXISTS idx_%s_profile_id', _tbl);
--     EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_user_id ON public.%I(user_id)', _tbl, _tbl);
--   END LOOP;
-- END $$;
