## Problem

On the Onboarding step "Din disiplin og nivå" (and the other onboarding steps with form fields), the `<Card>` renders on a light surface, but the inputs inside use shadcn defaults:

- `Input` → `bg-background text-base` (no explicit foreground)
- `Select` trigger → `bg-background`
- The unselected discipline toggle was already fixed to `bg-card`, but selects/inputs were not.

In coach-mode (and the new "coach-foreign-club" mode) `--background` resolves to a near-black HSL. Tailwind `bg-background` then paints the input dark, while the surrounding light card keeps `--foreground` dark — so placeholder/entered text is dark-on-dark and unreadable. The same pattern affects every onboarding step (age, weight, belt select, experience select, club select, goals notes, etc.).

This is a root-cause issue isolated to the onboarding wizard's light-card-on-dark-app context — not a global Input bug.

## Fix

Scope: `src/pages/Onboarding.tsx` only. No edits to shared `Input`/`Select` primitives (would affect every dark-mode form in the app).

1. Add a wrapper className on the onboarding `<Card>` content area (or per-field) that forces inputs and select triggers onto the card surface:
   - `Input`: add `className="bg-card text-card-foreground placeholder:text-muted-foreground"`
   - `SelectTrigger`: add `className="bg-card text-card-foreground"`
   - `SelectContent` (popover) already uses `bg-popover` — leave alone, but verify against the light card.
   - `Textarea` (goals notes step): same treatment.

2. Audit every field in all onboarding steps (athlete step 1 disciplin/belt/experience/age/weight, athlete step 2 club, athlete step 3 goals + notes, coach step 1 focus + notes, coach step 2 club) and apply the same classes consistently.

3. Verify visually in coach-mode and coach-foreign-club mode that:
   - Placeholder text is legible (muted-foreground on light card).
   - Typed values are dark-on-light.
   - Select dropdown values render readable.

4. No i18n changes, no logic changes, no changelog entry needed (pure visual bugfix on an already-shipped contrast fix), unless you'd like one — I can add a v1.2.6 changelog line.

## Files touched

- `src/pages/Onboarding.tsx` — add `bg-card text-card-foreground placeholder:text-muted-foreground` to every `Input`, `SelectTrigger`, and `Textarea` in the wizard.

## Out of scope

- `src/components/ui/input.tsx`, `select.tsx`, `textarea.tsx` — unchanged.
- Other forms in the app (Profile edit etc.) — they render on dark cards so dark-on-dark inputs aren't the problem there.
