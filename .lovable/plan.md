## What's actually happening

Zakinah and Danilo's reflections are **not in the database** — only Farooq's row exists in `competition_reflections`. Their British Open 2026 competitions are there, but no reflection submission ever reached the server, and `generate-competition-reflection` has zero edge function logs for them.

The post-competition reflection flow is **offline-first**: when an athlete completes the 4 steps, the submission is written to IndexedDB on their device and queued in an outbox. Only when their browser comes back online (and the tab is open) does the sync engine call the AI function and insert the row. If they finished the form on the bus / arena Wi-Fi and then closed the app before reconnecting — or the AI call failed silently — their answers are stranded on their phone and the coach sees nothing.

This means two things to fix:

1. **Recover their actual answers** — they need to reopen the app on the same device/browser where they filled it in, while online. The queued submission will then sync automatically (or we can prompt them).
2. **Prevent this happening again** — make the offline state visible to the athlete and give the coach a signal so we don't silently lose reflections.

## Plan

### 1. Athlete-side visibility for stuck submissions
In `PostCompetitionReflection.tsx` and on the dashboard reflection card:
- Show a clear **"Pending sync"** banner whenever any reflection has `pending: true` in IndexedDB, with a manual **"Sync now"** button that calls `syncCompetitionReflections()`.
- After submit, if `navigator.onLine === false`, show an explicit toast: "Saved on this device — will send to your coach when you're back online." Currently the success toast doesn't make this clear.
- On app load (once, when online), automatically retry the outbox and toast the athlete if anything was flushed: "1 reflection synced to your coach."

### 2. Coach-side empty-state hint
In `CoachAthleteReflections.tsx`, when an athlete has competitions in the past but no reflections, show a soft hint: "No reflections yet for [Athlete]. If they completed one offline, ask them to open the app while online to sync." Plus a button to send them an event reminder pointing at the reflection.

### 3. Server-side safety net (optional, recommended)
Add a fallback path in `useOfflineCompetitionReflections.submitOffline`: if the user is **online** at submit time, attempt a direct synchronous insert + AI call first, and only fall back to the outbox on failure. Today we always queue first, which is fragile when the AI call later fails and the user never reopens the app.

### 4. Immediate action for Zakinah and Danilo
Reach out and ask each to:
- Open the app on the **same phone/browser** they used to fill in the reflection
- Ensure they're online (Wi-Fi or mobile data)
- Wait for the auto-sync, or pull-to-refresh on the dashboard

Once they do, the queued row will hit the AI function and appear in your coach view automatically. If they say they never see a "pending" indicator, the data was likely lost (browser cache cleared, different device, etc.) and they'll need to re-submit.

## Files to touch
- `src/components/PostCompetitionReflection.tsx` — pending banner, clearer offline toast, manual sync button
- `src/hooks/useOfflineCompetitionReflections.ts` — try-online-first path; expose `pendingCount`
- `src/components/coach/CoachAthleteReflections.tsx` — improved empty state with reminder CTA
- `src/lib/competitionReflectionSyncEngine.ts` — surface per-intent failure reasons (currently swallowed)

No DB schema or RLS changes needed — the data path is fine, the issue is purely client-side delivery.
