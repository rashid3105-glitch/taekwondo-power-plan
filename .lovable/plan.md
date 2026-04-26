## Goal
Make it obvious to athletes **where and when** to complete a post-competition reflection. Today the entry point is buried at the bottom of `/competitions`, with no prompt elsewhere.

## Changes

### 1. Dashboard prompt banner (primary fix)
Add a dismissible **"Reflect on your recent competition"** prompt card to `src/pages/Dashboard.tsx` that appears when:
- The athlete has at least one competition with `event_date` in the **last 14 days**
- AND no `competition_reflections` row exists yet for that competition

Card shows:
- Competition name + date + result (if present)
- Sparkles icon, primary-colored CTA "Start reflection" → navigates to `/competitions/:id/reflect`
- Small "Later" ghost button that hides it for that session (sessionStorage key per comp id)

If multiple unreflected past comps exist, show the most recent one only.

### 2. Move "Past competitions" up + add empty-state hint on Competitions page
In `src/pages/Competitions.tsx`:
- Reorder so **Past competitions** section appears **above** the upcoming list when at least one past comp is unreflected (so the CTA is the first thing the athlete sees on return after an event)
- When there are no past comps yet, add a small helper line under the page title: *"After each competition, you'll be able to reflect and set goals here."*

### 3. Inline "Reflect" CTA on each upcoming card once it becomes past
Already handled — but ensure the **"Reflect" button uses the primary variant + pulse animation** for the first 7 days after the event date, fading to outline variant afterward, so it visually stands out.

### 4. Help / onboarding copy
Add a one-line entry to `src/pages/Help.tsx` FAQ explaining the reflection flow and where to find it. Add changelog entry 85 ("Easier access to post-competition reflection").

### 5. i18n keys
Add ~6 new keys across all 6 languages (DA, EN, SV, DE, AR, NO) in `src/i18n/translations.ts`:
- `dashboardReflectPromptTitle`
- `dashboardReflectPromptDesc`
- `dashboardReflectPromptCTA`
- `dashboardReflectPromptLater`
- `competitionsReflectHint`
- `helpFAQReflection`

## Out of scope (ask first if you want them)
- Push notification 24–48h after event_date (would need cron + push infra changes)
- Email reminder via the transactional queue
- Auto-create a reflection draft when a competition date passes