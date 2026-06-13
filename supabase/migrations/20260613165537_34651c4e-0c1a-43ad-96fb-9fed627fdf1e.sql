
CREATE TABLE public.consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL,
  consent_type text NOT NULL DEFAULT 'health_data_processing',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','granted','withdrawn')),
  granted_by_email text,
  granted_by_relation text CHECK (granted_by_relation IN ('parent','self')),
  policy_version text,
  granted_at timestamptz,
  withdrawn_at timestamptz,
  grace_until timestamptz,
  club_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, consent_type)
);

GRANT SELECT ON public.consent_records TO authenticated;
GRANT ALL ON public.consent_records TO service_role;

ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athlete reads own consent"
  ON public.consent_records FOR SELECT TO authenticated
  USING (auth.uid() = athlete_id);

CREATE POLICY "Coach of athlete club reads consent"
  ON public.consent_records FOR SELECT TO authenticated
  USING (public.is_coach_of_athletes_club(athlete_id));

CREATE POLICY "Linked parent reads consent"
  ON public.consent_records FOR SELECT TO authenticated
  USING (public.is_parent_of(auth.uid(), athlete_id));

CREATE POLICY "Admin reads consent"
  ON public.consent_records FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_consent_records_updated_at
  BEFORE UPDATE ON public.consent_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_consent_records_athlete ON public.consent_records(athlete_id);
CREATE INDEX idx_consent_records_club ON public.consent_records(club_id);

CREATE TABLE public.consent_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  athlete_id uuid NOT NULL,
  parent_email text NOT NULL,
  consent_type text NOT NULL DEFAULT 'health_data_processing',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.consent_tokens TO service_role;

ALTER TABLE public.consent_tokens ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_consent_tokens_athlete ON public.consent_tokens(athlete_id);
