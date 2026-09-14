ALTER TABLE public.diary_comments
  ADD COLUMN IF NOT EXISTS author_role text NOT NULL DEFAULT 'coach';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'diary_comments_author_role_check'
  ) THEN
    ALTER TABLE public.diary_comments
      ADD CONSTRAINT diary_comments_author_role_check
      CHECK (author_role IN ('coach','athlete'));
  END IF;
END $$;

DROP POLICY IF EXISTS "Athletes can reply on own entries" ON public.diary_comments;
CREATE POLICY "Athletes can reply on own entries"
ON public.diary_comments
FOR INSERT
TO authenticated
WITH CHECK (
  coach_id = auth.uid()
  AND author_role = 'athlete'
  AND is_shared = true
  AND EXISTS (
    SELECT 1 FROM public.diary_entries de
    WHERE de.id = diary_comments.diary_entry_id
      AND de.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Club coaches can view athlete replies" ON public.diary_comments;
CREATE POLICY "Club coaches can view athlete replies"
ON public.diary_comments
FOR SELECT
TO authenticated
USING (
  author_role = 'athlete'
  AND is_shared = true
  AND has_role(auth.uid(), 'coach'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.diary_entries de
    WHERE de.id = diary_comments.diary_entry_id
      AND (
        EXISTS (
          SELECT 1 FROM public.coach_athletes ca
          WHERE ca.coach_id = auth.uid() AND ca.athlete_id = de.user_id
        )
        OR is_coach_of_athletes_club(de.user_id)
      )
  )
);