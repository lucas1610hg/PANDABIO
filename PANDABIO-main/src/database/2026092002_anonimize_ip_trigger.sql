-- =============================================================
-- Migration T6: Anonimizar IP em analytics + capturar client_addr
-- Data: 2026-09-20
-- Descrição:
--   - Função `anonymize_ip(INET)`: mascara IPv4 /24 e IPv6 /64.
--   - Trigger BEFORE INSERT: preenche ip_address (se NULL → inet_client_addr()),
--     user_agent e garante anonimização LGPD.
-- =============================================================

-- UP
CREATE OR REPLACE FUNCTION anonymize_ip(ip INET)
RETURNS INET
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN ip IS NULL THEN NULL
    WHEN family(ip) = 4 THEN set_masklen(ip, 24)
    ELSE set_masklen(ip, 64)
  END;
$$;

CREATE OR REPLACE FUNCTION trg_analytics_anonymize_ip_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  NEW.ip_address := anonymize_ip(COALESCE(NEW.ip_address, inet_client_addr()));
  NEW.user_agent := NULLIF(COALESCE(NULLIF(NEW.user_agent, ''), ''), '')::text;
  NEW.referrer := NULLIF(COALESCE(NULLIF(NEW.referrer, ''), ''), '')::text;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_analytics_anon_ip ON analytics;
CREATE TRIGGER trg_analytics_anon_ip
BEFORE INSERT ON analytics
FOR EACH ROW
EXECUTE FUNCTION trg_analytics_anonymize_ip_before_insert();

-- DOWN
-- DROP TRIGGER IF EXISTS trg_analytics_anon_ip ON analytics;
-- DROP FUNCTION IF EXISTS trg_analytics_anonymize_ip_before_insert();
-- DROP FUNCTION IF EXISTS anonymize_ip(INET);
