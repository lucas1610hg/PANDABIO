BEGIN;

ALTER FUNCTION public.is_workspace_owner(UUID)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.has_workspace_access(UUID)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_profile_id()
  SET search_path = public, pg_temp;
ALTER FUNCTION public.check_availability(VARCHAR, UUID, UUID, DATE, TIME)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.trg_appointment_audit_insert()
  SET search_path = public, pg_temp;
ALTER FUNCTION public.trg_appointment_audit_update()
  SET search_path = public, pg_temp;
ALTER FUNCTION public.trg_appointment_audit_delete()
  SET search_path = public, pg_temp;

COMMIT;
