-- =============================================================
-- PANDABIO — MÓDULO AGENDAMENTOS: INTEGRIDADE DE RESERVAS
-- Versão: 1.0
-- Data: 2026-09-22
-- Descrição: Corrige exclusão de clientes e impede reservas sobrepostas
-- =============================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.booking_appointments
  ALTER COLUMN client_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'booking_appointments_no_overlap'
      AND conrelid = 'public.booking_appointments'::regclass
  ) THEN
    ALTER TABLE public.booking_appointments
      ADD CONSTRAINT booking_appointments_no_overlap
      EXCLUDE USING gist (
        professional_id WITH =,
        (tsrange(
          (date + start_time)::timestamp,
          (date + end_time)::timestamp,
          '[)'
        )) WITH &&
      )
      WHERE (status IN ('pending', 'confirmed', 'in_progress'));
  END IF;
END $$;
