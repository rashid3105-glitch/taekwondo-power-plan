-- Allow users to write their own daily summary rows (manual health entry)
CREATE POLICY "Users insert own wearable summary"
ON public.wearable_daily_summary
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own wearable summary"
ON public.wearable_daily_summary
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own wearable summary"
ON public.wearable_daily_summary
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);