
-- 1. Add missing UPDATE policy on mental_assessments
CREATE POLICY "Users can update their own assessments"
ON mental_assessments FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Add missing SELECT policy for athletes on coach_athletes
CREATE POLICY "Athletes can view their coach relationships"
ON coach_athletes FOR SELECT TO authenticated
USING (auth.uid() = athlete_id);

-- 3. Create secure function for marking comments as read
CREATE OR REPLACE FUNCTION public.mark_comment_read(_comment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE diary_comments
  SET is_read = true
  WHERE id = _comment_id
    AND EXISTS (
      SELECT 1 FROM diary_entries
      WHERE id = diary_comments.diary_entry_id
        AND user_id = auth.uid()
    );
END;
$$;

-- 4. Drop the overly broad athlete UPDATE policy
DROP POLICY "Athletes can mark comments as read" ON diary_comments;
