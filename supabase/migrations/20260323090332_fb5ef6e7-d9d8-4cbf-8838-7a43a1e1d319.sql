
-- Physical test results table
CREATE TABLE public.physical_test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  test_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'speed',
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT '',
  test_type TEXT NOT NULL DEFAULT 'individual',
  tested_by UUID,
  notes TEXT DEFAULT '',
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.physical_test_results ENABLE ROW LEVEL SECURITY;

-- Users can view their own results
CREATE POLICY "Users can view their own test results"
  ON public.physical_test_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own results (individual tests)
CREATE POLICY "Users can insert their own test results"
  ON public.physical_test_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND test_type = 'individual');

-- Users can delete their own results
CREATE POLICY "Users can delete their own test results"
  ON public.physical_test_results FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Coaches can view athlete test results
CREATE POLICY "Coaches can view athlete test results"
  ON public.physical_test_results FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM coach_athletes
    WHERE coach_athletes.coach_id = auth.uid()
      AND coach_athletes.athlete_id = physical_test_results.user_id
  ));

-- Coaches can insert test results for their athletes
CREATE POLICY "Coaches can insert athlete test results"
  ON public.physical_test_results FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coach_athletes
      WHERE coach_athletes.coach_id = auth.uid()
        AND coach_athletes.athlete_id = physical_test_results.user_id
    ) AND test_type = 'coach'
  );

-- Coaches can delete athlete test results they created
CREATE POLICY "Coaches can delete athlete test results"
  ON public.physical_test_results FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coach_athletes
      WHERE coach_athletes.coach_id = auth.uid()
        AND coach_athletes.athlete_id = physical_test_results.user_id
    )
  );
