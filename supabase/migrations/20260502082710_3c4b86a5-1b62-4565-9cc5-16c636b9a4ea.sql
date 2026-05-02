-- Add per-comment sharing toggle
ALTER TABLE public.diary_comments
  ADD COLUMN IF NOT EXISTS is_shared boolean NOT NULL DEFAULT true;

-- Allow other coaches in the same club to read SHARED diary comments
-- when the club has share_coach_notes enabled.
CREATE POLICY "Club coaches can view shared diary comments"
ON public.diary_comments
FOR SELECT
TO authenticated
USING (
  is_shared = true
  AND coach_id <> auth.uid()
  AND has_role(auth.uid(), 'coach'::app_role)
  AND users_share_club(auth.uid(), coach_id)
  AND EXISTS (
    SELECT 1 FROM public.diary_entries de
    WHERE de.id = diary_comments.diary_entry_id
      AND users_share_club(auth.uid(), de.user_id)
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.club_id IS NOT NULL
      AND club_shares_coach_notes(p.club_id)
  )
);