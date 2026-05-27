# Remove HealthBridge re-sync

The "Re-sync from iPhone" button on `/health` and its hint text reference the deprecated HealthBridge sync. The new iOS Shortcut → `sync-health-data` pipeline replaces it. Baselines are still refreshed automatically via the existing `mirror_health_data_to_summary` DB trigger (which calls `recompute_wearable_summary` on every `health_data` insert/update), so removing the `resync-health` call is safe.

## Changes

**`src/pages/Health.tsx`**
- Remove `runResync`, `handleResync`, the `syncing` state, the `RefreshCw` import, and the auto-sync-on-mount block (lines ~334–339 reading `health:lastAutoSync`).
- Remove the "Re-sync from iPhone" `<Button>` (line 460) and the `healthResyncHint` paragraph (line 479).
- Keep "Opsæt iPhone Sync" and "AI rapport" buttons, and the `healthResyncError` toast usage inside `downloadAIReport` — replace that toast with `t("healthReportNoData")` or a generic auth error so the deprecated key can be removed.

**`supabase/functions/sync-health-data/index.ts`**
- Drop the fire-and-forget `fetch(.../resync-health)` block (lines 134–143). The `mirror_health_data_to_summary` trigger already updates `wearable_daily_summary` + 7-day baselines on each upsert.

**`src/i18n/translations.ts`** (all 7 locales: en, da, sv, de, ar, no, es)
- Remove keys: `healthResyncButton`, `healthResyncHint`, `healthResyncSuccess`, `healthResyncError`.
- Leave `changelogEntry93` text intact (historical record).

## Verification
- `/health` still loads, charts render, manual entry + AI report + iPhone Sync setup buttons still work.
- New iOS Shortcut POST still upserts `health_data`; baselines refresh via DB trigger.
- No remaining references to `resync-health` or `healthResync*` in `src/` or `supabase/`.
