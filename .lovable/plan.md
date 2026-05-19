## Goal

Show each user's last activity timestamp directly on the admin user card (not only as a hover tooltip on the green/grey online dot).

## Source of data

- `profiles.last_seen_at` is already selected in `AdminApproval.tsx` (line 128) and used today only for the online indicator (line 513–515).
- No backend / migration changes needed. (Optionally we could also fetch `auth.users.last_sign_in_at` via `get-admin-users`, but `last_seen_at` is more meaningful — it tracks actual app usage, not just login — and is already available.)

## Change

In `src/pages/AdminApproval.tsx`, on each user card add a small muted line such as:

- Online now → "Online nu"
- Seen within 24h → "Sidst set: 2 t siden"
- Older → "Sidst set: 19. maj 2026, 14:32"
- Never → "Aldrig logget ind"

Format with a tiny helper (relative for <24h, absolute date+time otherwise) using the current locale. Place it just under the display name / role badges so it's scannable without hovering.

Keep the existing green/grey dot as-is.

## Scope

- One file edited: `src/pages/AdminApproval.tsx`
- No DB migration, no edge function changes, no new translations strings required beyond a short label (add to `src/i18n/translations.ts` if you want it localized in DA/EN/SV/DE/AR/NO/FA — otherwise Danish-only inline is fine; confirm preference).

## Open question

Do you want the label localized across all 7 app languages, or just Danish for now?

just Danish for now