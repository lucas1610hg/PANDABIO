ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS category varchar(50),
  ADD COLUMN IF NOT EXISTS location varchar(100),
  ADD COLUMN IF NOT EXISTS custom_link varchar(255),
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS page_data jsonb,
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_user_id_lookup
  ON public.profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_username_exact
  ON public.profiles (username);

DROP INDEX IF EXISTS public.idx_profiles_page_data;
DROP INDEX IF EXISTS public.idx_profiles_page_data_path;
