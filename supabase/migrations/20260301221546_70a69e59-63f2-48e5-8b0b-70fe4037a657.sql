
CREATE TABLE public.mental_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  scores JSONB NOT NULL DEFAULT '{}',
  total_score INTEGER NOT NULL DEFAULT 0,
  ai_advice TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mental_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own assessments" ON public.mental_assessments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assessments" ON public.mental_assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assessments" ON public.mental_assessments
  FOR DELETE USING (auth.uid() = user_id);
