
-- ============================================
-- PUSH NOTIFICATIONS
-- ============================================
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);
CREATE INDEX idx_push_subs_user ON public.push_subscriptions(user_id);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscriptions" ON public.push_subscriptions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.notification_preferences (
  user_id uuid PRIMARY KEY,
  training_reminders boolean NOT NULL DEFAULT true,
  diary_comments boolean NOT NULL DEFAULT true,
  event_reminders boolean NOT NULL DEFAULT true,
  competition_countdown boolean NOT NULL DEFAULT true,
  weight_log_reminders boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own prefs" ON public.notification_preferences
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- READINESS CHECK-IN
-- ============================================
CREATE TABLE public.readiness_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  checkin_date date NOT NULL DEFAULT CURRENT_DATE,
  sleep_hours numeric(3,1) NOT NULL,
  soreness int NOT NULL CHECK (soreness BETWEEN 1 AND 5),
  mood int NOT NULL CHECK (mood BETWEEN 1 AND 5),
  motivation int NOT NULL CHECK (motivation BETWEEN 1 AND 5),
  is_sick boolean NOT NULL DEFAULT false,
  score int NOT NULL,
  recommendation text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, checkin_date)
);
CREATE INDEX idx_readiness_user_date ON public.readiness_checkins(user_id, checkin_date DESC);
ALTER TABLE public.readiness_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own readiness" ON public.readiness_checkins
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches view athlete readiness" ON public.readiness_checkins
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM coach_athletes WHERE coach_id = auth.uid() AND athlete_id = readiness_checkins.user_id)
    OR (has_role(auth.uid(), 'coach') AND users_share_club(auth.uid(), user_id))
  );

-- ============================================
-- COMPETITIONS & WEIGHT LOGS
-- ============================================
CREATE TABLE public.competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  event_date date NOT NULL,
  weight_class_kg numeric(5,2),
  priority text NOT NULL DEFAULT 'A' CHECK (priority IN ('A','B','C')),
  location text,
  notes text,
  plan_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_competitions_user_date ON public.competitions(user_id, event_date);
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own competitions" ON public.competitions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches view athlete competitions" ON public.competitions
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM coach_athletes WHERE coach_id = auth.uid() AND athlete_id = competitions.user_id)
    OR (has_role(auth.uid(), 'coach') AND users_share_club(auth.uid(), user_id))
  );

CREATE TRIGGER update_competitions_updated_at
  BEFORE UPDATE ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  weight_kg numeric(5,2) NOT NULL CHECK (weight_kg > 20 AND weight_kg < 300),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);
CREATE INDEX idx_weight_logs_user_date ON public.weight_logs(user_id, log_date DESC);
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own weight logs" ON public.weight_logs
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches view athlete weight logs" ON public.weight_logs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM coach_athletes WHERE coach_id = auth.uid() AND athlete_id = weight_logs.user_id)
    OR (has_role(auth.uid(), 'coach') AND users_share_club(auth.uid(), user_id))
  );
