---
name: Mobile UX baseline
description: Touch target heights, safe areas, haptics, top-center toaster, skeleton loaders, and form input attributes that all new mobile UI must follow
type: design
---

## Touch targets
- `Button` default = `h-11` mobile / `h-10` desktop. `icon` = `h-11 w-11` mobile / `h-10 w-10` desktop. `sm` stays `h-9` (secondary use only).
- `Input` = `h-11` mobile / `h-10` desktop. Don't override below `h-11` on the primary form field.
- Bottom-nav buttons must be at least 48px tall (`minHeight: 48` style).

## Inputs
- Every `type="number"` MUST also have `inputMode="numeric"` (whole numbers) or `inputMode="decimal"` (weight, kg, %). Existing audit done across ProfileSetup, Competitions, CoachDashboard, AdminApproval, AdminClubs, AddRecipeForm, AddExerciseForm, CoachAthleteDetail, AIPlanCard, PublicProfileSettings.
- Auth/email-style inputs use `autoComplete`, `autoCapitalize="none"`, `autoCorrect="off"`, `spellCheck={false}`.
- Multi-field forms set `enterKeyHint` ("next" / "done" / "go") to drive the soft-keyboard return key.

## Toaster
- `sonner` is mounted with `position="top-center"` so toasts never collide with the bottom nav or iOS home indicator.

## Safe area
- Sticky headers use `pt-safe`. Bottom nav uses `pb-safe`. Page wrappers use `pb-16 sm:pb-0` to clear the nav.

## Haptics
- Use `src/lib/haptics.ts`. iOS-safe no-op fallback (iOS Safari ignores `vibrate`). Wired into bottom nav tab changes. Safe to call from any handler — never throws.

## Loading states
- Replace bare spinners with skeleton blocks (`animate-pulse rounded-md bg-muted`) on Diary list and ProgressDashboard. Initial Dashboard load still uses `SplashScreen`.

## Global CSS (index.css)
- `-webkit-tap-highlight-color: transparent` applied globally to kill blue tap flash.
- `-webkit-text-size-adjust: 100%` on `html` to prevent iOS auto-scaling.
- Buttons/links/`[role=button]` get `touch-action: manipulation` and `user-select: none`.
- Inputs in iOS get `font-size: 16px` to prevent focus auto-zoom.
