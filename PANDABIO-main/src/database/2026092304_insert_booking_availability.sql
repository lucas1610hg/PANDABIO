-- Horários recorrentes dos profissionais.
-- Pré-requisito: workspace e profissionais já cadastrados.
-- PostgreSQL: 0 = domingo, 1 = segunda, ..., 6 = sábado.
-- Pode executar novamente: dias existentes serão atualizados.

DO $$
DECLARE
  v_workspace_id UUID;
  v_profile_id UUID;
  v_missing_professionals TEXT;
BEGIN
  SELECT bw.id, bw.profile_id
  INTO v_workspace_id, v_profile_id
  FROM public.booking_workspaces AS bw
  WHERE bw.active = true
  ORDER BY bw.created_at ASC
  LIMIT 1;

  IF v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum workspace ativo encontrado. Abra Agendamentos ou cadastre um workspace primeiro.';
  END IF;

  SELECT STRING_AGG(schedule.professional_name, ', ' ORDER BY schedule.professional_name)
  INTO v_missing_professionals
  FROM (
    SELECT DISTINCT professional_name
    FROM (VALUES
      ('Ana Silva'),
      ('Carlos Oliveira'),
      ('Marina Santos')
    ) AS expected(professional_name)
  ) AS schedule
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.booking_professionals AS bp
    WHERE bp.workspace_id = v_workspace_id
      AND bp.name = schedule.professional_name
  );

  IF v_missing_professionals IS NOT NULL THEN
    RAISE EXCEPTION 'Profissional(is) não encontrado(s): %. Cadastre-os primeiro ou altere os nomes neste SQL.', v_missing_professionals;
  END IF;

  INSERT INTO public.booking_availability (
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
    bp.id,
    v_workspace_id,
    v_profile_id,
    schedule.day_of_week,
    schedule.start_time,
    schedule.end_time,
    schedule.break_start_time,
    schedule.break_end_time,
    true
  FROM (
    VALUES
      -- Ana Silva: segunda a sexta, 09:00–18:00
      ('Ana Silva', 1, TIME '09:00', TIME '18:00', NULL::TIME, NULL::TIME),
      ('Ana Silva', 2, TIME '09:00', TIME '18:00', NULL::TIME, NULL::TIME),
      ('Ana Silva', 3, TIME '09:00', TIME '18:00', NULL::TIME, NULL::TIME),
      ('Ana Silva', 4, TIME '09:00', TIME '18:00', NULL::TIME, NULL::TIME),
      ('Ana Silva', 5, TIME '09:00', TIME '18:00', NULL::TIME, NULL::TIME),

      -- Carlos Oliveira: segunda 09:00–18:00; terça a sábado 10:00–20:00
      ('Carlos Oliveira', 1, TIME '09:00', TIME '18:00', NULL::TIME, NULL::TIME),
      ('Carlos Oliveira', 2, TIME '10:00', TIME '20:00', NULL::TIME, NULL::TIME),
      ('Carlos Oliveira', 3, TIME '10:00', TIME '20:00', NULL::TIME, NULL::TIME),
      ('Carlos Oliveira', 4, TIME '10:00', TIME '20:00', NULL::TIME, NULL::TIME),
      ('Carlos Oliveira', 5, TIME '10:00', TIME '20:00', NULL::TIME, NULL::TIME),
      ('Carlos Oliveira', 6, TIME '10:00', TIME '20:00', NULL::TIME, NULL::TIME),

      -- Marina Santos: domingo 09:00–17:00; segunda e terça 09:00–18:00;
      -- quarta a sábado 09:00–17:00
      ('Marina Santos', 0, TIME '09:00', TIME '17:00', NULL::TIME, NULL::TIME),
      ('Marina Santos', 1, TIME '09:00', TIME '18:00', NULL::TIME, NULL::TIME),
      ('Marina Santos', 2, TIME '09:00', TIME '18:00', NULL::TIME, NULL::TIME),
      ('Marina Santos', 3, TIME '09:00', TIME '17:00', NULL::TIME, NULL::TIME),
      ('Marina Santos', 4, TIME '09:00', TIME '17:00', NULL::TIME, NULL::TIME),
      ('Marina Santos', 5, TIME '09:00', TIME '17:00', NULL::TIME, NULL::TIME),
      ('Marina Santos', 6, TIME '09:00', TIME '17:00', NULL::TIME, NULL::TIME)
  ) AS schedule(
    professional_name,
    day_of_week,
    start_time,
    end_time,
    break_start_time,
    break_end_time
  )
  JOIN public.booking_professionals AS bp
    ON bp.workspace_id = v_workspace_id
   AND bp.name = schedule.professional_name
  ON CONFLICT (professional_id, day_of_week)
  DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    break_start_time = EXCLUDED.break_start_time,
    break_end_time = EXCLUDED.break_end_time,
    active = EXCLUDED.active,
    updated_at = NOW();
END;
$$;

SELECT
  bp.name AS profissional,
  ba.day_of_week,
  ba.start_time,
  ba.end_time,
  ba.break_start_time,
  ba.break_end_time,
  ba.active
FROM public.booking_availability AS ba
JOIN public.booking_professionals AS bp ON bp.id = ba.professional_id
ORDER BY bp.name, ba.day_of_week;
