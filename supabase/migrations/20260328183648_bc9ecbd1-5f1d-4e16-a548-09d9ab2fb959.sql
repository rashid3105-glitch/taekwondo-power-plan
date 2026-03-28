
-- Event reminders table
CREATE TABLE public.event_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  athlete_id uuid NOT NULL,
  title text NOT NULL,
  event_date date NOT NULL,
  message text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;

-- Coaches can create reminders for their athletes
CREATE POLICY "Coaches can insert reminders for their athletes"
  ON public.event_reminders FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = coach_id
    AND EXISTS (
      SELECT 1 FROM coach_athletes
      WHERE coach_athletes.coach_id = auth.uid()
        AND coach_athletes.athlete_id = event_reminders.athlete_id
    )
  );

-- Coaches can view reminders they created
CREATE POLICY "Coaches can view their own reminders"
  ON public.event_reminders FOR SELECT TO authenticated
  USING (auth.uid() = coach_id);

-- Athletes can view their own reminders
CREATE POLICY "Athletes can view their reminders"
  ON public.event_reminders FOR SELECT TO authenticated
  USING (auth.uid() = athlete_id);

-- Athletes can update (mark as read) their own reminders
CREATE POLICY "Athletes can update their reminders"
  ON public.event_reminders FOR UPDATE TO authenticated
  USING (auth.uid() = athlete_id);

-- Coaches can delete reminders they created
CREATE POLICY "Coaches can delete their reminders"
  ON public.event_reminders FOR DELETE TO authenticated
  USING (auth.uid() = coach_id);
