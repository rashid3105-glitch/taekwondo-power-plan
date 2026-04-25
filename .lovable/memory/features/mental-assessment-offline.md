---
name: mental-assessment-offline
description: IndexedDB cache + outbox for mental performance assessments; advice generation queues until back online; history is robust to malformed advice and supports regenerate + confirm-delete
---
The mental performance assessment works offline:

- `src/lib/mentalAssessmentOfflineDB.ts` — IndexedDB stores `assessments` (cached rows) and `outbox` (pending submissions with answers/scores/profile/language snapshot).
- `src/lib/mentalAssessmentSyncEngine.ts` — On reconnect, calls the `generate-mental-advice` Edge Function for each queued intent, then inserts into `mental_assessments` and replaces the local placeholder id with the server id.
- `src/hooks/useOfflineMentalAssessments.ts` — Local-first hook with `submitOffline`/`removeAssessment`/`regenerateAdvice`/`refresh`. Auto-syncs on `online` events. Returns the synced row inline when network is available so the UI can render advice immediately. `refresh` normalises `ai_advice` via a `parseAdvice` helper (object passthrough, JSON-string parse, malformed → null) so the cache always holds an object or null.
- `src/components/MentalAssessment.tsx` — Uses the hook for history + submission. Offline submissions show a `Pending` badge in history (CloudOff icon) and a "Saved offline. Personalized advice will be generated when you reconnect." card on the results screen.

History UX (added 2026-04-25):
- Whole row is the click target with hover/active states and a chevron + "Tap to view" hint.
- `viewPastResult` resets `pendingAdvice`/`generating`/`diarySaved`, tracks `viewingId`, and parses advice safely (no JSON.parse crash on malformed strings).
- Deleting an entry opens a shadcn `AlertDialog` confirmation.
- When viewing a saved entry that has no advice (`!ai_advice`), a "Regenerate advice" card calls `regenerateAdvice(id, profile, locale)` which invokes `generate-mental-advice`, persists the result via `update mental_assessments set ai_advice`, and refreshes the cached row.
- Radar `previousScores` now picks the chronologically older entry (history is sorted newest-first; for fresh submits it picks the latest entry that isn't the current one).

Translation strings: local `translations` map in `MentalAssessment.tsx` includes `pending`, `adviceWillSyncOnline`, `confirmDeleteTitle`, `confirmDeleteDesc`, `cancel`, `noAdviceTitle`, `noAdviceDesc`, `regenerateAdvice`, `adviceRegenerated`, `adviceRegenerateFailed`, `tapToView` for all 5 supported locales (en, da, sv, de, ar).

Caveats: Without internet, no AI advice is shown — only the score/radar. The advice arrives the next time the user opens the app online (sync runs on mount and on `online` event). Regenerate also requires online.
