BEGIN;

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  stripe_monthly_price_id TEXT,
  stripe_annual_price_id TEXT,
  monthly_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (monthly_amount_cents >= 0),
  annual_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (annual_amount_cents >= 0),
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'incomplete' CHECK (status IN ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_one_live_per_profile
  ON public.subscriptions(profile_id)
  WHERE status IN ('trialing', 'active', 'past_due', 'unpaid', 'paused');

CREATE INDEX IF NOT EXISTS subscriptions_profile_id_idx ON public.subscriptions(profile_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON public.subscriptions(stripe_customer_id);

INSERT INTO public.subscription_plans (id, name, monthly_amount_cents, annual_amount_cents, limits, features)
VALUES
  ('free', 'Gratuito', 0, 0, '{"links":5,"products":3,"analytics_days":7,"storage_mb":100,"leads":50}'::jsonb, '["Página pública","Até 5 links","Até 3 produtos","Analytics de 7 dias"]'::jsonb),
  ('creator', 'Creator', 1490, 14900, '{"links":-1,"products":20,"analytics_days":90,"storage_mb":1000,"leads":500}'::jsonb, '["Links ilimitados","Até 20 produtos","Analytics de 90 dias","Analytics de produtos"]'::jsonb),
  ('pro', 'Pro', 2990, 29900, '{"links":-1,"products":-1,"analytics_days":-1,"storage_mb":5000,"leads":-1}'::jsonb, '["Analytics completo","Domínio próprio","Exportação de leads","Agendamentos completos"]'::jsonb),
  ('business', 'Business', 7990, 79900, '{"links":-1,"products":-1,"analytics_days":-1,"storage_mb":20000,"leads":-1,"workspaces":5,"team_members":10}'::jsonb, '["Múltiplos profissionais","Workspaces adicionais","Relatórios avançados","Equipe e permissões"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  monthly_amount_cents = EXCLUDED.monthly_amount_cents,
  annual_amount_cents = EXCLUDED.annual_amount_cents,
  limits = EXCLUDED.limits,
  features = EXCLUDED.features,
  updated_at = now();

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT;

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view active subscription plans"
  ON public.subscription_plans FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;

COMMIT;
