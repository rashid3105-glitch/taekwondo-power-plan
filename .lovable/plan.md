## Plan

Make wearable sync actually work, and make its status reporting honest.

### 1. Fix the misleading "synced" state
- Stop updating the connection's `last_sync_at` until samples are successfully stored.
- Only show "Last sync" in the UI when real data was ingested. Otherwise show "Connected — waiting for first data".
- In the toast, say "No new data received" instead of "Sync done" when zero samples come back.

### 2. Make sync actually pull data
- Diagnose why the device returns zero samples. Today the database has a fresh sync timestamp but **zero rows in wearable_samples**, which means the native bridge is returning an empty list.
- Verify the app is being run inside the **native iOS/Android build** (not Safari/Chrome on the phone). Apple Health and Health Connect cannot be read from a browser — even mobile Safari.
- If running natively, log what `capacitor-health` returns so we can see whether:
  - permissions were actually granted
  - the requested data types are enabled in Apple Health → Sharing → SPORTS TALENT
  - the time window is too narrow (we'll widen the first manual sync to 14 days)
- Add a one-tap "Re-request permissions" button that re-prompts Apple Health / Health Connect, since iOS silently denies types the user toggled off.

### 3. Better diagnostics in the Sync screen
- Show a per-metric breakdown: Sleep / Resting HR / HRV / Steps / Workouts — how many samples were read on the last attempt.
- Show a clear reason when 0 samples were received (permissions, wrong app context, no recent watch data).
- Keep the existing "Last error" panel but make it surface permission errors clearly.

### 4. Validate
- Re-run a sync from the native app and confirm rows appear in `wearable_samples` and the Recovery tile populates.
- Confirm the connection timestamp only updates on a real successful pull.

### What I found
- `wearable_connections.last_sync_at` is being updated **before** any samples are inserted, so it shows a recent time even when nothing was stored.
- `wearable_samples` is currently empty for your account, which is why nothing appears anywhere downstream (Recovery tile, readiness prefill, etc.).
- The most common cause of this empty state is opening the app in a mobile browser instead of the installed native iOS/Android app — HealthKit and Health Connect are not accessible from web.

### Technical scope
Files to touch:
- `supabase/functions/ingest-wearable-samples/index.ts` — only bump `last_sync_at` when `inserted > 0`.
- `src/lib/wearables/index.ts` — log per-metric counts, widen manual sync window, expose re-request permissions.
- `src/pages/WearablesSettings.tsx` and `src/pages/WearablesSync.tsx` — honest labels, per-metric breakdown, "Re-request permissions" button.

No DB migration required.