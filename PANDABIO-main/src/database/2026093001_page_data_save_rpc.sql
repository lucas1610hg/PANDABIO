CREATE OR REPLACE FUNCTION public.save_page_data(
  p_profile_id uuid,
  p_page_data jsonb,
  p_profile jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_profile_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Perfil não encontrado ou sem permissão para salvar a página';
  END IF;

  UPDATE public.profiles
  SET page_data = p_page_data,
      name = COALESCE(NULLIF(LEFT(p_profile ->> 'name', 50), ''), name),
      username = COALESCE(NULLIF(LEFT(p_profile ->> 'username', 20), ''), username),
      bio_url = CASE
        WHEN COALESCE(p_profile ->> 'username', '') <> ''
             AND COALESCE(p_profile ->> 'bioUrl', '') LIKE 'pandabio.com/%'
          THEN 'pandabio.com/' || LEFT(p_profile ->> 'username', 20)
        ELSE COALESCE(NULLIF(p_profile ->> 'bioUrl', ''), bio_url)
      END,
      page_title = COALESCE(NULLIF(LEFT(p_profile ->> 'pageTitle', 100), ''), page_title),
      bio_description = CASE
        WHEN p_profile ? 'bioDescription' THEN p_profile ->> 'bioDescription'
        ELSE bio_description
      END,
      avatar_url = CASE
        WHEN p_profile ? 'avatarUrl' THEN NULLIF(p_profile ->> 'avatarUrl', '')
        ELSE avatar_url
      END,
      cover_url = CASE
        WHEN p_profile ? 'coverUrl' THEN NULLIF(p_profile ->> 'coverUrl', '')
        ELSE cover_url
      END,
      category = CASE
        WHEN p_profile ? 'category' THEN NULLIF(p_profile ->> 'category', '')
        ELSE category
      END,
      location = CASE
        WHEN p_profile ? 'location' THEN NULLIF(p_profile ->> 'location', '')
        ELSE location
      END,
      custom_link = CASE
        WHEN p_profile ? 'customLink' THEN NULLIF(p_profile ->> 'customLink', '')
        ELSE custom_link
      END,
      updated_at = now()
  WHERE id = p_profile_id
    AND user_id = auth.uid();

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.save_page_data(uuid, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_page_data(uuid, jsonb, jsonb) TO authenticated;
