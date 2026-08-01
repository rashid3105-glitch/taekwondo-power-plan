## What I found

- The daily scan (`check-compliance-alerts`) already dedupes anti-doping "missing" reminders per calendar month: `period_key = missing|YYYY-MM`, enforced by the unique index `compliance_alerts_unique (recipient_id, athlete_id, alert_type, period_key)`.
- Database confirms only two batches exist: `missing|2026-07` (56 alerts, Jul 29) and `missing|2026-08` (54 alerts, Aug 1) — and `email_send_log` shows compliance emails only on Jul 29 and Aug 1.

So the real problem is the calendar-month key: a run late in a month is followed by a brand-new month bucket days later, so recipients got two reminders 3 days apart.

## Fix

In `supabase/functions/check-compliance-alerts/index.ts`, add a rolling 30-day throttle for anti-doping reminders instead of relying on the calendar month:

1. Before inserting an alert/queueing an email for `alert_type = 'antidoping'`, look up the most recent `compliance_alerts` row for that `recipient_id + athlete_id + alert_type` and skip entirely if it is newer than 30 days.
2. Do this as one batched query per run (fetch latest anti-doping alert per recipient/athlete for the athletes in this scan), not per row, to keep the run fast.
3. Keep `period_key` as the month bucket for backwards compatibility with the existing unique index — the 30-day check becomes the primary gate.

Also applies naturally to the expiring/expired anti-doping variants, so an athlete never receives more than one anti-doping reminder per 30 days regardless of severity changes.

GAL licence and MyFightBook alerts stay as they are (keyed to a specific expiry date + severity, so they don't repeat).

## Technical notes

- Only the edge function changes; no schema migration needed.
- Function is redeployed after the edit; the existing pg_cron daily schedule is unchanged.
