
-- Allow authenticated users to look up a single profile by athlete_code (for coach linking)
CREATE POLICY "Anyone can lookup by athlete_code" ON public.profiles
  FOR SELECT TO authenticated USING (true);
