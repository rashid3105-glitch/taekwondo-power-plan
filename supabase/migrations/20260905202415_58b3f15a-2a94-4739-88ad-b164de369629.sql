DO $$
BEGIN
  PERFORM cron.unschedule('daily-consent-reminders');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'daily-consent-reminders',
  '10 7 * * *',
  $cron$
  select net.http_post(
    url := 'https://zklwergsziidgyxewbkw.supabase.co/functions/v1/send-consent-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'email_queue_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $cron$
);