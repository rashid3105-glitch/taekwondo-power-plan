insert into public.subscription_tiers (id, name, athlete_limit, all_modules, price_monthly_dkk, price_yearly_dkk, sort_order)
values
  ('club', 'Klub', 50, true, 625, 7500, 60),
  ('club_plus', 'Klub Plus', 100, true, 1000, 12000, 70)
on conflict (id) do nothing;

update public.stripe_webhook_events set processed_at = null, error = null
where event_id in ('evt_1UD3q2CrYQiZxdDXozJbXQpV','evt_1UD3q3CrYQiZxdDX5ZpMtJSV');