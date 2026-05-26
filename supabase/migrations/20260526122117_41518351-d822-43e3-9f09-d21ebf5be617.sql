
-- 1. Restrict over-broad club-share SELECT on profiles to coaches only.
-- Non-coach club mates use a new safe `club_directory` view exposing only public-safe columns.
DROP POLICY IF EXISTS "Club members can view each other's profiles" ON public.profiles;

CREATE POLICY "Coaches view club mate profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'coach'::public.app_role)
  AND public.users_share_club(auth.uid(), user_id)
);

-- Safe directory view (definer rights). Filters access in WHERE so unauthorized
-- callers see nothing. Exposes only non-sensitive identity fields.
CREATE OR REPLACE VIEW public.club_directory
WITH (security_invoker = false) AS
SELECT
  p.user_id,
  p.display_name,
  p.avatar_url,
  p.belt_level,
  p.club_id,
  p.discipline,
  p.country
FROM public.profiles p
WHERE auth.uid() IS NOT NULL AND (
  p.user_id = auth.uid()
  OR public.users_share_club(auth.uid(), p.user_id)
  OR EXISTS (
    SELECT 1 FROM public.coach_athletes ca
    WHERE (ca.coach_id = auth.uid() AND ca.athlete_id = p.user_id)
       OR (ca.athlete_id = auth.uid() AND ca.coach_id = p.user_id)
  )
  OR public.is_parent_of(auth.uid(), p.user_id)
  OR public.is_parent_of(p.user_id, auth.uid())
);

REVOKE ALL ON public.club_directory FROM PUBLIC, anon;
GRANT SELECT ON public.club_directory TO authenticated;

-- 2. Add input length/format checks to anonymous contact_submissions inserts.
DROP POLICY IF EXISTS "Anyone can insert contact submissions" ON public.contact_submissions;

CREATE POLICY "Anyone can insert contact submissions"
ON public.contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(btrim(name))    BETWEEN 1 AND 120
  AND length(btrim(email)) BETWEEN 3 AND 255
  AND email ~* '^[A-Za-z0-9._%%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND length(btrim(message)) BETWEEN 1 AND 5000
);

-- 3. Scope athlete_week_technique_focus coach access by coach-athlete link or shared club.
DROP POLICY IF EXISTS "Coaches manage athlete focus" ON public.athlete_week_technique_focus;

CREATE POLICY "Coaches manage athlete focus"
ON public.athlete_week_technique_focus
FOR ALL
TO authenticated
USING (
  public.is_admin(auth.uid())
  OR (
    public.has_role(auth.uid(), 'coach'::public.app_role)
    AND (
      EXISTS (
        SELECT 1 FROM public.coach_athletes ca
        WHERE ca.coach_id = auth.uid() AND ca.athlete_id = athlete_week_technique_focus.athlete_id
      )
      OR public.users_share_club(auth.uid(), athlete_week_technique_focus.athlete_id)
    )
  )
)
WITH CHECK (
  public.is_admin(auth.uid())
  OR (
    public.has_role(auth.uid(), 'coach'::public.app_role)
    AND (
      EXISTS (
        SELECT 1 FROM public.coach_athletes ca
        WHERE ca.coach_id = auth.uid() AND ca.athlete_id = athlete_week_technique_focus.athlete_id
      )
      OR public.users_share_club(auth.uid(), athlete_week_technique_focus.athlete_id)
    )
  )
);
