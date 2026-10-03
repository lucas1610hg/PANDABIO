-- Corrige ambiguidade entre variável PL/pgSQL e coluna end_time.

CREATE OR REPLACE FUNCTION public.check_availability(
  p_workspace_slug VARCHAR(50),
  p_service_id UUID,
  p_professional_id UUID,
  p_date DATE,
  p_start_time TIME
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service_duration INTEGER;
  v_end_time TIME;
  v_is_available BOOLEAN;
  v_blocked BOOLEAN;
  v_day_available BOOLEAN;
BEGIN
  SELECT bs.duration
  INTO v_service_duration
  FROM public.booking_services AS bs
  JOIN public.booking_workspaces AS bw ON bw.id = bs.workspace_id
  JOIN public.booking_professional_services AS bps
    ON bps.service_id = bs.id
   AND bps.professional_id = p_professional_id
   AND bps.active = true
  JOIN public.booking_professionals AS bp
    ON bp.id = bps.professional_id
   AND bp.workspace_id = bw.id
   AND bp.active = true
  WHERE bs.id = p_service_id
    AND bw.slug = p_workspace_slug
    AND bw.active = true
    AND bs.active = true;

  IF v_service_duration IS NULL THEN
    RETURN jsonb_build_object('available', false, 'error', 'Service not found or inactive');
  END IF;

  v_end_time := (p_start_time + (v_service_duration || ' minutes')::interval)::time;

  IF v_end_time <= p_start_time THEN
    RETURN jsonb_build_object('available', false, 'error', 'Service exceeds operating hours');
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.booking_availability AS ba
    WHERE ba.professional_id = p_professional_id
      AND ba.day_of_week = EXTRACT(DOW FROM p_date)
      AND ba.start_time <= p_start_time
      AND ba.end_time >= v_end_time
      AND ba.active = true
      AND NOT (
        ba.break_start_time IS NOT NULL
        AND ba.break_end_time IS NOT NULL
        AND p_start_time < ba.break_end_time
        AND v_end_time > ba.break_start_time
      )
  )
  INTO v_day_available;

  IF NOT v_day_available THEN
    RETURN jsonb_build_object('available', false, 'error', 'Not available on this day/time');
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.booking_blocked_slots AS bbs
    WHERE bbs.professional_id = p_professional_id
      AND p_date BETWEEN bbs.start_date AND bbs.end_date
  )
  INTO v_blocked;

  IF v_blocked THEN
    RETURN jsonb_build_object('available', false, 'error', 'Professional not available on this date');
  END IF;

  SELECT NOT public.check_booking_conflict(
    p_professional_id,
    p_date,
    p_start_time,
    v_end_time
  )
  INTO v_is_available;

  RETURN jsonb_build_object(
    'available', v_is_available,
    'end_time', v_end_time,
    'duration', v_service_duration
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_availability(VARCHAR, UUID, UUID, DATE, TIME)
  TO anon, authenticated;
