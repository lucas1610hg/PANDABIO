-- =============================================================
-- PANDABIO — MÓDULO AGENDAMENTOS: FUNÇÕES RPC
-- Versão: 1.0
-- Data: 2026-09-21
-- Descrição: Funções RPC para operações complexas de agendamento
-- =============================================================

-- ============================================
-- FUNÇÕES RPC PÚBLICAS (RESERVAS)
-- ============================================

-- RPC: Criar novo agendamento (reserva pública)
CREATE OR REPLACE FUNCTION create_booking(
  p_workspace_slug VARCHAR(50),
  p_client_name VARCHAR(100),
  p_client_email VARCHAR(255),
  p_client_phone VARCHAR(20),
  p_service_id UUID,
  p_professional_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id UUID;
  v_profile_id UUID;
  v_service_duration INTEGER;
  v_service_price DECIMAL(10, 2);
  v_service_name VARCHAR(100);
  v_professional_name VARCHAR(100);
  v_end_time TIME;
  v_client_id UUID;
  v_availability_check JSONB;
  v_appointment_id UUID;
  v_confirmation_code VARCHAR(20);
BEGIN
  -- Verificar workspace
  SELECT id, profile_id INTO v_workspace_id, v_profile_id
  FROM booking_workspaces
  WHERE slug = p_workspace_slug AND active = true;
  
  IF v_workspace_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Workspace not found or inactive');
  END IF;
  
  -- Verificar disponibilidade
  SELECT check_availability(
    p_workspace_slug,
    p_service_id,
    p_professional_id,
    p_date,
    p_start_time
  ) INTO v_availability_check;
  
  IF (v_availability_check->>'available')::BOOLEAN = false THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', v_availability_check->>'error'
    );
  END IF;
  
  -- Obter dados do serviço
  SELECT duration, price, name INTO v_service_duration, v_service_price, v_service_name
  FROM booking_services
  WHERE id = p_service_id AND workspace_id = v_workspace_id AND active = true;
  
  IF v_service_duration IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Service not found or inactive');
  END IF;
  
  -- Obter nome do profissional
  SELECT name INTO v_professional_name
  FROM booking_professionals
  WHERE id = p_professional_id AND workspace_id = v_workspace_id AND active = true;
  
  IF v_professional_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Professional not found or inactive');
  END IF;
  
  -- Calcular horário de término
  v_end_time := (p_start_time::time + (v_service_duration || ' minutes')::interval)::time;
  
  -- Verificar conflito (bloqueio pessimista)
  IF check_booking_conflict(p_professional_id, p_date, p_start_time, v_end_time) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Time slot already booked');
  END IF;
  
  -- Criar ou buscar cliente
  SELECT id INTO v_client_id
  FROM booking_clients
  WHERE workspace_id = v_workspace_id
    AND (email = p_client_email OR phone = p_client_phone)
    AND name = p_client_name
  LIMIT 1;
  
  IF v_client_id IS NULL THEN
    INSERT INTO booking_clients (
      workspace_id, profile_id, name, email, phone
    ) VALUES (
      v_workspace_id, v_profile_id, p_client_name, p_client_email, p_client_phone
    ) RETURNING id INTO v_client_id;
  END IF;
  
  -- Gerar código de confirmação
  v_confirmation_code := generate_confirmation_code();
  
  -- Criar agendamento
  INSERT INTO booking_appointments (
    workspace_id,
    profile_id,
    client_id,
    professional_id,
    service_id,
    date,
    start_time,
    end_time,
    service_name,
    service_duration,
    service_price,
    professional_name,
    status,
    notes,
    confirmation_code
  ) VALUES (
    v_workspace_id,
    v_profile_id,
    v_client_id,
    p_professional_id,
    p_service_id,
    p_date,
    p_start_time,
    v_end_time,
    v_service_name,
    v_service_duration,
    v_service_price,
    v_professional_name,
    'pending',
    p_notes,
    v_confirmation_code
  ) RETURNING id INTO v_appointment_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'appointment_id', v_appointment_id,
    'confirmation_code', v_confirmation_code,
    'end_time', v_end_time,
    'duration', v_service_duration,
    'price', v_service_price
  );
EXCEPTION
  WHEN exclusion_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Time slot already booked');
END;
$$;

-- ============================================
-- FUNÇÕES RPC INTERNAS (GESTÃO)
-- ============================================

-- RPC: Confirmar agendamento
CREATE OR REPLACE FUNCTION confirm_booking(p_appointment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id UUID;
  v_status VARCHAR(20);
BEGIN
  -- Verificar se agendamento existe e obter workspace
  SELECT workspace_id, status INTO v_workspace_id, v_status
  FROM booking_appointments
  WHERE id = p_appointment_id;
  
  IF v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;
  
  -- Verificar permissão
  IF NOT has_workspace_access(v_workspace_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  -- Verificar se pode confirmar
  IF v_status NOT IN ('pending', 'expired') THEN
    RAISE EXCEPTION 'Cannot confirm appointment with status: %', v_status;
  END IF;
  
  -- Confirmar agendamento
  UPDATE booking_appointments
  SET 
    status = 'confirmed',
    confirmed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_appointment_id;
  
  -- Criar notificação de confirmação
  INSERT INTO booking_notifications (
    workspace_id,
    profile_id,
    appointment_id,
    type,
    status,
    scheduled_for
  )
  SELECT
    ba.workspace_id,
    ba.profile_id,
    ba.id,
    'confirmation',
    'pending',
    NOW() + (settings.reminder_hours[1] || ' hours')::interval
  FROM booking_appointments ba
  JOIN booking_settings settings ON settings.workspace_id = ba.workspace_id
  WHERE ba.id = p_appointment_id;
  
  RETURN true;
END;
$$;

-- RPC: Cancelar agendamento
CREATE OR REPLACE FUNCTION cancel_booking(
  p_appointment_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id UUID;
  v_status VARCHAR(20);
  v_date DATE;
  v_cancellation_hours INTEGER;
BEGIN
  -- Verificar se agendamento existe
  SELECT workspace_id, status, date INTO v_workspace_id, v_status, v_date
  FROM booking_appointments
  WHERE id = p_appointment_id;
  
  IF v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;
  
  -- Verificar permissão
  IF NOT has_workspace_access(v_workspace_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  -- Verificar se pode cancelar
  IF v_status IN ('completed', 'cancelled', 'no_show') THEN
    RAISE EXCEPTION 'Cannot cancel appointment with status: %', v_status;
  END IF;
  
  -- Verificar política de cancelamento
  SELECT cancellation_hours INTO v_cancellation_hours
  FROM booking_settings
  WHERE workspace_id = v_workspace_id;
  
  IF v_cancellation_hours > 0 AND v_date > NOW()::date THEN
    -- Calcular horas até o agendamento
    IF EXTRACT(EPOCH FROM (v_date::timestamp - NOW())) / 3600 < v_cancellation_hours THEN
      RAISE EXCEPTION 'Cannot cancel: less than % hours before appointment', v_cancellation_hours;
    END IF;
  END IF;
  
  -- Cancelar agendamento
  UPDATE booking_appointments
  SET 
    status = 'cancelled',
    cancelled_at = NOW(),
    updated_at = NOW(),
    internal_notes = COALESCE(internal_notes, '') || 
      CASE WHEN p_reason IS NOT NULL THEN 
        'Cancellation reason: ' || p_reason 
      ELSE '' 
      END
  WHERE id = p_appointment_id;
  
  -- Criar notificação de cancelação
  INSERT INTO booking_notifications (
    workspace_id,
    profile_id,
    appointment_id,
    type,
    status,
    scheduled_for
  )
  SELECT
    ba.workspace_id,
    ba.profile_id,
    ba.id,
    'cancellation',
    'pending',
    NOW()
  FROM booking_appointments ba
  WHERE ba.id = p_appointment_id;
  
  RETURN true;
END;
$$;

-- RPC: Listar slots disponíveis
CREATE OR REPLACE FUNCTION get_available_slots(
  p_workspace_slug VARCHAR(50),
  p_service_id UUID,
  p_professional_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id UUID;
  v_service_duration INTEGER;
  v_settings RECORD;
  v_result JSONB := jsonb_build_array();
  v_current_date DATE;
  v_availability RECORD;
  v_slot_start TIME;
  v_slot_end TIME;
  v_is_available BOOLEAN;
BEGIN
  -- Verificar workspace
  SELECT id INTO v_workspace_id
  FROM booking_workspaces
  WHERE slug = p_workspace_slug AND active = true;
  
  IF v_workspace_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Workspace not found');
  END IF;
  
  -- Obter configurações
  SELECT * INTO v_settings
  FROM booking_settings
  WHERE workspace_id = v_workspace_id;
  
  -- Obter duração do serviço
  SELECT duration INTO v_service_duration
  FROM booking_services
  WHERE id = p_service_id AND workspace_id = v_workspace_id AND active = true;
  
  IF v_service_duration IS NULL THEN
    RETURN jsonb_build_object('error', 'Service not found or inactive');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM booking_professionals
    WHERE id = p_professional_id
      AND workspace_id = v_workspace_id
      AND active = true
  ) THEN
    RETURN jsonb_build_object('error', 'Professional not found or inactive');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM booking_professional_services
    WHERE professional_id = p_professional_id
      AND service_id = p_service_id
      AND workspace_id = v_workspace_id
      AND active = true
  ) THEN
    RETURN jsonb_build_object('error', 'Service is not assigned to professional');
  END IF;
  
  -- Iterar pelos dias
  v_current_date := p_start_date;
  WHILE v_current_date <= p_end_date LOOP
    -- Verificar dia da semana e disponibilidade
    SELECT * INTO v_availability
    FROM booking_availability
    WHERE professional_id = p_professional_id
      AND day_of_week = EXTRACT(DOW FROM v_current_date)
      AND active = true;
    
    IF v_availability.id IS NOT NULL THEN
      -- Verificar bloqueios
      IF NOT EXISTS (
        SELECT 1 FROM booking_blocked_slots
        WHERE professional_id = p_professional_id
          AND v_current_date BETWEEN start_date AND end_date
      ) THEN
        -- Gerar slots de 30 em 30 minutos (ou conforme configuração)
        v_slot_start := v_availability.start_time;
        WHILE v_slot_start + (v_service_duration || ' minutes')::interval <= v_availability.end_time LOOP
          v_slot_end := (v_slot_start::time + (v_service_duration || ' minutes')::interval)::time;
          
          -- Verificar pausa
          IF NOT (
            v_availability.break_start_time IS NOT NULL AND
            v_availability.break_end_time IS NOT NULL AND
            v_slot_start < v_availability.break_end_time AND
            v_slot_end > v_availability.break_start_time
          ) THEN
            -- Verificar conflito
            v_is_available := NOT check_booking_conflict(
              p_professional_id,
              v_current_date,
              v_slot_start,
              v_slot_end
            );
            
            IF v_is_available THEN
              v_result := v_result || jsonb_build_object(
                'date', v_current_date,
                'start_time', v_slot_start,
                'end_time', v_slot_end,
                'available', true
              );
            END IF;
          END IF;
          
          -- Avançar para próximo slot
          v_slot_start := (v_slot_start::time + (COALESCE(v_settings.default_slot_duration, 30) || ' minutes')::interval)::time;
        END LOOP;
      END IF;
    END IF;
    
    v_current_date := v_current_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN v_result;
END;
$$;

-- RPC: Obter estatísticas do workspace
CREATE OR REPLACE FUNCTION get_workspace_stats(p_workspace_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats JSONB;
BEGIN
  -- Verificar permissão
  IF NOT has_workspace_access(p_workspace_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  SELECT jsonb_build_object(
    'total_appointments', COALESCE((
      SELECT COUNT(*) FROM booking_appointments 
      WHERE workspace_id = p_workspace_id
    ), 0),
    'pending_appointments', COALESCE((
      SELECT COUNT(*) FROM booking_appointments 
      WHERE workspace_id = p_workspace_id AND status = 'pending'
    ), 0),
    'confirmed_appointments', COALESCE((
      SELECT COUNT(*) FROM booking_appointments 
      WHERE workspace_id = p_workspace_id AND status = 'confirmed'
    ), 0),
    'completed_appointments', COALESCE((
      SELECT COUNT(*) FROM booking_appointments 
      WHERE workspace_id = p_workspace_id AND status = 'completed'
    ), 0),
    'cancelled_appointments', COALESCE((
      SELECT COUNT(*) FROM booking_appointments 
      WHERE workspace_id = p_workspace_id AND status = 'cancelled'
    ), 0),
    'no_show_appointments', COALESCE((
      SELECT COUNT(*) FROM booking_appointments 
      WHERE workspace_id = p_workspace_id AND status = 'no_show'
    ), 0),
    'total_clients', COALESCE((
      SELECT COUNT(*) FROM booking_clients 
      WHERE workspace_id = p_workspace_id
    ), 0),
    'total_revenue', COALESCE((
      SELECT COALESCE(SUM(payment_amount), 0) FROM booking_appointments 
      WHERE workspace_id = p_workspace_id AND payment_status = 'paid'
    ), 0),
    'active_services', COALESCE((
      SELECT COUNT(*) FROM booking_services 
      WHERE workspace_id = p_workspace_id AND active = true
    ), 0),
    'active_professionals', COALESCE((
      SELECT COUNT(*) FROM booking_professionals 
      WHERE workspace_id = p_workspace_id AND active = true
    ), 0),
    'occupancy_rate', COALESCE((
      SELECT CASE 
        WHEN COUNT(*) > 0 THEN 
          ROUND((COUNT(*) FILTER (WHERE status IN ('confirmed', 'completed'))::FLOAT / COUNT(*) * 100), 2)
        ELSE 0 
      END 
      FROM booking_appointments 
      WHERE workspace_id = p_workspace_id
    ), 0),
    'cancellation_rate', COALESCE((
      SELECT CASE 
        WHEN COUNT(*) > 0 THEN 
          ROUND((COUNT(*) FILTER (WHERE status = 'cancelled')::FLOAT / COUNT(*) * 100), 2)
        ELSE 0 
      END 
      FROM booking_appointments 
      WHERE workspace_id = p_workspace_id
    ), 0),
    'no_show_rate', COALESCE((
      SELECT CASE 
        WHEN COUNT(*) > 0 THEN 
          ROUND((COUNT(*) FILTER (WHERE status = 'no_show')::FLOAT / COUNT(*) * 100), 2)
        ELSE 0 
      END 
      FROM booking_appointments 
      WHERE workspace_id = p_workspace_id
    ), 0)
  ) INTO v_stats;
  
  RETURN v_stats;
END;
$$;

-- RPC: Reagendar agendamento
CREATE OR REPLACE FUNCTION reschedule_booking(
  p_appointment_id UUID,
  p_new_date DATE,
  p_new_start_time TIME
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id UUID;
  v_service_id UUID;
  v_professional_id UUID;
  v_service_duration INTEGER;
  v_new_end_time TIME;
  v_status VARCHAR(20);
BEGIN
  -- Obter dados do agendamento
  SELECT workspace_id, service_id, professional_id, status
  INTO v_workspace_id, v_service_id, v_professional_id, v_status
  FROM booking_appointments
  WHERE id = p_appointment_id;
  
  IF v_workspace_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Appointment not found');
  END IF;
  
  -- Verificar permissão
  IF NOT has_workspace_access(v_workspace_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;
  
  -- Verificar se pode reagendar
  IF v_status IN ('completed', 'cancelled', 'no_show') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot reschedule completed/cancelled appointment');
  END IF;
  
  -- Obter duração do serviço
  SELECT duration INTO v_service_duration
  FROM booking_services
  WHERE id = v_service_id;
  
  IF v_service_duration IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Service not found');
  END IF;
  
  -- Calcular novo horário de término
  v_new_end_time := (p_new_start_time::time + (v_service_duration || ' minutes')::interval)::time;
  
  -- Verificar disponibilidade
  IF check_booking_conflict(v_professional_id, p_new_date, p_new_start_time, v_new_end_time, p_appointment_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'New time slot not available');
  END IF;
  
  -- Atualizar agendamento
  UPDATE booking_appointments
  SET 
    date = p_new_date,
    start_time = p_new_start_time,
    end_time = v_new_end_time,
    updated_at = NOW()
  WHERE id = p_appointment_id;
  
  -- Registrar no audit log
  INSERT INTO booking_audit_log (
    workspace_id,
    profile_id,
    entity_type,
    entity_id,
    action,
    old_values,
    new_values,
    changed_by
  )
  SELECT
    workspace_id,
    profile_id,
    'appointment',
    id,
    'rescheduled',
    jsonb_build_object('date', date, 'start_time', start_time),
    jsonb_build_object('date', p_new_date, 'start_time', p_new_start_time),
    auth.uid()
  FROM booking_appointments
  WHERE id = p_appointment_id;
  
  -- Criar notificação de reagendamento
  INSERT INTO booking_notifications (
    workspace_id,
    profile_id,
    appointment_id,
    type,
    status,
    scheduled_for
  )
  SELECT
    ba.workspace_id,
    ba.profile_id,
    ba.id,
    'reschedule',
    'pending',
    NOW()
  FROM booking_appointments ba
  WHERE ba.id = p_appointment_id;
  
  RETURN jsonb_build_object('success', true, 'end_time', v_new_end_time);
END;
$$;

-- ============================================
-- FUNÇÕES DE UTILIDADE
-- ============================================

-- Função para marcar no-show
CREATE OR REPLACE FUNCTION mark_no_show(p_appointment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id UUID;
  v_status VARCHAR(20);
  v_client_id UUID;
BEGIN
  SELECT workspace_id, status, client_id INTO v_workspace_id, v_status, v_client_id
  FROM booking_appointments
  WHERE id = p_appointment_id;
  
  IF v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;
  
  IF NOT has_workspace_access(v_workspace_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  IF v_status NOT IN ('confirmed', 'in_progress') THEN
    RAISE EXCEPTION 'Cannot mark as no-show: appointment status is %', v_status;
  END IF;
  
  UPDATE booking_appointments
  SET 
    status = 'no_show',
    cancelled_at = NOW(),
    updated_at = NOW()
  WHERE id = p_appointment_id;
  
  -- Incrementar contador de no-show do cliente
  IF v_client_id IS NOT NULL THEN
    UPDATE booking_clients
    SET 
      no_show_count = no_show_count + 1,
      updated_at = NOW()
    WHERE id = v_client_id;
  END IF;
  
  RETURN true;
END;
$$;

-- Função para completar agendamento
CREATE OR REPLACE FUNCTION start_booking(p_appointment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id UUID;
  v_status VARCHAR(20);
BEGIN
  SELECT workspace_id, status
    INTO v_workspace_id, v_status
    FROM booking_appointments
   WHERE id = p_appointment_id;

  IF v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;
  IF NOT has_workspace_access(v_workspace_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  IF v_status <> 'confirmed' THEN
    RAISE EXCEPTION 'Cannot start appointment with status: %', v_status;
  END IF;

  UPDATE booking_appointments
     SET status = 'in_progress', updated_at = NOW()
   WHERE id = p_appointment_id;

  RETURN true;
END;
$$;

-- Função para completar agendamento
CREATE OR REPLACE FUNCTION complete_booking(p_appointment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id UUID;
  v_status VARCHAR(20);
  v_payment_status VARCHAR(20);
  v_payment_amount DECIMAL(10, 2);
BEGIN
  SELECT workspace_id, status, payment_status, payment_amount
  INTO v_workspace_id, v_status, v_payment_status, v_payment_amount
  FROM booking_appointments
  WHERE id = p_appointment_id;
  
  IF v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;
  
  IF NOT has_workspace_access(v_workspace_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  IF v_status NOT IN ('confirmed', 'in_progress') THEN
    RAISE EXCEPTION 'Cannot complete appointment with status: %', v_status;
  END IF;
  
  -- Se não foi pago, marcar como pendente
  IF v_payment_status = 'pending' THEN
    UPDATE booking_appointments
    SET 
      status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_appointment_id;
  ELSE
    UPDATE booking_appointments
    SET 
      status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_appointment_id;
  END IF;
  
  RETURN true;
END;
$$;

-- ============================================
-- VALIDAÇÃO FINAL
-- ============================================

DO $$
DECLARE
  _func_name text;
  _rpc_functions text[] := ARRAY[
    'create_booking', 'confirm_booking', 'cancel_booking',
    'get_available_slots', 'get_workspace_stats', 'reschedule_booking',
    'mark_no_show', 'start_booking', 'complete_booking'
  ];
BEGIN
  -- Verificar se todas as funções RPC foram criadas
  FOREACH _func_name IN ARRAY _rpc_functions
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = _func_name 
        AND pronamespace = 'public'::regnamespace
    ) THEN
      RAISE EXCEPTION 'FALHA: Função RPC % não encontrada', _func_name;
    END IF;
    
    RAISE NOTICE '  ✓ RPC function: %', _func_name;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '✓ Todas as funções RPC criadas com sucesso';
  RAISE NOTICE '✓ Pronto para integração com frontend';
  RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;

REVOKE ALL ON FUNCTION public.create_booking(VARCHAR, VARCHAR, VARCHAR, VARCHAR, UUID, UUID, DATE, TIME, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking(VARCHAR, VARCHAR, VARCHAR, VARCHAR, UUID, UUID, DATE, TIME, TEXT) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.confirm_booking(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_booking(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.cancel_booking(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_booking(UUID, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.get_available_slots(VARCHAR, UUID, UUID, DATE, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_available_slots(VARCHAR, UUID, UUID, DATE, DATE) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_workspace_stats(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_workspace_stats(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.reschedule_booking(UUID, DATE, TIME) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reschedule_booking(UUID, DATE, TIME) TO authenticated;

REVOKE ALL ON FUNCTION public.mark_no_show(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_no_show(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.complete_booking(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_booking(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.start_booking(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_booking(UUID) TO authenticated;
