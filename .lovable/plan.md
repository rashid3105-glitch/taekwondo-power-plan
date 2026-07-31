## Goal

A new admin-only page at `/admin/stats` that shows platform user statistics: a KPI summary at the top and a detailed, filterable table of users below.

## Summary section (KPI cards)

- Total users
- Active last 7 days / last 30 days (based on most recent activity: diary entries, workout logs, readiness check-ins, chat messages)
- New signups this month (plus previous-month comparison)
- Approved vs. pending approval
- Paid vs. demo vs. unpaid
- Role split: athletes / coaches / parents / admins
- Clubs: total clubs, users without a club
- Small bar chart: signups per month, last 12 months (recharts, already in project)

## Table section

One row per user with columns:
- Name, email, club, country
- Role (athlete/coach/parent/admin)
- Approved, payment status, demo expiry
- Created date, last activity date
- Activity counters: diary entries, workout logs, tests, competitions

Controls:
- Search by name/email/club
- Filters: club, role, status (approved/pending, paid/unpaid/demo), activity (active 30d / inactive 30d)
- Sortable columns (created, last activity, name)
- CSV export of the currently filtered rows
- Pagination (50 per row page)

## Technical approach

- New page `src/pages/AdminStats.tsx`, route `/admin/stats` in `src/App.tsx`, entry in the admin block of `src/components/GlobalAppMenu.tsx`. Page guards with the existing `is_admin` RPC (same pattern as `AdminPayments.tsx`).
- New security-definer DB function `public.get_admin_user_stats()` that returns one JSON payload: summary aggregates + per-user rows (profile fields, role from `user_roles`, club name, last-activity timestamp and counts computed with lateral aggregates). It raises `not_admin` unless `is_admin(auth.uid())`, so no data leaks to non-admins and the client makes a single call instead of many table queries.
- Emails come from the existing `get-admin-users` edge function (already returns an id→email map) and are merged client-side.
- Styling follows the existing Noir & Gold admin pages; all labels go through `t()` with keys added for all 7 languages.
- Help page/changelog updated with a short entry for the new admin statistics page.

## Notes

- Read-only page: no writes, no schema changes to existing tables.
- "Last activity" is derived from existing tables; there is no login-timestamp table, so it reflects in-app activity rather than sessions.
