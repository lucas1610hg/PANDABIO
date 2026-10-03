-- =============================================================
-- PANDABIO — MÓDULO AGENDAMENTOS: DADOS DE TESTE
-- Versão: 1.0
-- Data: 2026-09-21
-- Descrição: Dados de exemplo para desenvolvimento (AMBIENTE DEV)
-- ATENÇÃO: NÃO EXECUTAR EM PRODUÇÃO
-- =============================================================

-- ============================================
-- CONFIGURAÇÃO DE TESTE
-- ============================================

-- Criar workspace de teste
INSERT INTO booking_workspaces (
  profile_id,
  name,
  slug,
  description,
  timezone,
  currency,
  language,
  active,
  settings
) VALUES (
  (SELECT id FROM profiles LIMIT 1),
  'Salão de Beleza PandaBio',
  'pandabio-salao',
  'Salão de beleza completo com serviços de cabelo, estética e spa',
  'America/Sao_Paulo',
  'BRL',
  'pt-BR',
  true,
  '{"allow_online_booking": true, "require_phone": true}'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- Configurações do workspace
INSERT INTO booking_settings (
  workspace_id,
  profile_id,
  default_slot_duration,
  min_advance_booking,
  max_advance_booking,
  allow_cancellations,
  cancellation_hours,
  require_deposit,
  deposit_percentage,
  enable_reminders,
  reminder_hours,
  enable_auto_confirm,
  buffer_time
) VALUES (
  (SELECT id FROM booking_workspaces WHERE slug = 'pandabio-salao'),
  (SELECT id FROM profiles LIMIT 1),
  30,
  2,
  30,
  true,
  24,
  false,
  20,
  true,
  ARRAY[24, 2],
  false,
  0
) ON CONFLICT (workspace_id, profile_id) DO NOTHING;

-- ============================================
-- SERVIÇOS DE TESTE
-- ============================================

INSERT INTO booking_services (
  workspace_id,
  profile_id,
  name,
  description,
  category,
  color,
  duration,
  price,
  price_display_type,
  active,
  sort_order
) VALUES 
-- Corte Masculino
(
  (SELECT id FROM booking_workspaces WHERE slug = 'pandabio-salao'),
  (SELECT id FROM profiles LIMIT 1),
  'Corte Masculino',
  'Corte tradicional com lavagem e modelagem',
  'cabelo',
  '#3525cd',
  30,
  50.00,
  'fixed',
  true,
  1
),
-- Corte Feminino
(
  (SELECT id FROM booking_workspaces WHERE slug = 'pandabio-salao'),
  (SELECT id FROM profiles LIMIT 1),
  'Corte Feminino',
  'Corte e escova com hidratação',
  'cabelo',
  '#FF7A00',
  45,
  70.00,
  'fixed',
  true,
  2
),
-- Barba
(
  (SELECT id FROM booking_workspaces WHERE slug = 'pandabio-salao'),
  (SELECT id FROM profiles LIMIT 1),
  'Barba Completa',
  'Toalha quente, navalhado e modelagem',
  'barba',
  '#10B981',
  20,
  35.00,
  'fixed',
  true,
  3
),
-- Coloração
(
  (SELECT id FROM booking_workspaces WHERE slug = 'pandabio-salao'),
  (SELECT id FROM profiles LIMIT 1),
  'Coloração',
  'Coloração completa com corte e hidratação',
  'cabelo',
  '#EF4444',
  120,
  250.00,
  'fixed',
  true,
  4
),
-- Hidratação
(
  (SELECT id FROM booking_workspaces WHERE slug = 'pandabio-salao'),
  (SELECT id FROM profiles LIMIT 1),
  'Hidratação Profunda',
  'Tratamento capilar com nutrição intensa',
  'tratamento',
  '#8B5CF6',
  60,
  120.00,
  'fixed',
  true,
  5
),
-- Manicure
(
  (SELECT id FROM booking_workspaces WHERE slug = 'pandabio-salao'),
  (SELECT id FROM profiles LIMIT 1),
  'Manicure Completa',
  'Corte, lixamento e esmaltação',
  'unhas',
  '#EC4899',
  40,
  45.00,
  'fixed',
  true,
  6
),
-- Pedicure
(
  (SELECT id FROM booking_workspaces WHERE slug = 'pandabio-salao'),
  (SELECT id FROM profiles LIMIT 1),
  'Pedicure Spa',
  'Pedicure com esfoliação e massagem',
  'unhas',
  '#F59E0B',
  50,
  60.00,
  'fixed',
  true,
  7
),
-- Limpeza de Pele
(
  (SELECT id FROM booking_workspaces WHERE slug = 'pandabio-salao'),
  (SELECT id FROM profiles LIMIT 1),
  'Limpeza de Pele Profunda',
  'Limpeza, extração e hidratação',
  'estetica',
  '#06B6D4',
  60,
  150.00,
  'fixed',
  true,
  8
)
ON CONFLICT DO NOTHING;

-- ============================================
-- PROFISSIONAIS DE TESTE
-- ============================================

INSERT INTO booking_professionals (
  workspace_id,
  profile_id,
  name,
  email,
  phone,
  bio,
  specializations,
  active,
  color
) VALUES 
-- Profissional 1
(
  (SELECT id FROM booking_workspaces WHERE slug = 'pandabio-salao'),
  (SELECT id FROM profiles LIMIT 1),
  'Ana Silva',
  'ana.silva@pandabio.com',
  '+5511999999999',
  'Especialista em cortes e colorações com 10 anos de experiência',
  ARRAY['cabelo', 'coloração', 'corte masculino', 'corte feminino'],
  true,
  '#FF7A00'
),
-- Profissional 2
(
  (SELECT id FROM booking_workspaces WHERE slug = 'pandabio-salao'),
  (SELECT id FROM profiles LIMIT 1),
  'Carlos Oliveira',
  'carlos.oliveira@pandabio.com',
  '+5511988888888',
  'Barbeiro especializado em barbas e cortes modernos',
  ARRAY['barba', 'corte masculino'],
  true,
  '#3525cd'
),
-- Profissional 3
(
  (SELECT id FROM booking_workspaces WHERE slug = 'pandabio-salao'),
  (SELECT id FROM profiles LIMIT 1),
  'Marina Santos',
  'marina.santos@pandabio.com',
  '+5511977777777',
  'Manicure e pedicure especializada em tratamentos spa',
  ARRAY['unhas', 'manicure', 'pedicure', 'spa'],
  true,
  '#10B981'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- RELAÇÃO PROFISSIONAL-SERVIÇO
-- ============================================

-- Ana Silva faz todos os serviços de cabelo
INSERT INTO booking_professional_services (
  professional_id,
  service_id,
  workspace_id,
  profile_id,
  active
)
SELECT 
  bp.id, bs.id, bw.id, p.id, true
FROM booking_professionals bp
CROSS JOIN booking_services bs
CROSS JOIN booking_workspaces bw
CROSS JOIN profiles p
WHERE bw.slug = 'pandabio-salao'
  AND bp.name = 'Ana Silva'
  AND bs.category IN ('cabelo', 'tratamento')
ON CONFLICT DO NOTHING;

-- Carlos Oliveira faz barba e corte masculino
INSERT INTO booking_professional_services (
  professional_id,
  service_id,
  workspace_id,
  profile_id,
  active
)
SELECT 
  bp.id, bs.id, bw.id, p.id, true
FROM booking_professionals bp
CROSS JOIN booking_services bs
CROSS JOIN booking_workspaces bw
CROSS JOIN profiles p
WHERE bw.slug = 'pandabio-salao'
  AND bp.name = 'Carlos Oliveira'
  AND bs.name IN ('Corte Masculino', 'Barba Completa')
ON CONFLICT DO NOTHING;

-- Marina Santos faz serviços de unhas
INSERT INTO booking_professional_services (
  professional_id,
  service_id,
  workspace_id,
  profile_id,
  active
)
SELECT 
  bp.id, bs.id, bw.id, p.id, true
FROM booking_professionals bp
CROSS JOIN booking_services bs
CROSS JOIN booking_workspaces bw
CROSS JOIN profiles p
WHERE bw.slug = 'pandabio-salao'
  AND bp.name = 'Marina Santos'
  AND bs.category = 'unhas'
ON CONFLICT DO NOTHING;

-- ============================================
-- DISPONIBILIDADE RECURRENTE
-- ============================================

-- Ana Silva: Segunda a Sexta, 9h às 18h, pausa 12h-13h
INSERT INTO booking_availability (
  professional_id,
  workspace_id,
  profile_id,
  day_of_week,
  start_time,
  end_time,
  break_start_time,
  break_end_time,
  active
)
SELECT 
  bp.id, bw.id, p.id, 
  unnest(ARRAY[1, 2, 3, 4, 5]) as day_of_week, -- Seg-Sex
  '09:00'::time, '18:00'::time, '12:00'::time, '13:00'::time, true
FROM booking_professionals bp
CROSS JOIN booking_workspaces bw
CROSS JOIN profiles p
WHERE bw.slug = 'pandabio-salao'
  AND bp.name = 'Ana Silva'
ON CONFLICT DO NOTHING;

-- Carlos Oliveira: Terça a Sábado, 10h às 20h
INSERT INTO booking_availability (
  professional_id,
  workspace_id,
  profile_id,
  day_of_week,
  start_time,
  end_time,
  break_start_time,
  break_end_time,
  active
)
SELECT 
  bp.id, bw.id, p.id, 
  unnest(ARRAY[2, 3, 4, 5, 6]) as day_of_week, -- Ter-Sáb
  '10:00'::time, '20:00'::time, NULL, NULL, true
FROM booking_professionals bp
CROSS JOIN booking_workspaces bw
CROSS JOIN profiles p
WHERE bw.slug = 'pandabio-salao'
  AND bp.name = 'Carlos Oliveira'
ON CONFLICT DO NOTHING;

-- Marina Santos: Quarta a Domingo, 9h às 17h
INSERT INTO booking_availability (
  professional_id,
  workspace_id,
  profile_id,
  day_of_week,
  start_time,
  end_time,
  break_start_time,
  break_end_time,
  active
)
SELECT 
  bp.id, bw.id, p.id, 
  unnest(ARRAY[3, 4, 5, 6, 0]) as day_of_week, -- Qua-Dom
  '09:00'::time, '17:00'::time, NULL, NULL, true
FROM booking_professionals bp
CROSS JOIN booking_workspaces bw
CROSS JOIN profiles p
WHERE bw.slug = 'pandabio-salao'
  AND bp.name = 'Marina Santos'
ON CONFLICT DO NOTHING;

-- ============================================
-- CLIENTES DE TESTE
-- ============================================

INSERT INTO booking_clients (
  workspace_id,
  profile_id,
  name,
  email,
  phone,
  notes,
  consent_marketing,
  consent_data_processing
) VALUES 
-- Cliente 1
(
  (SELECT id FROM booking_workspaces WHERE slug = 'pandabio-salao'),
  (SELECT id FROM profiles LIMIT 1),
  'João Silva',
  'joao.silva@email.com',
  '+5511999988877',
  'Cliente fiel, prefere cortes curtos',
  true,
  true
),
-- Cliente 2
(
  (SELECT id FROM booking_workspaces WHERE slug = 'pandabio-salao'),
  (SELECT id FROM profiles LIMIT 1),
  'Maria Santos',
  'maria.santos@email.com',
  '+5511999778866',
  'Cliente nova, gostou muito do atendimento',
  false,
  true
),
-- Cliente 3
(
  (SELECT id FROM booking_workspaces WHERE slug = 'pandabio-salao'),
  (SELECT id FROM profiles LIMIT 1),
  'Pedro Oliveira',
  'pedro.oliveira@email.com',
  '+5511999665544',
  '',
  true,
  true
)
ON CONFLICT DO NOTHING;

-- ============================================
-- AGENDAMENTOS DE TESTE
-- ============================================

-- Agendamento confirmado para amanhã
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
  payment_status,
  payment_amount,
  confirmation_code,
  confirmed_at
)
SELECT 
  bw.id, p.id, 
  (SELECT id FROM booking_clients WHERE name = 'João Silva'),
  (SELECT id FROM booking_professionals WHERE name = 'Ana Silva'),
  (SELECT id FROM booking_services WHERE name = 'Corte Masculino'),
  CURRENT_DATE + INTERVAL '1 day',
  '10:00'::time,
  '10:30'::time,
  'Corte Masculino',
  30,
  50.00,
  'Ana Silva',
  'confirmed',
  'paid',
  50.00,
  generate_confirmation_code(),
  NOW()
FROM booking_workspaces bw
CROSS JOIN profiles p
WHERE bw.slug = 'pandabio-salao'
ON CONFLICT DO NOTHING;

-- Agendamento pendente para depois de amanhã
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
  payment_status,
  confirmation_code
)
SELECT 
  bw.id, p.id, 
  (SELECT id FROM booking_clients WHERE name = 'Maria Santos'),
  (SELECT id FROM booking_professionals WHERE name = 'Marina Santos'),
  (SELECT id FROM booking_services WHERE name = 'Manicure Completa'),
  CURRENT_DATE + INTERVAL '2 days',
  '14:00'::time,
  '14:40'::time,
  'Manicure Completa',
  40,
  45.00,
  'Marina Santos',
  'pending',
  'pending',
  generate_confirmation_code()
FROM booking_workspaces bw
CROSS JOIN profiles p
WHERE bw.slug = 'pandabio-salao'
ON CONFLICT DO NOTHING;

-- Agendamento concluído (ontem)
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
  payment_status,
  payment_amount,
  confirmation_code,
  confirmed_at,
  completed_at
)
SELECT 
  bw.id, p.id, 
  (SELECT id FROM booking_clients WHERE name = 'Pedro Oliveira'),
  (SELECT id FROM booking_professionals WHERE name = 'Carlos Oliveira'),
  (SELECT id FROM booking_services WHERE name = 'Barba Completa'),
  CURRENT_DATE - INTERVAL '1 day',
  '15:00'::time,
  '15:20'::time,
  'Barba Completa',
  20,
  35.00,
  'Carlos Oliveira',
  'completed',
  'paid',
  35.00,
  generate_confirmation_code(),
  CURRENT_DATE - INTERVAL '1 day' - INTERVAL '2 hours',
  CURRENT_DATE - INTERVAL '1 day' - INTERVAL '1 hour'
FROM booking_workspaces bw
CROSS JOIN profiles p
WHERE bw.slug = 'pandabio-salao'
ON CONFLICT DO NOTHING;

-- ============================================
-- BLOQUEIO DE TESTE (FÉRIAS)
-- ============================================

-- Bloqueio para Ana Silva no próximo final de semana
INSERT INTO booking_blocked_slots (
  professional_id,
  workspace_id,
  profile_id,
  start_date,
  end_date,
  reason,
  blocked_type
)
SELECT 
  (SELECT id FROM booking_professionals WHERE name = 'Ana Silva'),
  bw.id, p.id,
  CURRENT_DATE + INTERVAL '7 days',
  CURRENT_DATE + INTERVAL '9 days',
  'Férias programadas',
  'vacation'
FROM booking_workspaces bw
CROSS JOIN profiles p
WHERE bw.slug = 'pandabio-salao'
ON CONFLICT DO NOTHING;

-- ============================================
-- NOTIFICAÇÕES DE TESTE
-- ============================================

-- Notificação de lembrete para agendamento pendente
INSERT INTO booking_notifications (
  workspace_id,
  profile_id,
  appointment_id,
  type,
  status,
  scheduled_for
)
SELECT 
  ba.workspace_id, ba.profile_id, ba.id,
  'reminder',
  'pending',
  NOW() + INTERVAL '2 hours'
FROM booking_appointments ba
WHERE ba.status = 'pending'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- VALIDAÇÃO DE DADOS DE TESTE
-- ============================================

DO $$
DECLARE
  _workspace_count INTEGER;
  _services_count INTEGER;
  _professionals_count INTEGER;
  _clients_count INTEGER;
  _appointments_count INTEGER;
BEGIN
  -- Contar registros criados
  SELECT COUNT(*) INTO _workspace_count FROM booking_workspaces WHERE slug = 'pandabio-salao';
  SELECT COUNT(*) INTO _services_count FROM booking_services WHERE workspace_id = (SELECT id FROM booking_workspaces WHERE slug = 'pandabio-salao');
  SELECT COUNT(*) INTO _professionals_count FROM booking_professionals WHERE workspace_id = (SELECT id FROM booking_workspaces WHERE slug = 'pandabio-salao');
  SELECT COUNT(*) INTO _clients_count FROM booking_clients WHERE workspace_id = (SELECT id FROM booking_workspaces WHERE slug = 'pandabio-salao');
  SELECT COUNT(*) INTO _appointments_count FROM booking_appointments WHERE workspace_id = (SELECT id FROM booking_workspaces WHERE slug = 'pandabio-salao');
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '✓ Dados de teste criados com sucesso';
  RAISE NOTICE '  Workspaces: %', _workspace_count;
  RAISE NOTICE '  Serviços: %', _services_count;
  RAISE NOTICE '  Profissionais: %', _professionals_count;
  RAISE NOTICE '  Clientes: %', _clients_count;
  RAISE NOTICE '  Agendamentos: %', _appointments_count;
  RAISE NOTICE '═══════════════════════════════════════════════════';
  
  IF _workspace_count = 0 OR _services_count = 0 OR _professionals_count = 0 THEN
    RAISE WARNING 'AVISO: Alguns dados de teste não foram criados - verifique se profile existe';
  END IF;
END $$;