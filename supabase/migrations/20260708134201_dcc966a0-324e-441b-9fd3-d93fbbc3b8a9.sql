
CREATE TABLE public.parent_guide_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  message_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_user_id, athlete_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.parent_guide_conversations TO authenticated;
GRANT ALL ON public.parent_guide_conversations TO service_role;

ALTER TABLE public.parent_guide_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parents_read_own_convo" ON public.parent_guide_conversations
  FOR SELECT TO authenticated
  USING (parent_user_id = auth.uid());

CREATE POLICY "parents_insert_own_convo" ON public.parent_guide_conversations
  FOR INSERT TO authenticated
  WITH CHECK (parent_user_id = auth.uid());

CREATE POLICY "parents_update_own_convo" ON public.parent_guide_conversations
  FOR UPDATE TO authenticated
  USING (parent_user_id = auth.uid())
  WITH CHECK (parent_user_id = auth.uid());

CREATE POLICY "parents_delete_own_convo" ON public.parent_guide_conversations
  FOR DELETE TO authenticated
  USING (parent_user_id = auth.uid());

CREATE INDEX parent_guide_conversations_parent_idx
  ON public.parent_guide_conversations (parent_user_id, athlete_id);

CREATE TRIGGER parent_guide_conversations_updated_at
  BEFORE UPDATE ON public.parent_guide_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
