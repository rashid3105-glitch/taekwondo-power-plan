-- Free-form coach-to-athlete messages (separate from event_reminders)
CREATE TABLE public.coach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  athlete_id uuid NOT NULL,
  subject text NOT NULL,
  body text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_coach_messages_athlete ON public.coach_messages(athlete_id, created_at DESC);
CREATE INDEX idx_coach_messages_coach ON public.coach_messages(coach_id, created_at DESC);

ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;

-- Athletes view own messages
CREATE POLICY "Athletes view own messages"
ON public.coach_messages FOR SELECT TO authenticated
USING (auth.uid() = athlete_id);

-- Coaches view their sent messages
CREATE POLICY "Coaches view own sent messages"
ON public.coach_messages FOR SELECT TO authenticated
USING (auth.uid() = coach_id);

-- Coaches insert messages to their managed or club athletes
CREATE POLICY "Coaches send messages to their athletes"
ON public.coach_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = coach_id
  AND has_role(auth.uid(), 'coach'::app_role)
  AND (
    EXISTS (SELECT 1 FROM public.coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = coach_messages.athlete_id)
    OR users_share_club(auth.uid(), athlete_id)
  )
);

-- Coaches can delete their own sent messages
CREATE POLICY "Coaches delete own sent messages"
ON public.coach_messages FOR DELETE TO authenticated
USING (auth.uid() = coach_id);

-- RPC for athletes to mark a message as read
CREATE OR REPLACE FUNCTION public.mark_coach_message_read(_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.coach_messages
  SET is_read = true
  WHERE id = _message_id
    AND athlete_id = auth.uid();
END;
$$;