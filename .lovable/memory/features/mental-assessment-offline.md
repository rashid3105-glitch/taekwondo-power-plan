---
name: mental-assessment-offline
description: IndexedDB cache + outbox for mental performance assessments; advice generation queues until back online
type: feature
---
The mental performance assessment works offline:

- `src/lib/mentalAssessmentOfflineDB.ts` — IndexedDB stores `assessments` (cached rows) and `outbox` (pending submissions with answers/scores/profile/language snapshot).
- `src/lib/mentalAssessmentSyncEngine.ts` — On reconnect, calls the `generate-mental-advice` Edge Function for each queued intent, then inserts into `mental_assessments` and replaces the local placeholder id with the server id.
- `src/hooks/useOfflineMentalAssessments.ts` — Local-first hook with `submitOffline`/`removeAssessment`/`refresh`. Auto-syncs on `online` events. Returns the synced row inline when network is available so the UI can render advice immediately.
- `src/components/MentalAssessment.tsx` — Uses the hook for history + submission. Offline submissions show a `Pending` badge in history (CloudOff icon) and a "Saved offline. Personalized advice will be generated when you reconnect." card on the results screen.

Translation strings: local `translations` map in `MentalAssessment.tsx` includes `pending` and `adviceWillSyncOnline` for all 5 supported locales (en, da, sv, de, ar).

Caveats: Without internet, no AI advice is shown — only the score/radar. The advice arrives the next time the user opens the app online (sync runs on mount and on `online` event).
