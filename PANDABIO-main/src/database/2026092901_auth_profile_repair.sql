-- Repara perfis ausentes para usuários autenticados.
-- Também corrige criação automática de novos perfis.
-- Não apaga registros existentes.

BEGIN;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_username TEXT;
  safe_username TEXT;
  display_name TEXT;
BEGIN
  display_name := LEFT(
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
      NULLIF(SPLIT_PART(COALESCE(NEW.email, ''), '@', 1), ''),
      'Usuário'
    ),
    50
  );

  requested_username := LOWER(TRIM(COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'username', ''),
    SPLIT_PART(COALESCE(NEW.email, ''), '@', 1),
    ''
  )));

  IF CHAR_LENGTH(requested_username) BETWEEN 3 AND 20
     AND requested_username ~ '^[a-z0-9][a-z0-9._-]*[a-z0-9]$'
     AND requested_username NOT IN (
       'admin', 'api', 'auth', 'dashboard', 'help',
       'login', 'pricing', 'settings', 'support'
     )
     AND NOT EXISTS (
       SELECT 1
       FROM public.profiles
       WHERE username = requested_username
     ) THEN
    safe_username := requested_username;
  ELSE
    safe_username := 'usuario' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', '') FROM 1 FOR 8);
  END IF;

  INSERT INTO public.profiles (
    user_id,
    name,
    username,
    email,
    plan,
    bio_url,
    page_title
  )
  VALUES (
    NEW.id,
    display_name,
    safe_username,
    COALESCE(NEW.email, ''),
    'Gratuito',
    'pandabio.com/' || safe_username,
    LEFT(display_name || ' • Bio Oficial', 100)
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

WITH missing_users AS (
  SELECT
    u.id,
    LEFT(
      COALESCE(
        NULLIF(TRIM(u.raw_user_meta_data->>'name'), ''),
        NULLIF(SPLIT_PART(COALESCE(u.email, ''), '@', 1), ''),
        'Usuário'
      ),
      50
    ) AS display_name,
    LOWER(TRIM(COALESCE(
      NULLIF(u.raw_user_meta_data->>'username', ''),
      SPLIT_PART(COALESCE(u.email, ''), '@', 1),
      ''
    ))) AS requested_username,
    COALESCE(u.email, '') AS email
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = u.id
  )
), prepared_profiles AS (
  SELECT
    m.id,
    m.display_name,
    m.email,
    CASE
      WHEN CHAR_LENGTH(m.requested_username) BETWEEN 3 AND 20
       AND m.requested_username ~ '^[a-z0-9][a-z0-9._-]*[a-z0-9]$'
       AND m.requested_username NOT IN (
         'admin', 'api', 'auth', 'dashboard', 'help',
         'login', 'pricing', 'settings', 'support'
       )
       AND NOT EXISTS (
         SELECT 1
         FROM public.profiles p
         WHERE p.username = m.requested_username
       )
      THEN m.requested_username
      ELSE 'usuario' || SUBSTRING(REPLACE(m.id::TEXT, '-', '') FROM 1 FOR 8)
    END AS username
  FROM missing_users m
)
INSERT INTO public.profiles (
  user_id,
  name,
  username,
  email,
  plan,
  bio_url,
  page_title
)
SELECT
  p.id,
  p.display_name,
  p.username,
  p.email,
  'Gratuito',
  'pandabio.com/' || p.username,
  LEFT(p.display_name || ' • Bio Oficial', 100)
FROM prepared_profiles p
ON CONFLICT DO NOTHING;

COMMIT;

-- Verificação:
-- SELECT u.id, u.email, p.id AS profile_id, p.username
-- FROM auth.users u
-- LEFT JOIN public.profiles p ON p.user_id = u.id
-- ORDER BY u.created_at DESC;