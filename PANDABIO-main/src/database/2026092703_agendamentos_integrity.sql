-- Correções do módulo de agendamentos para bancos já instalados.
-- Mantém `no_show` como valor canônico e fecha brechas de disponibilidade.

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
SET search_path = public, pg_temp
AS $$
DECLARE
  v_workspace_id UUID;
  v_service_duration INTEGER;
  v_end_time TIME;
  v_is_available BOOLEAN;
  v_blocked BOOLEAN;
  v_day_available BOOLEAN;
BEGIN
  SELECT bw.id, bs.duration
    INTO v_workspace_id, v_service_duration
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
   WHERE bw.slug = p_workspace_slug
     AND bw.active = true
     AND bs.id = p_service_id
     AND bs.active = true;

  IF v_workspace_id IS NULL OR v_service_duration IS NULL THEN
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
       AND ba.workspace_id = v_workspace_id
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
  ) INTO v_day_available;

  IF NOT v_day_available THEN
    RETURN jsonb_build_object('available', false, 'error', 'Not available on this day/time');
  END IF;

  SELECT EXISTS (
    SELECT 1
      FROM public.booking_blocked_slots AS bbs
     WHERE bbs.professional_id = p_professional_id
       AND bbs.workspace_id = v_workspace_id
       AND p_date BETWEEN bbs.start_date AND bbs.end_date
  ) INTO v_blocked;

  IF v_blocked THEN
    RETURN jsonb_build_object('available', false, 'error', 'Professional not available on this date');
  END IF;

  SELECT NOT public.check_booking_conflict(
    p_professional_id,
    p_date,
    p_start_time,
    v_end_time
  ) INTO v_is_available;

  RETURN jsonb_build_object(
    'available', v_is_available,
    'end_time', v_end_time,
    'duration', v_service_duration
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_workspace_slug VARCHAR(50),
  p_service_id UUID,
  p_professional_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_workspace_id UUID;
  v_service_duration INTEGER;
  v_slot_duration INTEGER;
  v_result JSONB := '[]'::jsonb;
  v_current_date DATE := p_start_date;
  v_availability RECORD;
  v_slot_start TIME;
  v_slot_end TIME;
BEGIN
  SELECT bw.id, bs.duration, COALESCE(bset.default_slot_duration, 30)
    INTO v_workspace_id, v_service_duration, v_slot_duration
    FROM public.booking_workspaces AS bw
    JOIN public.booking_services AS bs ON bs.workspace_id = bw.id
    LEFT JOIN public.booking_settings AS bset ON bset.workspace_id = bw.id
   WHERE bw.slug = p_workspace_slug
     AND bw.active = true
     AND bs.id = p_service_id
     AND bs.active = true;

  IF v_workspace_id IS NULL OR v_service_duration IS NULL THEN
    RETURN v_result;
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM public.booking_professionals AS bp
      JOIN public.booking_professional_services AS bps
        ON bps.professional_id = bp.id
       AND bps.service_id = p_service_id
       AND bps.active = true
     WHERE bp.id = p_professional_id
       AND bp.workspace_id = v_workspace_id
       AND bp.active = true
  ) THEN
    RETURN v_result;
  END IF;

  WHILE v_current_date <= p_end_date LOOP
    FOR v_availability IN
      SELECT *
        FROM public.booking_availability AS ba
       WHERE ba.professional_id = p_professional_id
         AND ba.workspace_id = v_workspace_id
         AND ba.day_of_week = EXTRACT(DOW FROM v_current_date)
         AND ba.active = true
    LOOP
      IF NOT EXISTS (
        SELECT 1
          FROM public.booking_blocked_slots AS bbs
         WHERE bbs.professional_id = p_professional_id
           AND bbs.workspace_id = v_workspace_id
           AND v_current_date BETWEEN bbs.start_date AND bbs.end_date
      ) THEN
        v_slot_start := v_availability.start_time;
        WHILE v_slot_start + (v_service_duration || ' minutes')::interval <= v_availability.end_time LOOP
          v_slot_end := (v_slot_start + (v_service_duration || ' minutes')::interval)::time;

          IF NOT (
            v_availability.break_start_time IS NOT NULL
            AND v_availability.break_end_time IS NOT NULL
            AND v_slot_start < v_availability.break_end_time
            AND v_slot_end > v_availability.break_start_time
          ) AND NOT public.check_booking_conflict(
            p_professional_id,
            v_current_date,
            v_slot_start,
            v_slot_end
          ) THEN
            v_result := v_result || jsonb_build_object(
              'date', v_current_date,
              'start_time', v_slot_start,
              'end_time', v_slot_end,
              'available', true,
              'professional_id', p_professional_id,
              'service_id', p_service_id
            );
          END IF;

          v_slot_start := (v_slot_start + (v_slot_duration || ' minutes')::interval)::time;
        END LOOP;
      END IF;
    END LOOP;

    v_current_date := v_current_date + 1;
  END LOOP;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_workspace_stats(p_workspace_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.has_workspace_access(p_workspace_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  RETURN jsonb_build_object(
    'total_appointments', (SELECT COUNT(*) FROM public.booking_appointments WHERE workspace_id = p_workspace_id),
    'pending_appointments', (SELECT COUNT(*) FROM public.booking_appointments WHERE workspace_id = p_workspace_id AND status = 'pending'),
    'confirmed_appointments', (SELECT COUNT(*) FROM public.booking_appointments WHERE workspace_id = p_workspace_id AND status = 'confirmed'),
    'completed_appointments', (SELECT COUNT(*) FROM public.booking_appointments WHERE workspace_id = p_workspace_id AND status = 'completed'),
    'cancelled_appointments', (SELECT COUNT(*) FROM public.booking_appointments WHERE workspace_id = p_workspace_id AND status = 'cancelled'),
    'no_show_appointments', (SELECT COUNT(*) FROM public.booking_appointments WHERE workspace_id = p_workspace_id AND status = 'no_show'),
    'total_clients', (SELECT COUNT(*) FROM public.booking_clients WHERE workspace_id = p_workspace_id),
    'total_revenue', COALESCE((SELECT SUM(payment_amount) FROM public.booking_appointments WHERE workspace_id = p_workspace_id AND payment_status = 'paid'), 0),
    'active_services', (SELECT COUNT(*) FROM public.booking_services WHERE workspace_id = p_workspace_id AND active = true),
    'active_professionals', (SELECT COUNT(*) FROM public.booking_professionals WHERE workspace_id = p_workspace_id AND active = true),
    'occupancy_rate', COALESCE((SELECT ROUND((COUNT(*) FILTER (WHERE status IN ('confirmed', 'completed'))::numeric / NULLIF(COUNT(*), 0) * 100), 2) FROM public.booking_appointments WHERE workspace_id = p_workspace_id), 0),
    'cancellation_rate', COALESCE((SELECT ROUND((COUNT(*) FILTER (WHERE status = 'cancelled')::numeric / NULLIF(COUNT(*), 0) * 100), 2) FROM public.booking_appointments WHERE workspace_id = p_workspace_id), 0),
    'no_show_rate', COALESCE((SELECT ROUND((COUNT(*) FILTER (WHERE status = 'no_show')::numeric / NULLIF(COUNT(*), 0) * 100), 2) FROM public.booking_appointments WHERE workspace_id = p_workspace_id), 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_no_show(p_appointment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_workspace_id UUID;
  v_status VARCHAR(20);
  v_client_id UUID;
BEGIN
  SELECT workspace_id, status, client_id
    INTO v_workspace_id, v_status, v_client_id
    FROM public.booking_appointments
   WHERE id = p_appointment_id;

  IF v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;
  IF NOT public.has_workspace_access(v_workspace_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  IF v_status NOT IN ('confirmed', 'in_progress') THEN
    RAISE EXCEPTION 'Cannot mark as no-show: appointment status is %', v_status;
  END IF;

  UPDATE public.booking_appointments
     SET status = 'no_show', cancelled_at = NOW(), updated_at = NOW()
   WHERE id = p_appointment_id;

  IF v_client_id IS NOT NULL THEN
    UPDATE public.booking_clients
       SET no_show_count = no_show_count + 1, updated_at = NOW()
     WHERE id = v_client_id;
  END IF;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.start_booking(p_appointment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_workspace_id UUID;
  v_status VARCHAR(20);
BEGIN
  SELECT workspace_id, status
    INTO v_workspace_id, v_status
    FROM public.booking_appointments
   WHERE id = p_appointment_id;

  IF v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;
  IF NOT public.has_workspace_access(v_workspace_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  IF v_status <> 'confirmed' THEN
    RAISE EXCEPTION 'Cannot start appointment with status: %', v_status;
  END IF;

  UPDATE public.booking_appointments
     SET status = 'in_progress', updated_at = NOW()
   WHERE id = p_appointment_id;

  RETURN true;
END;
$$;

ALTER FUNCTION public.is_workspace_owner(UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.has_workspace_access(UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_profile_id() SET search_path = public, pg_temp;
ALTER FUNCTION public.check_booking_conflict(UUID, DATE, TIME, TIME, UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_confirmation_code() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_client_stats(UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_booking(VARCHAR, VARCHAR, VARCHAR, VARCHAR, UUID, UUID, DATE, TIME, TEXT) SET search_path = public, pg_temp;
ALTER FUNCTION public.confirm_booking(UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.cancel_booking(UUID, TEXT) SET search_path = public, pg_temp;
ALTER FUNCTION public.reschedule_booking(UUID, DATE, TIME) SET search_path = public, pg_temp;
ALTER FUNCTION public.start_booking(UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.complete_booking(UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_booking_workspace(VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR, VARCHAR) SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.create_booking(VARCHAR, VARCHAR, VARCHAR, VARCHAR, UUID, UUID, DATE, TIME, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking(VARCHAR, VARCHAR, VARCHAR, VARCHAR, UUID, UUID, DATE, TIME, TEXT) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.get_available_slots(VARCHAR, UUID, UUID, DATE, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_available_slots(VARCHAR, UUID, UUID, DATE, DATE) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.check_availability(VARCHAR, UUID, UUID, DATE, TIME) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_availability(VARCHAR, UUID, UUID, DATE, TIME) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.get_workspace_stats(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_workspace_stats(UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.mark_no_show(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_no_show(UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.start_booking(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_booking(UUID) TO authenticated;
