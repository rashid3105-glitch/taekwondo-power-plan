CREATE TABLE public.chat_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX idx_chat_reactions_message ON public.chat_reactions(message_id);

ALTER TABLE public.chat_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reactions"
  ON public.chat_reactions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Thread members can read reactions"
  ON public.chat_reactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_messages cm
      JOIN public.chat_thread_members ctm ON ctm.thread_id = cm.thread_id
      WHERE cm.id = chat_reactions.message_id AND ctm.user_id = auth.uid()
    )
  );