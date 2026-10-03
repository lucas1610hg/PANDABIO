BEGIN;

CREATE TABLE IF NOT EXISTS public.public_page_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type VARCHAR(10) NOT NULL CHECK (event_type IN ('view', 'click')),
  target_id TEXT,
  device_type VARCHAR(10) NOT NULL DEFAULT 'desktop'
    CHECK (device_type IN ('mobile', 'desktop', 'tablet')),
  referrer TEXT,
  visitor_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.public_page_events
  ADD COLUMN IF NOT EXISTS visitor_id TEXT;

CREATE INDEX IF NOT EXISTS idx_public_page_events_profile_created
  ON public.public_page_events(profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_public_page_events_profile_visitor
  ON public.public_page_events(profile_id, visitor_id, created_at DESC)
  WHERE visitor_id IS NOT NULL;

ALTER TABLE public.public_page_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view public page events" ON public.public_page_events;
CREATE POLICY "Owners can view public page events" ON public.public_page_events
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id)
  );

CREATE OR REPLACE FUNCTION public.record_public_page_event(
  p_username TEXT,
  p_event_type TEXT,
  p_target_id TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT 'desktop',
  p_referrer TEXT DEFAULT NULL,
  p_visitor_id TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_profile_id UUID;
  safe_device_type TEXT := CASE
    WHEN p_device_type IN ('mobile', 'tablet', 'desktop') THEN p_device_type
    ELSE 'desktop'
  END;
BEGIN
  IF p_event_type NOT IN ('view', 'click') THEN
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
    visitor_id
  )
  VALUES (
    target_profile_id,
    p_event_type,
    NULLIF(left(trim(p_target_id), 256), ''),
    safe_device_type,
    NULLIF(left(trim(p_referrer), 2048), ''),
    NULLIF(left(trim(p_visitor_id), 128), '')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_public_page_event(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_public_page_event(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  TO anon, authenticated;

COMMIT;
