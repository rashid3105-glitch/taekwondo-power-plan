
-- ============================================================
-- CHAT / MESSAGING
-- ============================================================

-- Tables ------------------------------------------------------
CREATE TABLE public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('direct','group')),
  title text,
  club_id uuid,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_thread_members (
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz NOT NULL DEFAULT now(),
  muted boolean NOT NULL DEFAULT false,
  PRIMARY KEY (thread_id, user_id)
);
CREATE INDEX idx_chat_thread_members_user ON public.chat_thread_members(user_id);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL DEFAULT '',
  attachment_path text,
  attachment_type text,
  attachment_size_bytes integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_chat_messages_thread_created ON public.chat_messages(thread_id, created_at DESC);

ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_thread_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Helpers (SECURITY DEFINER to avoid recursion) ---------------
CREATE OR REPLACE FUNCTION public.is_chat_thread_member(_thread uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_thread_members
    WHERE thread_id = _thread AND user_id = _uid
  )
$$;

CREATE OR REPLACE FUNCTION public.can_chat_with(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _a <> _b AND (
    EXISTS (SELECT 1 FROM public.coach_athletes
             WHERE (coach_id = _a AND athlete_id = _b)
                OR (coach_id = _b AND athlete_id = _a))
    OR public.users_share_club(_a, _b)
  )
$$;

-- RLS policies ------------------------------------------------
CREATE POLICY "Members view threads"
  ON public.chat_threads FOR SELECT TO authenticated
  USING (public.is_chat_thread_member(id, auth.uid()));

CREATE POLICY "Owner updates thread"
  ON public.chat_threads FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.chat_thread_members
                 WHERE thread_id = id AND user_id = auth.uid() AND role = 'owner'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.chat_thread_members
                 WHERE thread_id = id AND user_id = auth.uid() AND role = 'owner'));

CREATE POLICY "Members view membership"
  ON public.chat_thread_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_chat_thread_member(thread_id, auth.uid()));

CREATE POLICY "Members update own membership"
  ON public.chat_thread_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Self leave thread"
  ON public.chat_thread_members FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Members view messages"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (public.is_chat_thread_member(thread_id, auth.uid()) AND deleted_at IS NULL);

CREATE POLICY "Members send messages"
  ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_chat_thread_member(thread_id, auth.uid()));

CREATE POLICY "Sender soft-deletes own message"
  ON public.chat_messages FOR UPDATE TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Attachment size + bump thread ------------------------------
CREATE OR REPLACE FUNCTION public.chat_message_before_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.attachment_size_bytes IS NOT NULL AND NEW.attachment_size_bytes > 1048576 THEN
    RAISE EXCEPTION 'Attachment exceeds 1 MB limit';
  END IF;
  IF (NEW.body IS NULL OR length(trim(NEW.body)) = 0) AND NEW.attachment_path IS NULL THEN
    RAISE EXCEPTION 'Message must have text or attachment';
  END IF;
  IF length(NEW.body) > 2000 THEN
    RAISE EXCEPTION 'Message too long';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_chat_message_before_insert
BEFORE INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.chat_message_before_insert();

CREATE OR REPLACE FUNCTION public.chat_message_after_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.chat_threads
     SET last_message_at = NEW.created_at, updated_at = now()
   WHERE id = NEW.thread_id;
  -- Auto-mark as read for sender
  UPDATE public.chat_thread_members
     SET last_read_at = NEW.created_at
   WHERE thread_id = NEW.thread_id AND user_id = NEW.sender_id;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_chat_message_after_insert
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.chat_message_after_insert();

-- RPCs --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_direct_thread(_other_user uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_thread uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT public.can_chat_with(v_uid, _other_user) THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  -- Find existing direct thread between the two
  SELECT t.id INTO v_thread
  FROM public.chat_threads t
  WHERE t.kind = 'direct'
    AND EXISTS (SELECT 1 FROM public.chat_thread_members m1
                WHERE m1.thread_id = t.id AND m1.user_id = v_uid)
    AND EXISTS (SELECT 1 FROM public.chat_thread_members m2
                WHERE m2.thread_id = t.id AND m2.user_id = _other_user)
    AND (SELECT COUNT(*) FROM public.chat_thread_members m WHERE m.thread_id = t.id) = 2
  LIMIT 1;

  IF v_thread IS NOT NULL THEN
    RETURN v_thread;
  END IF;

  INSERT INTO public.chat_threads (kind, created_by) VALUES ('direct', v_uid)
  RETURNING id INTO v_thread;

  INSERT INTO public.chat_thread_members (thread_id, user_id, role)
  VALUES (v_thread, v_uid, 'owner'), (v_thread, _other_user, 'member');

  RETURN v_thread;
END $$;

CREATE OR REPLACE FUNCTION public.create_group_thread(_title text, _member_ids uuid[])
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_thread uuid;
  v_member uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT has_role(v_uid, 'coach'::app_role) THEN RAISE EXCEPTION 'coach_only'; END IF;
  IF _title IS NULL OR length(trim(_title)) = 0 THEN RAISE EXCEPTION 'title_required'; END IF;
  IF coalesce(array_length(_member_ids, 1), 0) = 0 THEN RAISE EXCEPTION 'members_required'; END IF;

  FOREACH v_member IN ARRAY _member_ids LOOP
    IF v_member <> v_uid AND NOT public.can_chat_with(v_uid, v_member) THEN
      RAISE EXCEPTION 'invalid_member';
    END IF;
  END LOOP;

  INSERT INTO public.chat_threads (kind, title, created_by)
  VALUES ('group', trim(_title), v_uid)
  RETURNING id INTO v_thread;

  INSERT INTO public.chat_thread_members (thread_id, user_id, role)
  VALUES (v_thread, v_uid, 'owner');

  FOREACH v_member IN ARRAY _member_ids LOOP
    IF v_member <> v_uid THEN
      INSERT INTO public.chat_thread_members (thread_id, user_id, role)
      VALUES (v_thread, v_member, 'member')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  RETURN v_thread;
END $$;

CREATE OR REPLACE FUNCTION public.mark_chat_thread_read(_thread_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.chat_thread_members
     SET last_read_at = now()
   WHERE thread_id = _thread_id AND user_id = auth.uid();
END $$;

CREATE OR REPLACE FUNCTION public.get_unread_chat_counts()
RETURNS TABLE(thread_id uuid, unread_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.thread_id,
         COUNT(msg.id) AS unread_count
  FROM public.chat_thread_members m
  LEFT JOIN public.chat_messages msg
    ON msg.thread_id = m.thread_id
   AND msg.sender_id <> m.user_id
   AND msg.deleted_at IS NULL
   AND msg.created_at > m.last_read_at
  WHERE m.user_id = auth.uid()
  GROUP BY m.thread_id
$$;

CREATE OR REPLACE FUNCTION public.add_chat_group_member(_thread uuid, _user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.chat_thread_members
                 WHERE thread_id = _thread AND user_id = auth.uid() AND role = 'owner') THEN
    RAISE EXCEPTION 'owner_only';
  END IF;
  IF NOT public.can_chat_with(auth.uid(), _user) THEN
    RAISE EXCEPTION 'invalid_member';
  END IF;
  INSERT INTO public.chat_thread_members (thread_id, user_id, role)
  VALUES (_thread, _user, 'member')
  ON CONFLICT DO NOTHING;
END $$;

CREATE OR REPLACE FUNCTION public.remove_chat_group_member(_thread uuid, _user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.chat_thread_members
                 WHERE thread_id = _thread AND user_id = auth.uid() AND role = 'owner') THEN
    RAISE EXCEPTION 'owner_only';
  END IF;
  DELETE FROM public.chat_thread_members
   WHERE thread_id = _thread AND user_id = _user AND role <> 'owner';
END $$;

CREATE OR REPLACE FUNCTION public.rename_chat_group(_thread uuid, _title text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.chat_thread_members
                 WHERE thread_id = _thread AND user_id = auth.uid() AND role = 'owner') THEN
    RAISE EXCEPTION 'owner_only';
  END IF;
  UPDATE public.chat_threads SET title = trim(_title), updated_at = now() WHERE id = _thread;
END $$;

-- Notification preference column ------------------------------
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS chat_messages boolean NOT NULL DEFAULT true;

-- Storage bucket ----------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments','chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Chat members read attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND public.is_chat_thread_member(((storage.foldername(name))[1])::uuid, auth.uid())
  );

CREATE POLICY "Chat members upload attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND public.is_chat_thread_member(((storage.foldername(name))[1])::uuid, auth.uid())
  );

CREATE POLICY "Sender deletes own attachment"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND owner = auth.uid()
  );

-- Realtime ----------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_thread_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_threads;

ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.chat_thread_members REPLICA IDENTITY FULL;
ALTER TABLE public.chat_threads REPLICA IDENTITY FULL;
