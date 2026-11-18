BEGIN;

ALTER VIEW public.public_profile_pages OWNER TO postgres;
ALTER VIEW public.public_profile_pages SET (security_invoker = false);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.public_profile_pages TO anon, authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
