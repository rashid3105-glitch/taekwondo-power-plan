

## Stronger password requirements

Raise the minimum password from 6 → **8 characters** and require some complexity, applied consistently everywhere a password is set.

### Rules enforced

A new password must satisfy **all** of:
- At least **8 characters**
- At least one **letter**
- At least one **number**

(Special characters allowed but not required — keeps it usable on mobile, still a meaningful step up.)

Login (sign-in) is **not** affected — existing users with old 6-char passwords can still sign in. The new rules apply only when a password is being **created or changed**.

### Where it applies

1. **Sign up** — `src/pages/Auth.tsx`
2. **Password reset** — `src/pages/ResetPassword.tsx`
3. **Coach creating an athlete account** — `src/pages/CoachDashboard.tsx` (the `newAthletePassword` field) + matching server check in `supabase/functions/create-athlete/index.ts` (currently `password.length < 6`).

### Implementation

- Add a tiny shared helper `src/lib/passwordValidation.ts` exporting `validatePassword(pw): { ok: boolean; messageKey: TranslationKey }` so all three forms share one rule set.
- In each form: validate on submit before calling Supabase; if invalid, show a toast with a clear message and stop. Update `minLength` to `8` and add a small inline hint under the password field ("At least 8 characters, with a letter and a number").
- In `create-athlete` edge function: replace the `password.length < 6` check with the same rule (length ≥ 8 + letter + number) and return a clear error code (`WEAK_PASSWORD`) so the coach UI can show a localized message.
- **Lovable Cloud Auth setting**: enable **Leaked Password Protection (HIBP)** so passwords found in known breaches are rejected by the auth backend itself. This will be turned on via the auth configuration tool during implementation.

### Translations

Add 2 new keys × 6 locales (EN/DA/SV/DE/AR/NO) in `src/i18n/translations.ts`:
- `passwordRequirementsHint` — "At least 8 characters, with a letter and a number"
- `passwordTooWeak` — "Password is too weak. Use at least 8 characters with a letter and a number."

### Files changed

- `src/lib/passwordValidation.ts` (new)
- `src/pages/Auth.tsx` (signup validation + hint, `minLength={8}`)
- `src/pages/ResetPassword.tsx` (validation + hint, `minLength={8}`)
- `src/pages/CoachDashboard.tsx` (athlete creation field + hint, `minLength={8}`)
- `supabase/functions/create-athlete/index.ts` (server-side rule)
- `src/i18n/translations.ts` (2 keys × 6 locales)
- Lovable Cloud auth: enable HIBP leaked-password check

### Out of scope

- No forced password reset for existing users with short passwords — they keep working until they change their password.
- No password strength meter / progress bar — kept minimal per the existing UI style.

