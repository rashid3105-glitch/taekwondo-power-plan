

## Public athlete profile + highlight reel

A shareable, SEO-friendly page at `/athlete/:code` (using the existing `athlete_code`, e.g. `TKD-123456`) that any logged-out visitor can view. Athletes control what's exposed via opt-in toggles. Drives organic signups via "Powered by Sportstalent" CTA and gives athletes a link for recruiters/sponsors.

### What the public page shows

```text
┌─────────────────────────────────────────────────┐
│  [Avatar]  ALEX HANSEN                          │
│            Black belt · Sparring · Denmark      │
│            Aalborg TKD Klub                     │
│            [Share] [Download as PDF]            │
├─────────────────────────────────────────────────┤
│  ACHIEVEMENTS              PERSONAL RECORDS     │
│  🥇 1st Nordic Cup '25     Vertical jump 62 cm  │
│  🥈 2nd Danish Open '25    20m sprint   2.9 s   │
│  🥉 3rd ETU Cadet '24      Sit & reach  +18 cm  │
├─────────────────────────────────────────────────┤
│  HIGHLIGHT REEL                                 │
│  ▶ YouTube embed 1   ▶ YouTube embed 2          │
├─────────────────────────────────────────────────┤
│  COMPETITION HISTORY (past, with results)       │
│  • Nordic Cup       Mar 2025  -68kg  Gold       │
│  • Danish Open      Feb 2025  -68kg  Silver     │
├─────────────────────────────────────────────────┤
│  Powered by Sportstalent — [Train like Alex →]  │
└─────────────────────────────────────────────────┘
```

If the athlete has not opted in, the page shows a friendly "This profile is private" message with a CTA back to the landing page.

### Athlete-side controls (in profile setup)

A new "Public profile" section in `/profile-setup` with:
- Toggle: **Make profile publicly shareable** (default OFF)
- Toggle: Show achievements
- Toggle: Show personal records (auto-pulled from `physical_test_results`, top 1 per test)
- Toggle: Show competition history
- Toggle: Show highlight videos
- Up to 4 highlight video URLs (YouTube/Vimeo only — validated)
- Up to 6 free-text achievements (title + year + medal)
- Copy-to-clipboard share link: `https://sportstalent.dk/athlete/TKD-123456`

### Routing & SEO

- New route `/athlete/:code` in `src/App.tsx` (public, no auth gate).
- `PageMeta` with athlete name + club for OG/Twitter cards so links unfurl nicely on Instagram/WhatsApp/X.
- JSON-LD `Person` schema for Google.
- Sitemap entry generated dynamically? Out of scope — we'll add a single `/athletes` index later if needed. For now `noindex` until athlete opts in, then `index, follow`.

### Technical notes

**Schema changes (one migration):**
- `profiles`: add `is_public boolean DEFAULT false`, `public_show_achievements boolean DEFAULT true`, `public_show_prs boolean DEFAULT true`, `public_show_competitions boolean DEFAULT true`, `public_show_videos boolean DEFAULT true`.
- New table `athlete_achievements` (id, user_id, title, year, medal, sort_order, timestamps) — RLS: owner full CRUD; public SELECT only when owner's `profiles.is_public = true`.
- New table `athlete_highlight_videos` (id, user_id, url, title, sort_order) — same RLS pattern, plus a CHECK that url matches youtube/vimeo.
- `competitions`: add `result text` and `is_public boolean DEFAULT false` so athletes can mark *which* past competitions to show.

**Public read access without exposing the whole profiles table:**
- New SECURITY DEFINER function `public.get_public_athlete_profile(_code text)` that returns only the safe public fields (display_name, belt_level, discipline, country, club name, avatar_url) when `is_public = true`, else returns nothing. Avoids RLS opening on the main profiles table.
- New SECURITY DEFINER function `public.get_public_athlete_bundle(_code text)` returns one JSON payload with profile + achievements + top PRs + public competitions + videos in a single call.
- Avatars: the `avatars` bucket is private (per recent security fix). The function returns the storage path; we issue a signed URL via a tiny `get-public-avatar` edge function (no auth) that only signs paths belonging to a user with `is_public = true`.

**Frontend files:**
- New `src/pages/PublicAthlete.tsx` — fetches the bundle via `supabase.rpc("get_public_athlete_bundle", { _code })`, renders sections conditionally.
- New `src/components/profile/PublicProfileSettings.tsx` — toggles + achievements editor + video URL list, embedded in `ProfileSetup.tsx`.
- Update `src/components/CompetitionCard` (inside `Competitions.tsx`) to add a per-competition "show on public profile" toggle and "result" field.
- Update `src/App.tsx`: add `<Route path="/athlete/:code" element={<Page><PublicAthlete /></Page>} />`.
- Add ~25 translation keys to `src/i18n/translations.ts` for all 6 locales.

**Sharing affordances:**
- Native Web Share API where available, fallback to copy-to-clipboard.
- "Download as PDF" reuses the existing PDF export pattern from training/nutrition exports.

### Out of scope (can follow later)
- Sponsor inquiry form on the public page
- Verified badge / coach endorsement
- Public `/athletes` directory and search
- Custom vanity URLs (e.g. `/athlete/alex-hansen`) — would need uniqueness/profanity checks

### Privacy guarantees
- Default OFF — nothing public until the athlete explicitly opts in.
- Email, age, weight, injury notes, training plans, diary, mental scores, readiness data are **never** exposed by `get_public_athlete_bundle`.
- One-click "Make profile private" instantly hides the page (no caching).

