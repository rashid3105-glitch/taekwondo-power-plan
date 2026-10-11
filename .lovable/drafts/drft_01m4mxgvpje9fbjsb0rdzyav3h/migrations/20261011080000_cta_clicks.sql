-- Cookieless CTA click counting for the public site. No personal data.
CREATE TABLE IF NOT EXISTS public.cta_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cta text NOT NULL CHECK (char_length(cta) BETWEEN 1 AND 60),
  page text NOT NULL CHECK (char_length(page) BETWEEN 1 AND 120),
  locale text CHECK (locale IN ('en','da','sv','de','ar','no','es')),
  device text CHECK (device IN ('mobile','desktop')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.cta_clicks TO anon, authenticated;
GRANT SELECT ON public.cta_clicks TO authenticated;
GRANT ALL ON public.cta_clicks TO service_role;

ALTER TABLE public.cta_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a CTA click"
  ON public.cta_clicks FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Platform admins can read CTA clicks"
  ON public.cta_clicks FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS cta_clicks_created_at_idx ON public.cta_clicks (created_at DESC);
