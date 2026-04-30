-- Add entry_type column to diary_entries with validation trigger
ALTER TABLE public.diary_entries
ADD COLUMN IF NOT EXISTS entry_type text NOT NULL DEFAULT 'general';

CREATE OR REPLACE FUNCTION public.validate_diary_entry_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.entry_type NOT IN ('general', 'training', 'competition', 'recovery', 'mental', 'injury') THEN
    RAISE EXCEPTION 'Invalid entry_type: %. Allowed: general, training, competition, recovery, mental, injury', NEW.entry_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_diary_entry_type_trigger ON public.diary_entries;
CREATE TRIGGER validate_diary_entry_type_trigger
BEFORE INSERT OR UPDATE ON public.diary_entries
FOR EACH ROW
EXECUTE FUNCTION public.validate_diary_entry_type();

CREATE INDEX IF NOT EXISTS idx_diary_entries_user_type ON public.diary_entries(user_id, entry_type);