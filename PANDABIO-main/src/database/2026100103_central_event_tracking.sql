BEGIN;

ALTER TABLE public.public_page_events
  ALTER COLUMN event_type TYPE TEXT USING event_type::text;

ALTER TABLE public.public_page_events
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS medium TEXT,
  ADD COLUMN IF NOT EXISTS campaign TEXT,
  ADD COLUMN IF NOT EXISTS landing_page TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.public_page_events
  DROP CONSTRAINT IF EXISTS public_page_events_event_type_check;

ALTER TABLE public.public_page_events
  ADD CONSTRAINT public_page_events_event_type_check
  CHECK (
    event_type IN (
      'view',
      'click',
      'page_view',
      'link_click',
      'product_view',
      'product_click',
      'service_view',
      'booking_start',
      'booking_completed',
      'form_view',
      'form_submit',
      'whatsapp_click',
      'phone_click',
      'email_click',
      'social_click',
      'conversion'
    )
  );

CREATE INDEX IF NOT EXISTS idx_public_page_events_profile_source
  ON public.public_page_events(profile_id, source, campaign, created_at DESC);

DROP FUNCTION IF EXISTS public.record_public_page_event(TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.record_public_page_event(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.record_public_page_event(
  p_username TEXT,
  p_event_type TEXT,
  p_target_id TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT 'desktop',
  p_referrer TEXT DEFAULT NULL,
  p_visitor_id TEXT DEFAULT NULL,
  p_source TEXT DEFAULT NULL,
  p_medium TEXT DEFAULT NULL,
  p_campaign TEXT DEFAULT NULL,
  p_landing_page TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_profile_id UUID;
  safe_event_type TEXT := lower(trim(p_event_type));
  safe_device_type TEXT := CASE
    WHEN p_device_type IN ('mobile', 'tablet', 'desktop') THEN p_device_type
    ELSE 'desktop'
  END;
BEGIN
  IF safe_event_type NOT IN (
    'view', 'click', 'page_view', 'link_click', 'product_view', 'product_click',
    'service_view', 'booking_start', 'booking_completed', 'form_view', 'form_submit',
    'whatsapp_click', 'phone_click', 'email_click', 'social_click', 'conversion'
  ) THEN
    RAISE EXCEPTION 'Evento público inválido';
  END IF;

  SELECT id
    INTO target_profile_id
    FROM public.profiles
   WHERE lower(username) = lower(trim(p_username))
     AND published = true
   LIMIT 1;

  IF target_profile_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.public_page_events(
    profile_id,
    event_type,
    target_id,
    device_type,
    referrer,
    visitor_id,
    source,
    medium,
    campaign,
    landing_page,
    country,
    city,
    metadata
  )
  VALUES (
    target_profile_id,
    safe_event_type,
    NULLIF(left(trim(p_target_id), 256), ''),
    safe_device_type,
    NULLIF(left(trim(p_referrer), 2048), ''),
    NULLIF(left(trim(p_visitor_id), 128), ''),
    NULLIF(left(trim(p_source), 128), ''),
    NULLIF(left(trim(p_medium), 128), ''),
    NULLIF(left(trim(p_campaign), 256), ''),
    NULLIF(left(trim(p_landing_page), 2048), ''),
    NULLIF(left(trim(p_country), 128), ''),
    NULLIF(left(trim(p_city), 128), ''),
    COALESCE(p_metadata, '{}'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_public_page_event(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_public_page_event(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB
) TO anon, authenticated;

COMMIT;
