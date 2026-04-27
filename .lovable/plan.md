## Goal
Recover Zakinah’s missing post-competition reflection so it appears in the coach dashboard.

## Current state
- Zakinah exists in the backend as `Zakinah Haidari`.
- Her competition `British Open 2026` on `2026-04-25` exists in the backend.
- There is currently **no** row for her in `competition_reflections`.
- The current reflection flow is **offline-first**: unsynced reflections stay in the athlete’s local device storage until that device syncs.

## What this means
A true server-side “manual sync” is **not possible right now** because the missing reflection payload is not stored in the backend yet. If Zakinah completed it while offline, the source data is still on **her device**, not in Lovable Cloud.

## Plan
1. **Attempt device-side recovery first**
   - Have Zakinah open the app on the same device/browser she used to submit the reflection.
   - Make sure she is online.
   - Open the post-competition reflection screen and use the existing **Sync now** action.

2. **If it still does not sync, capture the exact failure**
   - Inspect the request/error from her session to see whether the problem is auth, payload validation, or another backend rejection.
   - Use that error to determine whether the reflection can be synced automatically after a targeted fix.

3. **If you want a real manual fallback for future cases, implement it**
   - Add a coach/admin recovery path that can create a reflection row manually when an athlete’s local sync is stuck or their device data is lost.
   - Keep this scoped and protected so only authorized staff can create or repair reflections for their athletes.

## Technical details
```text
Current flow:
Athlete device (IndexedDB outbox) -> generate-competition-reflection -> competition_reflections row -> coach dashboard

Current blocker:
No competition_reflections row exists for Zakinah,
and the unsynced draft is not stored server-side.
```

## Recommended next action
Use Zakinah’s original device/browser to press **Sync now** while online. If you want, the next implementation can be a protected manual coach/admin recovery tool for stuck reflections.