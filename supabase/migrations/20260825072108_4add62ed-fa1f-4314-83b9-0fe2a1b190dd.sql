CREATE POLICY "Coaches insert weight logs for managed athletes"
ON public.weight_logs FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = weight_logs.user_id));

CREATE POLICY "Coaches update weight logs for managed athletes"
ON public.weight_logs FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = weight_logs.user_id))
WITH CHECK (EXISTS (SELECT 1 FROM public.coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = weight_logs.user_id));