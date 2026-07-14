
CREATE OR REPLACE FUNCTION public.get_chat_members_display(_ids uuid[])
RETURNS TABLE(user_id uuid, display_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.avatar_url
  FROM public.profiles p
  WHERE p.user_id = ANY(_ids)
    AND (
      p.user_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.chat_thread_members me
        JOIN public.chat_thread_members other
          ON other.thread_id = me.thread_id
        WHERE me.user_id = auth.uid()
          AND other.user_id = p.user_id
      )
    )
$$;

GRANT EXECUTE ON FUNCTION public.get_chat_members_display(uuid[]) TO authenticated;
