CREATE TABLE IF NOT EXISTS public.coach_license_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_license_fields TO authenticated;
GRANT ALL ON public.coach_license_fields TO service_role;

ALTER TABLE public.coach_license_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own fields"
  ON public.coach_license_fields
  FOR ALL
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Authenticated read coach fields"
  ON public.coach_license_fields
  FOR SELECT
  USING (auth.role() = 'authenticated');

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_values jsonb NOT NULL DEFAULT '{}'::jsonb;
