DELETE FROM public.push_subscriptions WHERE fcm_token = 'SMOKETEST_BOGUS_TOKEN_ABCDEF0123456789';
UPDATE public.profiles SET push_enabled = true WHERE user_id = 'c53f7022-b97c-44db-a960-0721d5da8ce2';