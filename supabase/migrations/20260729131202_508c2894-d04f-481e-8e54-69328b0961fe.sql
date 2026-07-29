ALTER TABLE public.diary_entries ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Coaches read club diary v2" ON public.diary_entries;

CREATE POLICY "Coaches read club diary v2"
ON public.diary_entries
FOR SELECT
USING (
  is_private = false
  AND (
    ((club_id IS NOT NULL) AND is_coach_of_club(club_id))
    OR (
      (club_id IS NULL) AND (
        EXISTS (
          SELECT 1 FROM public.coach_athletes ca
          WHERE ca.coach_id = auth.uid() AND ca.athlete_id = diary_entries.user_id
        )
        OR (has_role(auth.uid(), 'coach'::app_role) AND users_share_club(auth.uid(), user_id))
      )
    )
  )
);