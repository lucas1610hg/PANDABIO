-- =============================================================
-- Migration T4: Função RPC toggle_link_status(UUID)
-- Data: 2026-09-20
-- Descrição: Inverte o campo `active` de um link por id, garantindo
--            atomicidade no servidor (evita race-condition de read-then-write).
-- =============================================================

-- UP
CREATE OR REPLACE FUNCTION toggle_link_status(link_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  current_active BOOLEAN;
  new_active BOOLEAN;
BEGIN
  SELECT active INTO current_active
  FROM links
  WHERE id = link_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  new_active := NOT current_active;

  UPDATE links
  SET active = new_active,
      updated_at = now()
  WHERE id = link_id;

  RETURN new_active;
END;
$$;

-- DOWN
-- DROP FUNCTION IF EXISTS toggle_link_status(UUID);
