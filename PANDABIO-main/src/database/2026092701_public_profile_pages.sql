-- Expose only published bio pages to anonymous visitors.
-- Keep page_data limited to fields needed by the public renderer.

CREATE OR REPLACE VIEW public.public_profile_pages AS
SELECT
  p.id,
  p.username,
  p.name,
  p.bio_url,
  p.page_title,
  p.bio_description,
  p.avatar_url,
  p.category,
  p.location,
  p.custom_link,
  jsonb_build_object(
    'profile', jsonb_build_object(
      'name', p.name,
      'username', p.username,
      'bioUrl', p.bio_url,
      'pageTitle', p.page_title,
      'bioDescription', p.bio_description,
      'avatarUrl', p.avatar_url,
      'coverUrl', p.page_data -> 'profile' ->> 'coverUrl',
      'category', p.category,
      'location', p.location,
      'customLink', p.custom_link
    ),
    'blocks', COALESCE(p.page_data -> 'blocks', '[]'::jsonb),
    'theme', COALESCE(p.page_data -> 'theme', '{}'::jsonb),
    'published', true,
    'lastUpdated', p.updated_at
  ) AS page_data,
  p.updated_at,
  (
    SELECT bw.slug
    FROM public.booking_workspaces AS bw
    WHERE bw.profile_id = p.id
      AND bw.active = true
    ORDER BY bw.created_at ASC
    LIMIT 1
  ) AS booking_workspace_slug
FROM public.profiles AS p
WHERE p.published = true
  AND p.page_data IS NOT NULL;

GRANT SELECT ON public.public_profile_pages TO anon, authenticated;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON public.profiles (lower(username));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS username_reserved;

ALTER TABLE public.profiles
  ADD CONSTRAINT username_reserved
  CHECK (lower(username) NOT IN ('admin', 'api', 'auth', 'dashboard', 'help', 'login', 'pricing', 'settings', 'support'));
