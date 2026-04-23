

## Tiny "What's new" inline link under the hero CTA

A single line of text appears just below the hero CTA buttons on the landing page, showing the latest highlighted update. The admin (you) controls exactly what's shown via a small admin-only editor.

```text
[ Get started → ]  [ Methodology ]

✨ New: Match video analysis — see what's new
```

Clicking the link goes to `/help#changelog`.

## How admin control works

A new tiny database table `landing_announcements` stores the current announcement:

| column | purpose |
|---|---|
| `id` | uuid |
| `text_en`, `text_da`, `text_sv`, `text_de`, `text_ar`, `text_no` | localized one-liner (e.g. "Match video analysis") |
| `link_url` | defaults to `/help#changelog`, editable |
| `is_active` | only one row active at a time |
| `updated_at` | timestamp |

**RLS:**
- Public `SELECT` allowed where `is_active = true` (so logged-out visitors see it)
- `INSERT` / `UPDATE` / `DELETE` restricted to admins only (via existing `has_role(auth.uid(), 'admin')`)

Admin edits it from a new small section on the existing **`/admin/approval`** page (or its own `/admin/announcement` route — see question below) with:
- 6 text inputs (one per language), each max ~60 chars
- Optional link URL field
- "Show on landing page" toggle
- Save button

If no active announcement exists, the inline link simply doesn't render — landing stays clean.

## Frontend

- New component `src/components/landing/WhatsNewInline.tsx`
  - Fetches the active announcement once on mount (single row, public read)
  - Picks the text matching current language; falls back to `text_en` if empty
  - Renders nothing if no row or empty text for both current lang and English
  - Style: small muted text, `✨` prefix, underlined "see what's new" link, framer-motion fade-in matching the existing hero animation timing (delay ~0.85)
- Mounted in `src/pages/Index.tsx` directly under the social-proof chips / `ctaSubtext` paragraph in the hero
- New admin component `src/components/admin/AnnouncementEditor.tsx` mounted on the admin page

## Translations

Add 2 keys per locale (EN/DA/SV/DE/AR/NO):
- `whatsNewPrefix` — "New" / "Nyt" / "Nytt" / "Neu" / "جديد" / "Nytt"
- `whatsNewLink` — "see what's new" / "se hvad der er nyt" / etc.

Admin editor labels reuse existing admin translation patterns.

## Files changed

- `supabase/migrations/<timestamp>_landing_announcements.sql` (new table + RLS)
- `src/components/landing/WhatsNewInline.tsx` (new)
- `src/components/admin/AnnouncementEditor.tsx` (new)
- `src/pages/Index.tsx` (mount inline link in hero)
- `src/pages/AdminApproval.tsx` (mount editor) — *or new route, see question*
- `src/i18n/translations.ts` (2 keys × 6 locales + admin editor labels)

## Out of scope

- No automatic pulling from changelog — admin types the headline manually (gives you full control over tone/length)
- No history of past announcements — only one active row at a time. Old ones can be deactivated and overwritten or kept inactive in DB.
- No dismiss-per-user — the link is small enough to live permanently; admin removes it by toggling off

## One small decision needed

Where should the admin editor live? Options:
1. Inside the existing `/admin/approval` page as a collapsible section at the top
2. Its own route `/admin/announcement` linked from the admin nav
3. Inside `/admin/clubs` or `/admin/payments` as a tab

I'd default to **option 1** (least navigation, you already visit that page often) unless you prefer otherwise — let me know after approving and I'll wire it up accordingly.

