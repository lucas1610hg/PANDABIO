-- PandaBio — domínio personalizado por perfil

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS custom_domain TEXT,
  ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_custom_domain_lower
  ON public.profiles (lower(custom_domain))
  WHERE custom_domain IS NOT NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS custom_domain_format;

ALTER TABLE public.profiles
  ADD CONSTRAINT custom_domain_format
  CHECK (
    custom_domain IS NULL
    OR custom_domain ~* '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$'
  );
