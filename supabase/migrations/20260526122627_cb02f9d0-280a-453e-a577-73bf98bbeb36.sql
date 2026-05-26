DROP VIEW IF EXISTS public.club_directory;

CREATE VIEW public.club_directory
WITH (security_invoker = true) AS
SELECT p.user_id, p.display_name, p.avatar_url, p.belt_level, p.club_id, p.discipline, p.country
FROM public.profiles p
WHERE auth.uid() IS NOT NULL AND (
  p.user_id = auth.uid()
  OR public.users_share_club(auth.uid(), p.user_id)
  OR EXISTS (SELECT 1 FROM public.coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = p.user_id)
  OR EXISTS (SELECT 1 FROM public.parent_athletes pa WHERE pa.parent_user_id = auth.uid() AND pa.athlete_id = p.user_id)
);

GRANT SELECT ON public.club_directory TO authenticated;