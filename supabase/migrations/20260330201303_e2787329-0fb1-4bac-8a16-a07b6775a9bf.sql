
-- Coach comments on diary entries
CREATE TABLE public.diary_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_entry_id uuid NOT NULL REFERENCES public.diary_entries(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_diary_comments_entry ON public.diary_comments(diary_entry_id);
CREATE INDEX idx_diary_comments_coach ON public.diary_comments(coach_id);

-- Updated_at trigger
CREATE TRIGGER update_diary_comments_updated_at
  BEFORE UPDATE ON public.diary_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.diary_comments ENABLE ROW LEVEL SECURITY;

-- Athletes can view comments on their own diary entries
CREATE POLICY "Athletes can view comments on own entries"
ON public.diary_comments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.diary_entries de
    WHERE de.id = diary_entry_id AND de.user_id = auth.uid()
  )
);

-- Coaches can view comments they wrote
CREATE POLICY "Coaches can view own comments"
ON public.diary_comments FOR SELECT TO authenticated
USING (coach_id = auth.uid());

-- Coaches can insert comments on their athletes' or club members' diary entries
CREATE POLICY "Coaches can insert comments"
ON public.diary_comments FOR INSERT TO authenticated
WITH CHECK (
  coach_id = auth.uid()
  AND has_role(auth.uid(), 'coach')
  AND EXISTS (
    SELECT 1 FROM public.diary_entries de
    WHERE de.id = diary_entry_id
    AND (
      EXISTS (SELECT 1 FROM public.coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = de.user_id)
      OR users_share_club(auth.uid(), de.user_id)
    )
  )
);

-- Coaches can update their own comments
CREATE POLICY "Coaches can update own comments"
ON public.diary_comments FOR UPDATE TO authenticated
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

-- Coaches can delete their own comments
CREATE POLICY "Coaches can delete own comments"
ON public.diary_comments FOR DELETE TO authenticated
USING (coach_id = auth.uid());
