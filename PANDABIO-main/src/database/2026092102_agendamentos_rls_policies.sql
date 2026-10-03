-- =============================================================
-- PANDABIO — MÓDULO AGENDAMENTOS: POLÍTICAS RLS
-- Versão: 1.0
-- Data: 2026-09-21
-- Descrição: Row Level Security para tabelas de agendamentos
-- =============================================================

-- ============================================
-- FUNÇÕES AUXILIARES DE AUTENTICAÇÃO
-- ============================================

-- Função para verificar se usuário é dono do workspace
CREATE OR REPLACE FUNCTION is_workspace_owner(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  workspace_profile_id UUID;
BEGIN
  SELECT profile_id INTO workspace_profile_id
  FROM booking_workspaces
  WHERE id = p_workspace_id;
  
  RETURN workspace_profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  );
END;
$$;

-- Função para verificar se usuário tem acesso ao workspace (dono ou membro)
CREATE OR REPLACE FUNCTION has_workspace_access(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Por enquanto, apenas o dono tem acesso
  -- Futuramente: verificar tabela de membros do workspace
  RETURN is_workspace_owner(p_workspace_id);
END;
$$;

-- Função para obter profile_id do usuário autenticado
CREATE OR REPLACE FUNCTION get_user_profile_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_profile_id UUID;
BEGIN
  SELECT id INTO user_profile_id
  FROM profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN user_profile_id;
END;
$$;

-- ============================================
-- RLS POLICIES POR TABELA
-- ============================================

-- ============================================
-- BOOKING_WORKSPACES
-- ============================================

ALTER TABLE booking_workspaces ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seus próprios workspaces
CREATE POLICY "Users can view own workspaces" ON booking_workspaces
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id));

-- Usuários podem inserir seus próprios workspaces
CREATE POLICY "Users can insert own workspaces" ON booking_workspaces
  FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id));

-- Usuários podem atualizar seus próprios workspaces
CREATE POLICY "Users can update own workspaces" ON booking_workspaces
  FOR UPDATE USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id));

-- Usuários podem deletar seus próprios workspaces
CREATE POLICY "Users can delete own workspaces" ON booking_workspaces
  FOR DELETE USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id));

-- ============================================
-- BOOKING_SETTINGS
-- ============================================

ALTER TABLE booking_settings ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver configurações de seus workspaces
CREATE POLICY "Users can view own settings" ON booking_settings
  FOR SELECT USING (has_workspace_access(workspace_id));

-- Usuários podem inserir configurações para seus workspaces
CREATE POLICY "Users can insert own settings" ON booking_settings
  FOR INSERT WITH CHECK (has_workspace_access(workspace_id));

-- Usuários podem atualizar configurações de seus workspaces
CREATE POLICY "Users can update own settings" ON booking_settings
  FOR UPDATE USING (has_workspace_access(workspace_id));

-- Usuários podem deletar configurações de seus workspaces
CREATE POLICY "Users can delete own settings" ON booking_settings
  FOR DELETE USING (has_workspace_access(workspace_id));

-- ============================================
-- BOOKING_SERVICES
-- ============================================

ALTER TABLE booking_services ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver serviços de seus workspaces
CREATE POLICY "Users can view own services" ON booking_services
  FOR SELECT USING (has_workspace_access(workspace_id));

-- Usuários podem inserir serviços em seus workspaces
CREATE POLICY "Users can insert own services" ON booking_services
  FOR INSERT WITH CHECK (has_workspace_access(workspace_id));

-- Usuários podem atualizar serviços de seus workspaces
CREATE POLICY "Users can update own services" ON booking_services
  FOR UPDATE USING (has_workspace_access(workspace_id));

-- Usuários podem deletar serviços de seus workspaces
CREATE POLICY "Users can delete own services" ON booking_services
  FOR DELETE USING (has_workspace_access(workspace_id));

-- ============================================
-- BOOKING_PROFESSIONALS
-- ============================================

ALTER TABLE booking_professionals ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver profissionais de seus workspaces
CREATE POLICY "Users can view own professionals" ON booking_professionals
  FOR SELECT USING (has_workspace_access(workspace_id));

-- Usuários podem inserir profissionais em seus workspaces
CREATE POLICY "Users can insert own professionals" ON booking_professionals
  FOR INSERT WITH CHECK (has_workspace_access(workspace_id));

-- Usuários podem atualizar profissionais de seus workspaces
CREATE POLICY "Users can update own professionals" ON booking_professionals
  FOR UPDATE USING (has_workspace_access(workspace_id));

-- Usuários podem deletar profissionais de seus workspaces
CREATE POLICY "Users can delete own professionals" ON booking_professionals
  FOR DELETE USING (has_workspace_access(workspace_id));

-- ============================================
-- BOOKING_PROFESSIONAL_SERVICES
-- ============================================

ALTER TABLE booking_professional_services ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver relações de seus workspaces
CREATE POLICY "Users can view own professional_services" ON booking_professional_services
  FOR SELECT USING (has_workspace_access(workspace_id));

-- Usuários podem inserir relações em seus workspaces
CREATE POLICY "Users can insert own professional_services" ON booking_professional_services
  FOR INSERT WITH CHECK (has_workspace_access(workspace_id));

-- Usuários podem atualizar relações de seus workspaces
CREATE POLICY "Users can update own professional_services" ON booking_professional_services
  FOR UPDATE USING (has_workspace_access(workspace_id));

-- Usuários podem deletar relações de seus workspaces
CREATE POLICY "Users can delete own professional_services" ON booking_professional_services
  FOR DELETE USING (has_workspace_access(workspace_id));

-- ============================================
-- BOOKING_AVAILABILITY
-- ============================================

ALTER TABLE booking_availability ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver disponibilidade de seus workspaces
CREATE POLICY "Users can view own availability" ON booking_availability
  FOR SELECT USING (has_workspace_access(workspace_id));

-- Usuários podem inserir disponibilidade em seus workspaces
CREATE POLICY "Users can insert own availability" ON booking_availability
  FOR INSERT WITH CHECK (has_workspace_access(workspace_id));

-- Usuários podem atualizar disponibilidade de seus workspaces
CREATE POLICY "Users can update own availability" ON booking_availability
  FOR UPDATE USING (has_workspace_access(workspace_id));

-- Usuários podem deletar disponibilidade de seus workspaces
CREATE POLICY "Users can delete own availability" ON booking_availability
  FOR DELETE USING (has_workspace_access(workspace_id));

-- ============================================
-- BOOKING_BLOCKED_SLOTS
-- ============================================

ALTER TABLE booking_blocked_slots ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver bloqueios de seus workspaces
CREATE POLICY "Users can view own blocked_slots" ON booking_blocked_slots
  FOR SELECT USING (has_workspace_access(workspace_id));

-- Usuários podem inserir bloqueios em seus workspaces
CREATE POLICY "Users can insert own blocked_slots" ON booking_blocked_slots
  FOR INSERT WITH CHECK (has_workspace_access(workspace_id));

-- Usuários podem atualizar bloqueios de seus workspaces
CREATE POLICY "Users can update own blocked_slots" ON booking_blocked_slots
  FOR UPDATE USING (has_workspace_access(workspace_id));

-- Usuários podem deletar bloqueios de seus workspaces
CREATE POLICY "Users can delete own blocked_slots" ON booking_blocked_slots
  FOR DELETE USING (has_workspace_access(workspace_id));

-- ============================================
-- BOOKING_CLIENTS
-- ============================================

ALTER TABLE booking_clients ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver clientes de seus workspaces
CREATE POLICY "Users can view own clients" ON booking_clients
  FOR SELECT USING (has_workspace_access(workspace_id));

-- Usuários podem inserir clientes em seus workspaces
CREATE POLICY "Users can insert own clients" ON booking_clients
  FOR INSERT WITH CHECK (has_workspace_access(workspace_id));

-- Usuários podem atualizar clientes de seus workspaces
CREATE POLICY "Users can update own clients" ON booking_clients
  FOR UPDATE USING (has_workspace_access(workspace_id));

-- Usuários podem deletar clientes de seus workspaces
CREATE POLICY "Users can delete own clients" ON booking_clients
  FOR DELETE USING (has_workspace_access(workspace_id));

-- ============================================
-- BOOKING_APPOINTMENTS
-- ============================================

ALTER TABLE booking_appointments ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver agendamentos de seus workspaces
CREATE POLICY "Users can view own appointments" ON booking_appointments
  FOR SELECT USING (has_workspace_access(workspace_id));

-- Usuários podem inserir agendamentos em seus workspaces
CREATE POLICY "Users can insert own appointments" ON booking_appointments
  FOR INSERT WITH CHECK (
    has_workspace_access(workspace_id) AND
    NOT check_booking_conflict(professional_id, date, start_time, end_time)
  );

-- Usuários podem atualizar agendamentos de seus workspaces
CREATE POLICY "Users can update own appointments" ON booking_appointments
  FOR UPDATE USING (
    has_workspace_access(workspace_id) AND
    -- Permitir atualização se não criar conflito (exceto se cancelado)
    (
      status IN ('cancelled', 'no_show', 'expired') OR
      NOT check_booking_conflict(professional_id, date, start_time, end_time, id)
    )
  );

-- Usuários podem deletar agendamentos de seus workspaces
CREATE POLICY "Users can delete own appointments" ON booking_appointments
  FOR DELETE USING (has_workspace_access(workspace_id));

-- ============================================
-- BOOKING_AUDIT_LOG
-- ============================================

ALTER TABLE booking_audit_log ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver audit log de seus workspaces
CREATE POLICY "Users can view own audit_log" ON booking_audit_log
  FOR SELECT USING (has_workspace_access(workspace_id));

-- Sistema pode inserir audit log
CREATE POLICY "Service can insert audit_log" ON booking_audit_log
  FOR INSERT WITH CHECK (true);

-- ============================================
-- BOOKING_NOTIFICATIONS
-- ============================================

ALTER TABLE booking_notifications ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver notificações de seus workspaces
CREATE POLICY "Users can view own notifications" ON booking_notifications
  FOR SELECT USING (has_workspace_access(workspace_id));

-- Usuários podem inserir notificações em seus workspaces
CREATE POLICY "Users can insert own notifications" ON booking_notifications
  FOR INSERT WITH CHECK (has_workspace_access(workspace_id));

-- Usuários podem atualizar notificações de seus workspaces
CREATE POLICY "Users can update own notifications" ON booking_notifications
  FOR UPDATE USING (has_workspace_access(workspace_id));

-- ============================================
-- VIEWS PÚBLICAS (PARA RESERVAS EXTERNAS)
-- ============================================

-- View pública de disponibilidade para consulta externa
CREATE OR REPLACE VIEW public_booking_availability AS
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
FROM booking_workspaces bw
JOIN booking_professionals bp ON bp.workspace_id = bw.id AND bp.active = true
JOIN booking_professional_services bps ON bps.professional_id = bp.id AND bps.active = true
JOIN booking_services bs ON bs.id = bps.service_id AND bs.active = true
JOIN booking_availability ba ON ba.professional_id = bp.id AND ba.active = true
WHERE bw.active = true;

GRANT SELECT ON public_booking_availability TO anon, authenticated;

-- ============================================
-- FUNÇÕES RPC PÚBLICAS SEGUROS
-- ============================================

-- Função RPC para verificar disponibilidade de horário
CREATE OR REPLACE FUNCTION check_availability(
  p_workspace_slug VARCHAR(50),
  p_service_id UUID,
  p_professional_id UUID,
  p_date DATE,
  p_start_time TIME
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_duration INTEGER;
  v_end_time TIME;
  is_available BOOLEAN;
  blocked BOOLEAN;
  day_available BOOLEAN;
  result JSONB;
BEGIN
  -- Obter duração do serviço
  SELECT duration INTO service_duration
  FROM booking_services
  WHERE id = p_service_id AND active = true;
  
  IF service_duration IS NULL THEN
    RETURN jsonb_build_object('available', false, 'error', 'Service not found or inactive');
  END IF;
  
  -- Calcular horário de término
  v_end_time := (p_start_time::time + (service_duration || ' minutes')::interval)::time;
  
  -- Verificar disponibilidade do dia da semana
  SELECT EXISTS(
    SELECT 1 FROM booking_availability AS ba
    WHERE ba.professional_id = p_professional_id
      AND ba.day_of_week = EXTRACT(DOW FROM p_date)
      AND ba.start_time <= p_start_time
      AND ba.end_time >= v_end_time
      AND ba.active = true
  ) INTO day_available;
  
  IF NOT day_available THEN
    RETURN jsonb_build_object('available', false, 'error', 'Not available on this day/time');
  END IF;
  
  -- Verificar bloqueios
  SELECT EXISTS(
    SELECT 1 FROM booking_blocked_slots
    WHERE professional_id = p_professional_id
      AND p_date BETWEEN start_date AND end_date
  ) INTO blocked;
  
  IF blocked THEN
    RETURN jsonb_build_object('available', false, 'error', 'Professional not available on this date');
  END IF;
  
  -- Verificar conflitos de agendamento
  SELECT NOT check_booking_conflict(p_professional_id, p_date, p_start_time, v_end_time)
  INTO is_available;
  
  result := jsonb_build_object(
    'available', is_available,
    'end_time', v_end_time,
    'duration', service_duration
  );
  
  RETURN result;
END;
$$;

-- ============================================
-- TRIGGERS PARA AUDITORIA AUTOMÁTICA
-- ============================================

-- Trigger para registrar criação de agendamento
CREATE OR REPLACE FUNCTION trg_appointment_audit_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO booking_audit_log (
    workspace_id,
    profile_id,
    entity_type,
    entity_id,
    action,
    new_values,
    changed_by
  )
  VALUES (
    NEW.workspace_id,
    NEW.profile_id,
    'appointment',
    NEW.id,
    'created',
    jsonb_build_object(
      'client_id', NEW.client_id,
      'professional_id', NEW.professional_id,
      'service_id', NEW.service_id,
      'date', NEW.date,
      'start_time', NEW.start_time,
      'end_time', NEW.end_time,
      'status', NEW.status
    ),
    auth.uid()
  );
  
  -- Atualizar estatísticas do cliente
  PERFORM update_client_stats(NEW.client_id);
  
  -- Gerar código de confirmação
  NEW.confirmation_code := generate_confirmation_code();
  
  RETURN NEW;
END;
$$;

-- Trigger para registrar alterações de status de agendamento
CREATE OR REPLACE FUNCTION trg_appointment_audit_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se mudou status, registrar no audit log
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
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
    VALUES (
      NEW.workspace_id,
      NEW.profile_id,
      'appointment',
      NEW.id,
      'status_changed',
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      auth.uid()
    );
    
    -- Atualizar timestamps conforme status
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
      NEW.confirmed_at := NOW();
    ELSIF NEW.status = 'completed' AND OLD.status != 'completed' THEN
      NEW.completed_at := NOW();
    ELSIF NEW.status IN ('cancelled', 'no_show') AND OLD.status NOT IN ('cancelled', 'no_show') THEN
      NEW.cancelled_at := NOW();
    END IF;
  END IF;
  
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$;

-- Trigger para registrar deleção de agendamento
CREATE OR REPLACE FUNCTION trg_appointment_audit_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO booking_audit_log (
    workspace_id,
    profile_id,
    entity_type,
    entity_id,
    action,
    old_values,
    changed_by
  )
  VALUES (
    OLD.workspace_id,
    OLD.profile_id,
    'appointment',
    OLD.id,
    'deleted',
    jsonb_build_object(
      'client_id', OLD.client_id,
      'professional_id', OLD.professional_id,
      'service_id', OLD.service_id,
      'date', OLD.date,
      'start_time', OLD.start_time,
      'status', OLD.status
    ),
    auth.uid()
  );
  
  RETURN OLD;
END;
$$;

-- Aplicar triggers
DROP TRIGGER IF EXISTS trg_appointment_insert_audit ON booking_appointments;
CREATE TRIGGER trg_appointment_insert_audit
  AFTER INSERT ON booking_appointments
  FOR EACH ROW EXECUTE FUNCTION trg_appointment_audit_insert();

DROP TRIGGER IF EXISTS trg_appointment_update_audit ON booking_appointments;
CREATE TRIGGER trg_appointment_update_audit
  AFTER UPDATE ON booking_appointments
  FOR EACH ROW EXECUTE FUNCTION trg_appointment_audit_update();

DROP TRIGGER IF EXISTS trg_appointment_delete_audit ON booking_appointments;
CREATE TRIGGER trg_appointment_delete_audit
  AFTER DELETE ON booking_appointments
  FOR EACH ROW EXECUTE FUNCTION trg_appointment_audit_delete();

-- ============================================
-- VALIDAÇÃO FINAL DE SEGURANÇA
-- ============================================

DO $$
DECLARE
  _tbl text;
  _rls boolean;
  _policy_count int;
  _total_policies int := 0;
  _booking_tables text[] := ARRAY[
    'booking_workspaces', 'booking_settings', 'booking_services',
    'booking_professionals', 'booking_professional_services', 'booking_availability',
    'booking_blocked_slots', 'booking_clients', 'booking_appointments',
    'booking_audit_log', 'booking_notifications'
  ];
BEGIN
  -- Verificar RLS em todas as tabelas de agendamento
  FOREACH _tbl IN ARRAY _booking_tables
  LOOP
    SELECT relrowsecurity INTO _rls
    FROM pg_class
    WHERE relname = _tbl AND relnamespace = 'public'::regnamespace;

    IF NOT _rls THEN
      RAISE EXCEPTION 'FALHA: RLS não está habilitado na tabela %', _tbl;
    END IF;

    SELECT count(*) INTO _policy_count
    FROM pg_policies
    WHERE tablename = _tbl AND schemaname = 'public';

    _total_policies := _total_policies + _policy_count;

    RAISE NOTICE '  ✓ % — RLS habilitado, % policies', _tbl, _policy_count;
  END LOOP;

  -- Verificar funções auxiliares
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_workspace_owner') THEN
    RAISE EXCEPTION 'FALHA: Função is_workspace_owner não encontrada';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_workspace_access') THEN
    RAISE EXCEPTION 'FALHA: Função has_workspace_access não encontrada';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_booking_conflict') THEN
    RAISE EXCEPTION 'FALHA: Função check_booking_conflict não encontrada';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_confirmation_code') THEN
    RAISE EXCEPTION 'FALHA: Função generate_confirmation_code não encontrada';
  END IF;

  -- Verificar view pública
  IF NOT EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'public_booking_availability') THEN
    RAISE EXCEPTION 'FALHA: View public_booking_availability não encontrada';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '✓ Validação RLS completa: % tabelas, % policies', array_length(_booking_tables, 1), _total_policies;
  RAISE NOTICE '✓ Funções auxiliares criadas';
  RAISE NOTICE '✓ Triggers de auditoria aplicados';
  RAISE NOTICE '✓ View pública disponível';
  RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;
