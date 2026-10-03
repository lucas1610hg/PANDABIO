-- ATENÇÃO: apaga todos os dados do módulo Agendamentos.
-- Não apaga profiles, links, produtos, leads ou contas do PandaBio.

BEGIN;

DELETE FROM public.booking_notifications;
DELETE FROM public.booking_appointments;
DELETE FROM public.booking_audit_log;
DELETE FROM public.booking_clients;
DELETE FROM public.booking_blocked_slots;
DELETE FROM public.booking_availability;
DELETE FROM public.booking_professional_services;
DELETE FROM public.booking_professionals;
DELETE FROM public.booking_services;
DELETE FROM public.booking_settings;
DELETE FROM public.booking_workspaces;

COMMIT;

SELECT
  table_name,
  row_count
FROM (
  SELECT 'booking_workspaces' AS table_name, COUNT(*) AS row_count FROM public.booking_workspaces
  UNION ALL
  SELECT 'booking_settings', COUNT(*) FROM public.booking_settings
  UNION ALL
  SELECT 'booking_services', COUNT(*) FROM public.booking_services
  UNION ALL
  SELECT 'booking_professionals', COUNT(*) FROM public.booking_professionals
  UNION ALL
  SELECT 'booking_availability', COUNT(*) FROM public.booking_availability
  UNION ALL
  SELECT 'booking_clients', COUNT(*) FROM public.booking_clients
  UNION ALL
  SELECT 'booking_appointments', COUNT(*) FROM public.booking_appointments
) AS booking_counts
ORDER BY table_name;
