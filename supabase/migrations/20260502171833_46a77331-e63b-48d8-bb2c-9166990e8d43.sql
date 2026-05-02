
CREATE TABLE public.subscription_tiers (
  id text PRIMARY KEY,
  name text NOT NULL,
  athlete_limit int NOT NULL DEFAULT 1,
  plans_per_type int,
  all_modules boolean NOT NULL DEFAULT false,
  price_monthly_dkk int NOT NULL DEFAULT 0,
  price_yearly_dkk int NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tiers are public readable"
ON public.subscription_tiers FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Admins manage tiers"
ON public.subscription_tiers FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_subscription_tiers_updated
BEFORE UPDATE ON public.subscription_tiers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.subscription_tiers (id, name, athlete_limit, plans_per_type, all_modules, price_monthly_dkk, price_yearly_dkk, sort_order) VALUES
  ('athlete',     'Athlete',     1,  1,    false, 49,  490,  10),
  ('coach_solo',  'Coach',       1,  NULL, true,  99,  990,  20),
  ('team_small',  'Team Small',  5,  NULL, true,  299, 2990, 30),
  ('team_medium', 'Team Medium', 15, NULL, true,  599, 5990, 40),
  ('team_large',  'Team Large',  25, NULL, true,  999, 9990, 50);

CREATE TABLE public.subscriptions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id text REFERENCES public.subscription_tiers(id),
  status text NOT NULL DEFAULT 'inactive',
  stripe_customer_id text,
  stripe_subscription_id text,
  billing_cycle text,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own subscription"
ON public.subscriptions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins read all subscriptions"
ON public.subscriptions FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_subscriptions_updated
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
