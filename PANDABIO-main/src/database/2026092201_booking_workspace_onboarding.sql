-- PANDABIO booking workspace onboarding
-- Creates workspace and default settings atomically.

CREATE OR REPLACE FUNCTION create_booking_workspace(
  p_name VARCHAR(100) DEFAULT NULL,
  p_slug VARCHAR(50) DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  p_currency VARCHAR(3) DEFAULT 'BRL',
  p_language VARCHAR(5) DEFAULT 'pt-BR'
)
RETURNS booking_workspaces
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
  v_profile_name VARCHAR(50);
  v_username VARCHAR(20);
  v_workspace booking_workspaces;
  v_name VARCHAR(100);
  v_slug VARCHAR(50);
BEGIN
  SELECT id, name, username
  INTO v_profile_id, v_profile_name, v_username
  FROM profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Authenticated profile not found';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_profile_id::TEXT, 0));

  SELECT *
  INTO v_workspace
  FROM booking_workspaces
  WHERE profile_id = v_profile_id
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_workspace.id IS NOT NULL THEN
    INSERT INTO booking_settings (workspace_id, profile_id)
    VALUES (v_workspace.id, v_profile_id)
    ON CONFLICT (workspace_id, profile_id) DO NOTHING;

    RETURN v_workspace;
  END IF;

  v_name := COALESCE(NULLIF(BTRIM(p_name), ''), NULLIF(BTRIM(v_profile_name), ''), 'Meu negocio');
  v_slug := LOWER(
    REGEXP_REPLACE(
      COALESCE(NULLIF(BTRIM(p_slug), ''), NULLIF(BTRIM(v_username), ''), 'pandabio'),
      '[^a-z0-9]+',
      '-',
      'g'
    )
  );
  v_slug := BTRIM(v_slug, '-');

  IF v_slug = '' THEN
    v_slug := 'pandabio';
  END IF;

  v_slug := LEFT(v_slug, 50);

  IF EXISTS (SELECT 1 FROM booking_workspaces WHERE slug = v_slug) THEN
    v_slug := LEFT(v_slug, 40) || '-' || LEFT(REPLACE(v_profile_id::TEXT, '-', ''), 8);
  END IF;

  INSERT INTO booking_workspaces (
    profile_id,
    name,
    slug,
    description,
    timezone,
    currency,
    language,
    active
  )
  VALUES (
    v_profile_id,
    v_name,
    v_slug,
    p_description,
    COALESCE(NULLIF(BTRIM(p_timezone), ''), 'America/Sao_Paulo'),
    COALESCE(NULLIF(BTRIM(p_currency), ''), 'BRL'),
    COALESCE(NULLIF(BTRIM(p_language), ''), 'pt-BR'),
    true
  )
  RETURNING * INTO v_workspace;

  INSERT INTO booking_settings (workspace_id, profile_id)
  VALUES (v_workspace.id, v_profile_id);

  RETURN v_workspace;
END;
$$;

REVOKE ALL ON FUNCTION create_booking_workspace(VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_booking_workspace(VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR, VARCHAR) TO authenticated;

COMMENT ON FUNCTION create_booking_workspace(VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR, VARCHAR)
IS 'Creates or returns the authenticated profile booking workspace and default settings atomically.';
