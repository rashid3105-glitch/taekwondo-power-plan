CREATE TABLE public.club_module_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  module text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, module)
);
ALTER TABLE public.club_module_defaults ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage club module defaults"
  ON public.club_module_defaults FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Authenticated read club module defaults"
  ON public.club_module_defaults FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE TABLE public.athlete_module_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module text NOT NULL,
  enabled boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module)
);
ALTER TABLE public.athlete_module_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage athlete module overrides"
  ON public.athlete_module_overrides FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Athletes read own overrides"
  ON public.athlete_module_overrides FOR SELECT
  USING (auth.uid() = user_id);