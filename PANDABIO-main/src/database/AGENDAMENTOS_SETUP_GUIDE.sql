-- =============================================================
-- PANDABIO — MÓDULO AGENDAMENTOS: GUIA DE INSTALAÇÃO
-- Versão: 1.0
-- Data: 2026-09-21
-- Descrição: Guia para implementação do módulo de agendamentos
-- =============================================================

-- =============================================================
-- INSTRUÇÕES DE INSTALAÇÃO
-- =============================================================
--
-- 1. Desenvolvimento:
--    - Execute: 2026092101_agendamentos_core_tables.sql
--    - Execute: 2026092102_agendamentos_rls_policies.sql
--    - Execute: 2026092103_agendamentos_rpc_functions.sql
--    - Execute: 2026092201_booking_workspace_onboarding.sql
--    - Execute: 2026092202_booking_integrity.sql
--    - Execute: 2026092301_fix_booking_availability_end_time.sql
--    - Execute: 2026092703_agendamentos_integrity.sql
--    - Execute: 2026092704_public_booking_workspace.sql (se a página pública já estiver instalada)
--    - Execute: 2026092104_agendamentos_seed_data.sql (opcional)
--
-- 2. Produção:
--    - Execute: 2026092101_agendamentos_core_tables.sql
--    - Execute: 2026092102_agendamentos_rls_policies.sql
--    - Execute: 2026092103_agendamentos_rpc_functions.sql
--    - Execute: 2026092201_booking_workspace_onboarding.sql
--    - Execute: 2026092202_booking_integrity.sql
--    - Execute: 2026092301_fix_booking_availability_end_time.sql
--    - Execute: 2026092703_agendamentos_integrity.sql
--    - Execute: 2026092704_public_booking_workspace.sql (se a página pública já estiver instalada)
--    - NÃO execute o arquivo de seed data em produção
--
-- 3. Validação:
--    - Verifique se todas as tabelas foram criadas
--    - Verifique se RLS está habilitado em todas as tabelas
--    - Teste as funções RPC
--    - Verifique os índices
--
-- =============================================================

-- Verificação rápida de instalação
DO $$
DECLARE
  _expected_tables text[] := ARRAY[
    'booking_workspaces', 'booking_settings', 'booking_services',
    'booking_professionals', 'booking_professional_services', 'booking_availability',
    'booking_blocked_slots', 'booking_clients', 'booking_appointments',
    'booking_audit_log', 'booking_notifications'
  ];
  _table_name text;
  _table_exists boolean;
  _rls_enabled boolean;
  _missing_tables text[] := '{}';
  _rls_disabled_tables text[] := '{}';
BEGIN
  FOREACH _table_name IN ARRAY _expected_tables
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = _table_name
    ) INTO _table_exists;
    
    IF _table_exists THEN
      SELECT relrowsecurity INTO _rls_enabled
      FROM pg_class
      WHERE relname = _table_name 
        AND relnamespace = 'public'::regnamespace;
      
      IF NOT _rls_enabled THEN
        _rls_disabled_tables := array_append(_rls_disabled_tables, _table_name);
      END IF;
    ELSE
      _missing_tables := array_append(_missing_tables, _table_name);
    END IF;
  END LOOP;
  
  IF array_length(_missing_tables, 1) > 0 THEN
    RAISE NOTICE 'Tabelas faltando: %', array_to_string(_missing_tables, ', ');
  END IF;
  
  IF array_length(_rls_disabled_tables, 1) > 0 THEN
    RAISE NOTICE 'RLS desabilitado em: %', array_to_string(_rls_disabled_tables, ', ');
  END IF;
  
  IF array_length(_missing_tables, 1) = 0 AND array_length(_rls_disabled_tables, 1) = 0 THEN
    RAISE NOTICE '✓ Todas as tabelas de agendamentos foram criadas com RLS habilitado';
  END IF;
END $$;
