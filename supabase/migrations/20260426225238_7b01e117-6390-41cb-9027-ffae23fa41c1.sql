-- Coach-only private comments on competition reflections.
-- Mirrors coach_athlete_notes pattern but per-reflection.
CREATE TABLE public.coach_reflection_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reflection_id uuid NOT NULL REFERENCES public.competition_reflections(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL,
  athlete_id uuid NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reflection_id, coach_id)
);

ALTER TABLE public.coach_reflection_comments ENABLE ROW LEVEL SECURITY;

-- Coaches can read/write only their own comments, and only if they coach this athlete
-- (managed via coach_athletes) OR share a club.
CREATE POLICY "Coaches manage own reflection comments"
ON public.coach_reflection_comments
FOR ALL
TO authenticated
USING (
  auth.uid() = coach_id
  AND has_role(auth.uid(), 'coach'::app_role)
  AND (
    EXISTS (SELECT 1 FROM public.coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = coach_reflection_comments.athlete_id)
    OR users_share_club(auth.uid(), coach_reflection_comments.athlete_id)
  )
)
WITH CHECK (
  auth.uid() = coach_id
  AND has_role(auth.uid(), 'coach'::app_role)
  AND (
    EXISTS (SELECT 1 FROM public.coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = coach_reflection_comments.athlete_id)
    OR users_share_club(auth.uid(), coach_reflection_comments.athlete_id)
  )
);

CREATE INDEX idx_coach_reflection_comments_reflection ON public.coach_reflection_comments(reflection_id);
CREATE INDEX idx_coach_reflection_comments_coach ON public.coach_reflection_comments(coach_id);

CREATE TRIGGER set_updated_at_coach_reflection_comments
BEFORE UPDATE ON public.coach_reflection_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();