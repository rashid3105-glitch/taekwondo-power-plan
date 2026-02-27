
CREATE TABLE public.user_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'strength',
  muscle_groups TEXT[] NOT NULL DEFAULT '{}',
  sets INTEGER NOT NULL DEFAULT 3,
  reps TEXT NOT NULL DEFAULT '8-10',
  tempo TEXT,
  rest TEXT NOT NULL DEFAULT '90 sec',
  notes TEXT NOT NULL DEFAULT '',
  video_url TEXT,
  why_it_matters TEXT NOT NULL DEFAULT '',
  alternatives JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exercises" ON public.user_exercises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own exercises" ON public.user_exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own exercises" ON public.user_exercises FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own exercises" ON public.user_exercises FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_exercises_updated_at
  BEFORE UPDATE ON public.user_exercises
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
