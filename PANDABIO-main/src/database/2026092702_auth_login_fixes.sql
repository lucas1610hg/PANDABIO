CREATE OR REPLACE FUNCTION public.resolve_login_email(login_identifier text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email
  FROM public.profiles
  WHERE lower(username) = lower(regexp_replace(trim(login_identifier), '^@+', ''))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.resolve_login_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_login_email(text) TO anon, authenticated;
