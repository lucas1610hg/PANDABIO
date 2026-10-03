-- =============================================================
-- PANDABIO — MÓDULO AGENDAMENTOS: TABELAS CORE
-- Versão: 1.0
-- Data: 2026-09-21
-- Descrição: Estrutura principal do sistema de agendamentos
-- =============================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================
-- WORKSPACES (NÉGOCIOS DE AGENDAMENTO)
-- ============================================
-- Cada workspace representa um negócio/salão com suas configurações
CREATE TABLE IF NOT EXISTS booking_workspaces (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  currency VARCHAR(3) DEFAULT 'BRL',
  language VARCHAR(5) DEFAULT 'pt-BR',
  active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT timezone_valid CHECK (timezone IS NOT NULL)
);

-- ============================================
-- CONFIGURAÇÕES DO WORKSPACE
-- ============================================
-- Configurações globais de agendamento por workspace
CREATE TABLE IF NOT EXISTS booking_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES booking_workspaces(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Configurações de agendamento
  default_slot_duration INTEGER DEFAULT 30 CHECK (default_slot_duration IN (15, 30, 45, 60, 90, 120)),
  min_advance_booking INTEGER DEFAULT 2 CHECK (min_advance_booking >= 0), -- horas
  max_advance_booking INTEGER DEFAULT 30 CHECK (max_advance_booking >= 1), -- dias
  
  -- Cancelamento
  allow_cancellations BOOLEAN DEFAULT true,
  cancellation_hours INTEGER DEFAULT 24 CHECK (cancellation_hours >= 0),
  cancellation_policy TEXT,
  
  -- Pagamento/Depósito
  require_deposit BOOLEAN DEFAULT false,
  deposit_percentage INTEGER DEFAULT 20 CHECK (deposit_percentage BETWEEN 0 AND 100),
  deposit_fixed_amount DECIMAL(10, 2),
  payment_methods JSONB DEFAULT '[]',
  
  -- Lembretes
  enable_reminders BOOLEAN DEFAULT true,
  reminder_hours INTEGER[] DEFAULT ARRAY[24, 2],
  reminder_template TEXT,
  
  -- Validações
  enable_auto_confirm BOOLEAN DEFAULT false,
  require_phone BOOLEAN DEFAULT true,
  require_email BOOLEAN DEFAULT true,
  buffer_time INTEGER DEFAULT 0 CHECK (buffer_time >= 0), -- minutos entre agendamentos
  
  -- Limites
  max_daily_bookings INTEGER,
  max_weekly_bookings INTEGER,
  no_show_limit INTEGER DEFAULT 3,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT settings_unique UNIQUE (workspace_id, profile_id)
);

-- ============================================
-- SERVIÇOS
-- ============================================
-- Serviços oferecidos pelo negócio
CREATE TABLE IF NOT EXISTS booking_services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES booking_workspaces(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  color VARCHAR(7) DEFAULT '#FF7A00',
  
  -- Duração e preço
  duration INTEGER NOT NULL CHECK (duration > 0), -- minutos
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  price_display_type VARCHAR(20) DEFAULT 'fixed' CHECK (price_display_type IN ('fixed', 'variable', 'consultation')),
  
  -- Configurações
  active BOOLEAN DEFAULT true,
  requires_deposit BOOLEAN DEFAULT false,
  deposit_amount DECIMAL(10, 2),
  advance_booking_days INTEGER DEFAULT 0, -- dias de antecedência mínima
  cancellation_hours INTEGER DEFAULT 24,
  
  -- Metadados
  metadata JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT service_name CHECK (char_length(name) >= 3 AND char_length(name) <= 100),
  CONSTRAINT color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- ============================================
-- PROFISSIONAIS
-- ============================================
-- Profissionais que executam os serviços
CREATE TABLE IF NOT EXISTS booking_professionals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES booking_workspaces(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  avatar_url TEXT,
  bio TEXT,
  specializations TEXT[],
  
  -- Configurações
  active BOOLEAN DEFAULT true,
  color VARCHAR(7) DEFAULT '#3525cd',
  
  -- Metadados
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT professional_name CHECK (char_length(name) >= 3 AND char_length(name) <= 100),
  CONSTRAINT color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- ============================================
-- RELAÇÃO PROFISSIONAL-SERVIÇO
-- ============================================
-- Quais profissionais executam quais serviços
CREATE TABLE IF NOT EXISTS booking_professional_services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES booking_professionals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES booking_services(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES booking_workspaces(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  active BOOLEAN DEFAULT true,
  custom_price DECIMAL(10, 2), -- preço específico para este profissional
  custom_duration INTEGER, -- duração específica para este profissional
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT professional_service_unique UNIQUE (professional_id, service_id),
  CONSTRAINT custom_price_positive CHECK (custom_price IS NULL OR custom_price >= 0),
  CONSTRAINT custom_duration_positive CHECK (custom_duration IS NULL OR custom_duration > 0)
);

-- ============================================
-- DISPONIBILIDADE RECURRENTE
-- ============================================
-- Horários de trabalho recorrentes por profissional
CREATE TABLE IF NOT EXISTS booking_availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES booking_professionals(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES booking_workspaces(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=domingo, 6=sábado
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Pausas (almoço, etc)
  break_start_time TIME,
  break_end_time TIME,
  
  active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT time_order CHECK (start_time < end_time),
  CONSTRAINT break_order CHECK (
    break_start_time IS NULL OR 
    (break_start_time > start_time AND break_end_time < end_time)
  ),
  CONSTRAINT professional_day_unique UNIQUE (professional_id, day_of_week)
);

-- ============================================
-- BLOQUEIOS/EXCEÇÕES DE DISPONIBILIDADE
-- ============================================
-- Férias, feriados, bloqueios temporários
CREATE TABLE IF NOT EXISTS booking_blocked_slots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  professional_id UUID REFERENCES booking_professionals(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES booking_workspaces(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason VARCHAR(255),
  blocked_type VARCHAR(20) DEFAULT 'custom' CHECK (blocked_type IN ('vacation', 'holiday', 'maintenance', 'custom')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT date_order CHECK (start_date <= end_date)
);

-- ============================================
-- CLIENTES
-- ============================================
-- Clientes que fazem agendamentos
CREATE TABLE IF NOT EXISTS booking_clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES booking_workspaces(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  avatar_url TEXT,
  notes TEXT,
  
  -- Estatísticas
  total_bookings INTEGER DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  last_booking_date DATE,
  no_show_count INTEGER DEFAULT 0,
  
  -- Privacidade (LGPD)
  consent_marketing BOOLEAN DEFAULT false,
  consent_data_processing BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT client_name CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
  CONSTRAINT email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ============================================
-- AGENDAMENTOS
-- ============================================
-- Reservas de agendamento
CREATE TABLE IF NOT EXISTS booking_appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES booking_workspaces(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  client_id UUID REFERENCES booking_clients(id) ON DELETE SET NULL,
  professional_id UUID NOT NULL REFERENCES booking_professionals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES booking_services(id) ON DELETE CASCADE,
  
  -- Data e hora
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  
  -- Snapshot de dados no momento da reserva (preservação)
  service_name VARCHAR(100) NOT NULL,
  service_duration INTEGER NOT NULL,
  service_price DECIMAL(10, 2) NOT NULL,
  professional_name VARCHAR(100) NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending',      -- aguardando confirmação
    'confirmed',    -- confirmado
    'in_progress',  -- em atendimento
    'completed',    -- concluído
    'cancelled',    -- cancelado
    'no_show',      -- não compareceu
    'expired'       -- expirado (não confirmado em tempo)
  )),
  
  -- Pagamento
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'paid', 'refunded', 'partial', 'cancelled'
  )),
  payment_amount DECIMAL(10, 2),
  deposit_paid BOOLEAN DEFAULT false,
  deposit_amount DECIMAL(10, 2),
  
  -- Metadados
  notes TEXT,
  client_notes TEXT,
  internal_notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Sistema
  confirmation_code VARCHAR(20) UNIQUE,
  reminder_sent BOOLEAN DEFAULT false,
  reminder_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT time_order CHECK (start_time < end_time),
  CONSTRAINT status_transitions CHECK (
    -- Validar transições de status
    (status = 'pending' AND confirmed_at IS NULL) OR
    (status = 'confirmed' AND confirmed_at IS NOT NULL) OR
    (status = 'in_progress' AND confirmed_at IS NOT NULL) OR
    (status = 'completed' AND completed_at IS NOT NULL) OR
    (status = 'cancelled' AND cancelled_at IS NOT NULL) OR
    (status = 'no_show' AND cancelled_at IS NOT NULL) OR
    (status = 'expired')
  ),
  CONSTRAINT positive_amounts CHECK (
    service_price >= 0 AND 
    (payment_amount IS NULL OR payment_amount >= 0) AND
    (deposit_amount IS NULL OR deposit_amount >= 0)
  ),
  CONSTRAINT booking_appointments_no_overlap
    EXCLUDE USING gist (
      professional_id WITH =,
      (tsrange(
        (date + start_time)::timestamp,
        (date + end_time)::timestamp,
        '[)'
      )) WITH &&
    )
    WHERE (status IN ('pending', 'confirmed', 'in_progress'))
);

-- ============================================
-- HISTÓRICO DE ALTERAÇÕES
-- ============================================
-- Auditoria de alterações importantes
CREATE TABLE IF NOT EXISTS booking_audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES booking_workspaces(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN (
    'appointment', 'client', 'professional', 'service', 'settings'
  )),
  entity_id UUID NOT NULL,
  
  action VARCHAR(20) NOT NULL CHECK (action IN (
    'created', 'updated', 'deleted', 'status_changed', 'cancelled', 'confirmed'
  )),
  
  -- Snapshot antes/depois
  old_values JSONB,
  new_values JSONB,
  
  -- Contexto
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  ip_address INET,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- NOTIFICAÇÕES E LEMBRETES
-- ============================================
-- Sistema de notificações
CREATE TABLE IF NOT EXISTS booking_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES booking_workspaces(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  appointment_id UUID REFERENCES booking_appointments(id) ON DELETE CASCADE,
  client_id UUID REFERENCES booking_clients(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES booking_professionals(id) ON DELETE CASCADE,
  
  type VARCHAR(30) NOT NULL CHECK (type IN (
    'reminder', 'confirmation', 'cancellation', 'reschedule', 'no_show', 'review'
  )),
  
  -- Status de envio
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'sent', 'failed', 'cancelled'
  )),
  
  -- Canais
  channels JSONB DEFAULT '{"email": true, "sms": false, "whatsapp": false}',
  
  -- Conteúdo
  subject VARCHAR(255),
  content TEXT,
  template_id VARCHAR(50),
  
  -- Sistema
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

-- Workspaces
CREATE INDEX IF NOT EXISTS idx_booking_workspaces_profile_id ON booking_workspaces(profile_id);
CREATE INDEX IF NOT EXISTS idx_booking_workspaces_slug ON booking_workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_booking_workspaces_active ON booking_workspaces(active);

-- Settings
CREATE INDEX IF NOT EXISTS idx_booking_settings_workspace_id ON booking_settings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_booking_settings_profile_id ON booking_settings(profile_id);

-- Services
CREATE INDEX IF NOT EXISTS idx_booking_services_workspace_id ON booking_services(workspace_id);
CREATE INDEX IF NOT EXISTS idx_booking_services_profile_id ON booking_services(profile_id);
CREATE INDEX IF NOT EXISTS idx_booking_services_active ON booking_services(active);
CREATE INDEX IF NOT EXISTS idx_booking_services_category ON booking_services(category);
CREATE INDEX IF NOT EXISTS idx_booking_services_sort ON booking_services(workspace_id, sort_order);

-- Professionals
CREATE INDEX IF NOT EXISTS idx_booking_professionals_workspace_id ON booking_professionals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_booking_professionals_profile_id ON booking_professionals(profile_id);
CREATE INDEX IF NOT EXISTS idx_booking_professionals_active ON booking_professionals(active);

-- Professional Services
CREATE INDEX IF NOT EXISTS idx_booking_professional_services_professional_id ON booking_professional_services(professional_id);
CREATE INDEX IF NOT EXISTS idx_booking_professional_services_service_id ON booking_professional_services(service_id);
CREATE INDEX IF NOT EXISTS idx_booking_professional_services_active ON booking_professional_services(active);

-- Availability
CREATE INDEX IF NOT EXISTS idx_booking_availability_professional_id ON booking_availability(professional_id);
CREATE INDEX IF NOT EXISTS idx_booking_availability_workspace_id ON booking_availability(workspace_id);
CREATE INDEX IF NOT EXISTS idx_booking_availability_active ON booking_availability(active);
CREATE INDEX IF NOT EXISTS idx_booking_availability_day ON booking_availability(professional_id, day_of_week);

-- Blocked Slots
CREATE INDEX IF NOT EXISTS idx_booking_blocked_slots_professional_id ON booking_blocked_slots(professional_id);
CREATE INDEX IF NOT EXISTS idx_booking_blocked_slots_workspace_id ON booking_blocked_slots(workspace_id);
CREATE INDEX IF NOT EXISTS idx_booking_blocked_slots_date_range ON booking_blocked_slots(start_date, end_date);

-- Clients
CREATE INDEX IF NOT EXISTS idx_booking_clients_workspace_id ON booking_clients(workspace_id);
CREATE INDEX IF NOT EXISTS idx_booking_clients_profile_id ON booking_clients(profile_id);
CREATE INDEX IF NOT EXISTS idx_booking_clients_email ON booking_clients(email);
CREATE INDEX IF NOT EXISTS idx_booking_clients_phone ON booking_clients(phone);
CREATE INDEX IF NOT EXISTS idx_booking_clients_name_search ON booking_clients USING gin(to_tsvector('portuguese', name));

-- Appointments
CREATE INDEX IF NOT EXISTS idx_booking_appointments_workspace_id ON booking_appointments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_booking_appointments_profile_id ON booking_appointments(profile_id);
CREATE INDEX IF NOT EXISTS idx_booking_appointments_client_id ON booking_appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_booking_appointments_professional_id ON booking_appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_booking_appointments_service_id ON booking_appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_booking_appointments_date ON booking_appointments(date);
CREATE INDEX IF NOT EXISTS idx_booking_appointments_datetime ON booking_appointments(date, start_time);
CREATE INDEX IF NOT EXISTS idx_booking_appointments_status ON booking_appointments(status);
CREATE INDEX IF NOT EXISTS idx_booking_appointments_professional_date ON booking_appointments(professional_id, date, start_time);
CREATE INDEX IF NOT EXISTS idx_booking_appointments_confirmation_code ON booking_appointments(confirmation_code);

-- Audit Log
CREATE INDEX IF NOT EXISTS idx_booking_audit_log_workspace_id ON booking_audit_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_booking_audit_log_profile_id ON booking_audit_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_booking_audit_log_entity ON booking_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_booking_audit_log_created_at ON booking_audit_log(created_at DESC);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_booking_notifications_workspace_id ON booking_notifications(workspace_id);
CREATE INDEX IF NOT EXISTS idx_booking_notifications_profile_id ON booking_notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_booking_notifications_appointment_id ON booking_notifications(appointment_id);
CREATE INDEX IF NOT EXISTS idx_booking_notifications_status ON booking_notifications(status);
CREATE INDEX IF NOT EXISTS idx_booking_notifications_scheduled ON booking_notifications(scheduled_for) WHERE status = 'pending';

-- ============================================
-- FUNÇÕES AUXILIARES
-- ============================================

-- Função para gerar código de confirmação único
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS VARCHAR(20)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, 1 + (random() * length(chars))::INTEGER, 1);
    IF i IN (4, 8) THEN
      result := result || '-';
    END IF;
  END LOOP;
  RETURN result;
END;
$$;

-- Função para atualizar estatísticas do cliente
CREATE OR REPLACE FUNCTION update_client_stats(p_client_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE booking_clients
  SET 
    total_bookings = (
      SELECT COUNT(*) 
      FROM booking_appointments 
      WHERE client_id = p_client_id 
        AND status IN ('confirmed', 'completed', 'no_show')
    ),
    total_spent = COALESCE((
      SELECT SUM(payment_amount) 
      FROM booking_appointments 
      WHERE client_id = p_client_id 
        AND payment_status = 'paid'
    ), 0),
    last_booking_date = (
      SELECT MAX(date) 
      FROM booking_appointments 
      WHERE client_id = p_client_id 
        AND status IN ('confirmed', 'completed')
    ),
    no_show_count = (
      SELECT COUNT(*) 
      FROM booking_appointments 
      WHERE client_id = p_client_id 
        AND status = 'no_show'
    ),
    updated_at = NOW()
  WHERE id = p_client_id;
END;
$$;

-- Função para verificar conflito de agendamento
CREATE OR REPLACE FUNCTION check_booking_conflict(
  p_professional_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_exclude_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO conflict_count
  FROM booking_appointments
  WHERE professional_id = p_professional_id
    AND date = p_date
    AND status IN ('pending', 'confirmed', 'in_progress')
    AND (p_exclude_appointment_id IS NULL OR id != p_exclude_appointment_id)
    AND (
      -- Sobreposição de horários
      (start_time < p_end_time AND end_time > p_start_time)
    );
  
  RETURN conflict_count > 0;
END;
$$;
