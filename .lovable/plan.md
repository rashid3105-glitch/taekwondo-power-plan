# Plan: Phone Fields + Farsi Translation Pass

## Already done (prior turn)
- `fa` added to `Locale` type, `SUPPORTED`, `RTL_LOCALES`
- LanguageContext sets `dir="rtl"` for both `ar` and `fa`
- LanguageSwitcher shows 🇮🇷 فارسی
- AI plan generators (training/nutrition/mental/rehab/match) output Persian when `language === "fa"`
- Update-my-profile zod schema accepts `fa`
- Currency/day-name helpers include Persian

Today Farsi UI strings fall back to English via:
`(translations as unknown as Record<string, typeof translations.en>).fa = translations.en;`

## What this request adds

### A. Phone number support (mechanical, ship now)
1. **Migration** — add `profiles.phone text` and `profiles.phone_country_code text default '+45'`.
2. **New file** `src/data/phoneCodes.ts` — exported `PHONE_CODES` array (16 countries).
3. **`src/pages/ProfileSetup.tsx`** — `phone` + `phoneCountryCode` state, load in `loadProfileSetupData`, include in submit payload, two-field UI (Select + Input) inserted after weight / before club.
4. **`src/pages/AdminApproval.tsx`** — extend `PendingUser`, select query, edit dialog UI, `saveEditUser` payload.
5. **`src/pages/ParentJoin.tsx`** — split existing phone input into country-code Select + number Input.
6. **`src/pages/ParentDashboard.tsx`** — same split in account settings.
7. **`supabase/functions/update-my-profile/index.ts`** — extend Zod schema with `phone` and `phone_country_code`.
8. **Translation keys** `phoneNumber` and `phoneCountryCode` added to all 7 locales (en/da/sv/de/ar/no/fa).

### B. RTL polish (small)
- `src/index.css` — add `[dir="rtl"] .rtl-flip { transform: scaleX(-1); }` and right-align inputs/textareas under RTL.
- `src/pages/Dashboard.tsx` — verify header rows use `gap-*` (not `space-x-*`) so RTL flows naturally; only adjust rows that actually break.

### C. Full Farsi UI translation — needs your call

The translations file has **~2,000 UI keys**. Producing a complete, high-quality Persian translation object in one pass means:
- Massive generated output (the file would grow by roughly the size of the English block again, ~6–7k lines).
- Real risk of awkward/incorrect Persian for domain-specific TKD terminology (belt levels, sparring drills, periodization phases, mental-skills jargon). Bulk-AI Persian for niche sports vocabulary is hit-or-miss.
- Long single-turn execution, hard for you to review.

Three realistic options — pick one:

**Option 1 — Curated core pack (recommended).** I translate ~150–250 high-traffic keys properly to Persian: nav (dashboard, diary, training, plan, profile, settings, coach, athlete, competition, belt, save/cancel/delete/edit, login/logout, etc.), readiness/diary/mental UI, common buttons/labels, errors. Everything else keeps the English fallback. This gives a usable Persian experience without flooding the file with low-confidence translations. ~1 hour of work, clean output.

**Option 2 — Full bulk Farsi pass.** I generate a complete `fa: { ... }` block for every key in `translations.en`. You should expect to revise a meaningful percentage afterwards. Removes the English fallback line. Very large diff.

**Option 3 — Defer Farsi UI.** Ship only sections A + B now; do Farsi UI later in dedicated passes per surface (e.g. "translate the Diary page", "translate the Coach dashboard").

Tell me 1, 2, or 3 and I'll execute. If you don't specify, I'll proceed with **Option 1** plus all of sections A and B.
