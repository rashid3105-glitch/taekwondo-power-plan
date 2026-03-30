
-- Allow athletes to mark comments on their own diary entries as read
CREATE POLICY "Athletes can mark comments as read"
ON public.diary_comments FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.diary_entries de
    WHERE de.id = diary_entry_id AND de.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.diary_entries de
    WHERE de.id = diary_entry_id AND de.user_id = auth.uid()
  )
);
