BEGIN;

CREATE OR REPLACE FUNCTION public.capture_public_lead(
  p_username TEXT,
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_consent BOOLEAN DEFAULT FALSE,
  p_visitor_id TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT 'desktop',
  p_source TEXT DEFAULT NULL,
  p_medium TEXT DEFAULT NULL,
  p_campaign TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_landing_page TEXT DEFAULT NULL,
  p_related_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_profile_id UUID;
  created_lead_id UUID;
  safe_name TEXT := left(trim(coalesce(p_name, '')), 100);
  safe_email TEXT := lower(left(trim(coalesce(p_email, '')), 255));
  safe_phone TEXT := NULLIF(left(trim(coalesce(p_phone, '')), 20), '');
BEGIN
  IF NOT p_consent OR safe_name = '' OR safe_email = '' THEN
    RAISE EXCEPTION 'Consentimento e dados de contato são obrigatórios';
  END IF;

  IF safe_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'E-mail inválido';
  END IF;

  SELECT id
    INTO target_profile_id
    FROM public.profiles
   WHERE lower(username) = lower(trim(p_username))
     AND published = true
   LIMIT 1;

  IF target_profile_id IS NULL THEN
    RAISE EXCEPTION 'Página pública não encontrada';
  END IF;

  INSERT INTO public.leads(
    profile_id,
    name,
    email,
    phone,
    channel,
    status,
    source,
    medium,
    campaign,
    referrer,
    landing_page,
    device,
    score,
    interest,
    first_access_at,
    last_access_at,
    related_type,
    related_name,
    consent_at,
    visitor_id
  )
  VALUES (
    target_profile_id,
    safe_name,
    safe_email,
    safe_phone,
    'public_form',
    'new',
    NULLIF(left(trim(coalesce(p_source, '')), 128), ''),
    NULLIF(left(trim(coalesce(p_medium, '')), 128), ''),
    NULLIF(left(trim(coalesce(p_campaign, '')), 256), ''),
    NULLIF(left(trim(coalesce(p_referrer, '')), 2048), ''),
    NULLIF(left(trim(coalesce(p_landing_page, '')), 2048), ''),
    CASE
      WHEN p_device_type IN ('mobile', 'tablet', 'desktop') THEN p_device_type
      ELSE 'desktop'
    END,
    70,
    'high',
    now(),
    now(),
    CASE WHEN NULLIF(trim(coalesce(p_related_name, '')), '') IS NULL THEN NULL ELSE 'service' END,
    NULLIF(left(trim(coalesce(p_related_name, '')), 256), ''),
    now(),
    NULLIF(left(trim(coalesce(p_visitor_id, '')), 128), '')
  )
  RETURNING id INTO created_lead_id;

  RETURN created_lead_id;
END;
$$;

REVOKE ALL ON FUNCTION public.capture_public_lead(
  TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.capture_public_lead(
  TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO anon, authenticated;

COMMIT;
