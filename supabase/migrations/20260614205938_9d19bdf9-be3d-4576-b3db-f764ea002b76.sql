
-- Create the fixed "Deleted user" system profile used for anonymizing NOT NULL FK columns
-- when a user is permanently deleted. Idempotent.

DO $$
DECLARE
  v_id uuid := '00000000-0000-0000-0000-0000deadbeef';
BEGIN
  -- 1) Ensure auth.users row exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_id) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin,
      banned_until
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_id,
      'authenticated', 'authenticated',
      'deleted-user@system.sportstalent.local',
      '!!disabled-no-login!!',
      now(), now(), now(),
      '{"provider":"system","providers":["system"]}'::jsonb,
      '{"display_name":"Slettet bruger","system":true}'::jsonb,
      false,
      'infinity'::timestamptz
    );
  END IF;

  -- 2) Ensure profiles row exists (handle_new_user trigger may have created it; upsert sentinel values)
  INSERT INTO public.profiles (user_id, display_name, role, is_approved, is_demo)
  VALUES (v_id, 'Slettet bruger', 'athlete', false, false)
  ON CONFLICT (user_id) DO UPDATE
    SET display_name = 'Slettet bruger',
        is_approved = false,
        is_demo = false;
END $$;
