CREATE OR REPLACE FUNCTION public.edit_chat_message(_id uuid, _body text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF length(trim(_body)) = 0 THEN RAISE EXCEPTION 'empty_body'; END IF;
  IF length(_body) > 2000 THEN RAISE EXCEPTION 'too_long'; END IF;
  UPDATE public.chat_messages
     SET body = trim(_body), edited_at = now()
   WHERE id = _id AND sender_id = auth.uid() AND deleted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found_or_not_owner'; END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.edit_chat_message(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_chat_message(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  UPDATE public.chat_messages
     SET deleted_at = now()
   WHERE id = _id AND sender_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found_or_not_owner'; END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.delete_chat_message(uuid) TO authenticated;