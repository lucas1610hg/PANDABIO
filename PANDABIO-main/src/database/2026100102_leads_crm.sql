BEGIN;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS medium TEXT,
  ADD COLUMN IF NOT EXISTS campaign TEXT,
  ADD COLUMN IF NOT EXISTS referrer TEXT,
  ADD COLUMN IF NOT EXISTS landing_page TEXT,
  ADD COLUMN IF NOT EXISTS device TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS score INTEGER NOT NULL DEFAULT 70,
  ADD COLUMN IF NOT EXISTS interest TEXT NOT NULL DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS first_access_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_access_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS related_type TEXT,
  ADD COLUMN IF NOT EXISTS related_name TEXT,
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS visitor_id TEXT;

ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE public.leads
  ADD CONSTRAINT leads_status_check
  CHECK (status IN ('new', 'contacted', 'interested', 'converted', 'lost'));

ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_interest_check;
ALTER TABLE public.leads
  ADD CONSTRAINT leads_interest_check
  CHECK (interest IN ('low', 'medium', 'high'));

ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_score_check;
ALTER TABLE public.leads
  ADD CONSTRAINT leads_score_check
  CHECK (score >= 0 AND score <= 100);

CREATE INDEX IF NOT EXISTS idx_leads_profile_status
  ON public.leads(profile_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leads_profile_source
  ON public.leads(profile_id, source, created_at DESC);

DROP POLICY IF EXISTS "Users can update own leads" ON public.leads;
CREATE POLICY "Users can update own leads" ON public.leads
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id)
  ) WITH CHECK (
    auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id)
  );

DROP POLICY IF EXISTS "Users can delete own leads" ON public.leads;
CREATE POLICY "Users can delete own leads" ON public.leads
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id)
  );

COMMIT;
