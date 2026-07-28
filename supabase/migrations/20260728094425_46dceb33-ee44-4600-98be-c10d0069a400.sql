CREATE TABLE public.antidoping_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  test_date DATE NOT NULL,
  file_path TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.antidoping_certificates TO authenticated;
GRANT ALL ON public.antidoping_certificates TO service_role;
ALTER TABLE public.antidoping_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own antidoping certificates" ON public.antidoping_certificates
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX antidoping_certificates_user_idx ON public.antidoping_certificates(user_id, test_date DESC);