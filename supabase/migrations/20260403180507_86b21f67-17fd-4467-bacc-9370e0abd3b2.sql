
-- Create secure function for marking reminders as read
CREATE OR REPLACE FUNCTION public.mark_reminder_read(_reminder_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE event_reminders
  SET is_read = true
  WHERE id = _reminder_id
    AND athlete_id = auth.uid();
END;
$$;

-- Drop the overly broad athlete UPDATE policy
DROP POLICY "Athletes can update their reminders" ON event_reminders;
