ALTER TABLE public.chat_threads
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_chat_threads_archived ON public.chat_threads (archived_at) WHERE archived_at IS NOT NULL;