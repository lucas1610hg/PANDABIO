-- =============================================================
-- Migration T14b: Storage bucket + RLS policies para user-assets
-- Data: 2026-09-20
-- Descrição:
--   Cria (ou atualiza) o bucket público 'user-assets' no Supabase Storage
--   e configura RLS policies para:
--     - Leitura pública (imagens aparecem na bio pública)
--     - Escrita restrita ao dono (insert/update/delete) com path match
--       user-assets/<auth.uid()>/<subpasta>/arquivo
--   Baseado no storage_setup.sql existente, agora com formato UP/DOWN.
-- =============================================================

-- UP

-- 1. Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'user-assets',
    'user-assets',
    true,
    5242880,  -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
    public             = EXCLUDED.public,
    file_size_limit    = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. RLS habilitado em storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policies — DROP IF EXISTS garante idempotência

-- Leitura pública: qualquer pessoa pode ler imagens do bucket
DROP POLICY IF EXISTS "user_assets_public_read" ON storage.objects;
CREATE POLICY "user_assets_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'user-assets');

-- Insert: apenas usuário autenticado, dentro da própria pasta
DROP POLICY IF EXISTS "user_assets_insert_own" ON storage.objects;
CREATE POLICY "user_assets_insert_own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'user-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Update: apenas dono do arquivo
DROP POLICY IF EXISTS "user_assets_update_own" ON storage.objects;
CREATE POLICY "user_assets_update_own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'user-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'user-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Delete: apenas dono do arquivo
DROP POLICY IF EXISTS "user_assets_delete_own" ON storage.objects;
CREATE POLICY "user_assets_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'user-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Validação
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'user-assets') THEN
        RAISE EXCEPTION 'Bucket user-assets não foi criado';
    END IF;

    RAISE NOTICE '✓ Storage user-assets configurado com bucket + 4 policies RLS';
END $$;


-- DOWN
-- Remove policies e o bucket user-assets

-- DROP POLICY IF EXISTS "user_assets_delete_own" ON storage.objects;
-- DROP POLICY IF EXISTS "user_assets_update_own" ON storage.objects;
-- DROP POLICY IF EXISTS "user_assets_insert_own" ON storage.objects;
-- DROP POLICY IF EXISTS "user_assets_public_read" ON storage.objects;
-- DELETE FROM storage.buckets WHERE id = 'user-assets';
