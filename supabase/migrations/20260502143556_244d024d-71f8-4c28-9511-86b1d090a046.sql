CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  club text NOT NULL,
  email text NOT NULL,
  locale text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(name)  BETWEEN 1 AND 120 AND
    char_length(club)  BETWEEN 1 AND 120 AND
    char_length(email) BETWEEN 3 AND 254 AND
    email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );

CREATE POLICY "Admins read waitlist"
  ON public.waitlist FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE INDEX waitlist_email_idx ON public.waitlist (email);