## Goal

When the user enables the "I own a wearable" checkbox in Profile, open a guided **Connect Wizard** that walks them through every common iOS failure cause one step at a time, with a clear "next fix" CTA at each step. No more dumping diagnostics and hoping the user pieces it together.

## Trigger

In `src/pages/ProfileSetup.tsx`, when `ownsWearable` is toggled from `false → true`, immediately open the wizard as a full-screen `Dialog` (not navigation, so the user keeps their profile context). The wizard can also be re-opened later from `WearablesSettings` via a "Run guided setup" button.

## The wizard — one step visible at a time

A single `WearableConnectWizard` component with a numbered stepper at the top and exactly **one actionable card** below. Each step has:
- A clear title ("Step 2 of 5 — Install the iOS app")
- Why this matters (1 short sentence)
- The exact thing to do
- A primary CTA button that performs the next check
- A subtle "I already did this — re-check" link

The wizard auto-advances as each check passes. The user is never shown step N+1 until step N is green.

### Step 1 — Are you in the native app?

Check: `wearableProviderForPlatform()` returns `apple_health` or `health_connect`.

- **Pass**: green check, auto-advance.
- **Fail (web/Safari)**: show "Install the Sportstalent app" card with two CTAs:
  - "Open install guide" → navigates to `/install`
  - "I've installed it — open the app and re-run setup"

  Block further steps. This is the #1 cause: Safari/PWA can't reach HealthKit.

### Step 2 — Is the native health plugin loaded?

Check: `getDiagnostics().pluginLoaded === true`.

- **Fail**: this means the user is on an old build that predates the HealthKit capability. Show:
  > "Your installed app is missing the Health bridge. Reinstall the latest build from TestFlight / App Store."
  CTA: "Open install guide" + a copy-to-clipboard of the troubleshooting steps for the user's coach/admin (`npm run build && npx cap sync ios`, add HealthKit capability in Xcode).

### Step 3 — Is HealthKit / Health Connect available on the device?

Check: `getDiagnostics().healthAvailable === true`.

- **Fail (iOS)**: rare — usually iPad without Health. Suggest using iPhone.
- **Fail (Android)**: prompt to install Health Connect from Play Store with a deep link.

### Step 4 — Tap Connect (the actual permission prompt)

This is the critical step. Card shows:
- A big "Connect Apple Health" button.
- Below it, plain-language text: "iOS will pop up a permission sheet. Tap **Turn On All**."

The button calls `requestPermissions()` synchronously inside the click handler (no awaits before — same rule as today). After resolution:
- If `getLastPermissionGrant().error` is set → show the error, offer "Try again".
- If permissions resolved but `last_grant.raw` shows nothing was granted → show:
  > "It looks like you tapped Don't Allow, or the sheet was dismissed. Open Settings → Health → Data Access → Sportstalent and turn each metric on."
  CTA: "Open iOS Settings" (uses `window.location.href = "App-Prefs:HEALTH"` on iOS — best-effort).
- If grant looks healthy → auto-advance.

If the prompt **never appeared** (we detect this when the call resolves in <300 ms with no raw payload — strong sign iOS silently denied because of a broken gesture chain or missing entitlement), show:
> "iOS didn't show the permission sheet. This usually means the app needs to be reinstalled from TestFlight."
CTA: "Reset connection and try again" (calls `resetConnection()` then loops back to Step 1).

### Step 5 — Backfill and verify

Call `initialBackfill()`. Show a live progress card with the per-metric breakdown returned. After it finishes:
- If `inserted > 0` → success screen, "Done — close wizard".
- If `inserted === 0` → show per-metric checklist with what was missing (e.g. "Sleep: 0 samples — open Health → Sleep and confirm your watch is logging sleep") and a "Re-run sync" button.

## What changes in code

- **New** `src/components/wearables/WearableConnectWizard.tsx` — the dialog with the 5 stepper UI. Uses existing `getDiagnostics`, `requestPermissions`, `getLastPermissionGrant`, `initialBackfill`, `resetConnection` from `src/lib/wearables/index.ts`. No backend changes.
- **New** `src/lib/wearables/promptDetection.ts` — tiny helper that wraps `requestPermissions()` and times the call so we can flag "prompt never appeared" (resolves too fast with no raw payload).
- **Edit** `src/pages/ProfileSetup.tsx` — when the "I own a wearable" checkbox flips on, open the wizard. Persist `owns_wearable=true` only after the user dismisses the wizard (so an accidental tick can be backed out).
- **Edit** `src/pages/WearablesSettings.tsx` — add a prominent "Run guided setup" button at the top that opens the same wizard, replacing the current ad-hoc help block (we keep the existing single-screen UI for already-connected users).
- **i18n**: add wizard strings to `src/i18n/translations.ts` (DA, EN, SV, DE, AR) — title, the 5 step labels, and the per-step error CTAs. No English fallbacks.

## What we explicitly do NOT change

- No DB migration.
- No edge-function change.
- The native iOS build (Xcode capabilities, Info.plist entries) is unchanged — those are documented in `ios-healthkit-info.md` and remain a one-time native build prerequisite.

## Visuals

Stepper bar at the top: 5 dots, current = primary, completed = emerald with check, future = muted. Below it, a single card with generous padding, one big primary button, and one tertiary "Skip / I'll do this later" link that closes the wizard without touching `owns_wearable`.

Dark cockpit theme (matches the rest of the authenticated app). Haptic `tap()` on every CTA, `success()` on completion.
