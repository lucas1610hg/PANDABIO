BEGIN;

ALTER TABLE public.public_page_events
  ADD COLUMN IF NOT EXISTS visitor_id TEXT;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS visitor_id TEXT;

-- Remove permissive audit-log insert access and require workspace ownership.
DROP POLICY IF EXISTS "Service can insert audit_log" ON public.booking_audit_log;
CREATE POLICY "Workspace members can insert audit_log"
  ON public.booking_audit_log
  FOR INSERT
  WITH CHECK (public.has_workspace_access(workspace_id));

-- Reject abusive public event bursts by visitor or by profile.
CREATE OR REPLACE FUNCTION public.limit_public_page_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  visitor_event_count integer;
  profile_event_count integer;
BEGIN
  IF coalesce(nullif(trim(NEW.visitor_id), ''), '') <> '' THEN
    SELECT count(*)
      INTO visitor_event_count
      FROM public.public_page_events
     WHERE profile_id = NEW.profile_id
       AND visitor_id = NEW.visitor_id
       AND created_at >= now() - interval '1 minute';

    IF visitor_event_count >= 120 THEN
      RAISE EXCEPTION 'Limite de eventos públicos excedido';
    END IF;
  ELSE
    SELECT count(*)
      INTO profile_event_count
      FROM public.public_page_events
     WHERE profile_id = NEW.profile_id
       AND created_at >= now() - interval '1 minute';

    IF profile_event_count >= 1000 THEN
      RAISE EXCEPTION 'Limite de eventos públicos excedido';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS limit_public_page_events_trigger ON public.public_page_events;
CREATE TRIGGER limit_public_page_events_trigger
  BEFORE INSERT ON public.public_page_events
  FOR EACH ROW
  EXECUTE FUNCTION public.limit_public_page_events();

-- Limit public lead submissions by e-mail and visitor while preserving CRM inserts.
CREATE OR REPLACE FUNCTION public.limit_public_leads()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_lead_count integer;
  visitor_lead_count integer;
BEGIN
  IF NEW.channel IS DISTINCT FROM 'public_form' THEN
    RETURN NEW;
  END IF;

  SELECT count(*)
    INTO email_lead_count
    FROM public.leads
   WHERE profile_id = NEW.profile_id
     AND lower(email) = lower(NEW.email)
     AND created_at >= now() - interval '1 hour';

  IF email_lead_count >= 3 THEN
    RAISE EXCEPTION 'Limite de submissões excedido';
  END IF;

  IF coalesce(nullif(trim(NEW.visitor_id), ''), '') <> '' THEN
    SELECT count(*)
      INTO visitor_lead_count
      FROM public.leads
     WHERE profile_id = NEW.profile_id
       AND visitor_id = NEW.visitor_id
       AND created_at >= now() - interval '1 hour';

    IF visitor_lead_count >= 10 THEN
      RAISE EXCEPTION 'Limite de submissões excedido';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS limit_public_leads_trigger ON public.leads;
CREATE TRIGGER limit_public_leads_trigger
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.limit_public_leads();

COMMIT;
