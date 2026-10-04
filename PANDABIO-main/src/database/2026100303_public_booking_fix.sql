BEGIN;

DROP VIEW IF EXISTS public.public_booking_availability;

CREATE VIEW public.public_booking_availability
WITH (security_invoker = false)
AS
SELECT
  ba.id,
  bw.slug AS workspace_slug,
  bp.id AS professional_id,
  bp.name AS professional_name,
  bp.avatar_url AS professional_avatar,
  bs.id AS service_id,
  bs.name AS service_name,
  bs.description AS service_description,
  bs.duration AS service_duration,
  bs.price AS service_price,
  ba.day_of_week,
  ba.start_time,
  ba.end_time,
  ba.break_start_time,
  ba.break_end_time
FROM public.booking_workspaces bw
JOIN public.booking_professionals bp
  ON bp.workspace_id = bw.id
 AND bp.active = true
JOIN public.booking_professional_services bps
  ON bps.professional_id = bp.id
 AND bps.active = true
JOIN public.booking_services bs
  ON bs.id = bps.service_id
 AND bs.active = true
JOIN public.booking_availability ba
  ON ba.professional_id = bp.id
 AND ba.active = true
WHERE bw.active = true;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.public_booking_availability TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_workspace_slug VARCHAR(50),
  p_service_id UUID,
  p_professional_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  date DATE,
  start_time TIME,
  end_time TIME,
  available BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_date_value DATE;
  availability_row RECORD;
  slot_time TIME;
  slot_end TIME;
  service_duration INTEGER;
BEGIN
  SELECT bs.duration INTO service_duration
  FROM booking_services bs
  JOIN booking_workspaces bw ON bw.id = bs.workspace_id
  WHERE bs.id = p_service_id
    AND bs.workspace_id = (
      SELECT id FROM booking_workspaces WHERE slug = p_workspace_slug AND active = true LIMIT 1
    )
    AND bs.active = true
    AND EXISTS (
      SELECT 1 FROM booking_professional_services bps
      WHERE bps.service_id = bs.id
        AND bps.professional_id = p_professional_id
        AND bps.active = true
    );

  IF service_duration IS NULL THEN RETURN; END IF;

  current_date_value := p_start_date;
  WHILE current_date_value <= p_end_date LOOP
    FOR availability_row IN
      SELECT * FROM booking_availability
      WHERE professional_id = p_professional_id
        AND day_of_week = EXTRACT(DOW FROM current_date_value)::INTEGER
        AND active = true
    LOOP
      slot_time := availability_row.start_time;
      WHILE slot_time + make_interval(mins => service_duration) <= availability_row.end_time LOOP
        slot_end := slot_time + make_interval(mins => service_duration);
        IF NOT EXISTS (
          SELECT 1 FROM booking_appointments appointment
          WHERE appointment.professional_id = p_professional_id
            AND appointment.date = current_date_value
            AND appointment.status NOT IN ('cancelled', 'no_show')
            AND appointment.start_time < slot_end
            AND appointment.end_time > slot_time
        ) THEN
          date := current_date_value;
          start_time := slot_time;
          end_time := slot_end;
          available := true;
          RETURN NEXT;
        END IF;
        slot_time := slot_time + INTERVAL '30 minutes';
      END LOOP;
    END LOOP;
    current_date_value := current_date_value + 1;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_slots(VARCHAR, UUID, UUID, DATE, DATE) TO anon, authenticated;

COMMIT;
