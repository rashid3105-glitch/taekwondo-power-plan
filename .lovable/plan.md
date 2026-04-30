
## Goal

Drop the entire wearable sync flow (Apple Health / Health Connect / capacitor-health) and replace it with a clean **manual entry** experience on the Health page, plus an in-app guide that tells users exactly **what to check on their watch/phone** and **where to type it in**.

The database already stores everything we need (`wearable_daily_summary` with `steps`, `sleep_minutes`, `resting_hr`, `hrv_rmssd`), so we keep the table and just write to it manually instead of via sync. All charts, recovery tiles, coach views and readiness prefill keep working without changes — only the input source changes.

## Most common metrics (the ones we'll ask for)

1. **Sleep** — hours last night
2. **Resting heart rate** — bpm (from watch's "Resting HR" stat)
3. **HRV** — ms (RMSSD / "Heart Rate Variability")
4. **Steps** — daily total

Workouts/zones from the wearable feed are dropped (users already log workouts in the training tracker).

## New Health page (`/health`)

```text
┌──────────────────────────────────────────────┐
│  ← Back     Health                            │
│                                               │
│  ┌─ Log today's data ─────────────────────┐  │
│  │  Date: [today ▼]                       │  │
│  │  😴 Sleep last night    [ 7.5 ] hours  │  │
│  │  ❤️  Resting HR          [ 54  ] bpm    │  │
│  │  〰️  HRV (RMSSD)         [ 62  ] ms     │  │
│  │  👟 Steps                [ 8420] steps  │  │
│  │  [ Save entry ]                        │  │
│  └────────────────────────────────────────┘  │
│                                               │
│  ┌─ Where to find these numbers ─────────┐   │
│  │  ▸ Apple Watch / iPhone (Health app)  │   │
│  │  ▸ Garmin Connect                     │   │
│  │  ▸ Polar Flow                         │   │
│  │  ▸ Fitbit                             │   │
│  │  ▸ Samsung Health / Galaxy Watch      │   │
│  │  ▸ Whoop                              │   │
│  └───────────────────────────────────────┘   │
│                                               │
│  📈 Steps · 30 days  [chart]                  │
│  🌙 Sleep · 30 days  [chart]                  │
│  ❤️ Resting HR · 30 days [chart + baseline]   │
│  〰️ HRV · 30 days [chart + baseline]          │
└──────────────────────────────────────────────┘
```

### Manual entry form (`ManualHealthEntryCard`)
- Date picker defaults to today; can backfill any date.
- 4 numeric inputs with `inputMode="decimal"` / `"numeric"`, each with placeholder + unit suffix and a one-line hint ("Total night sleep, e.g. 7.5").
- Empty fields are skipped (partial entries allowed).
- "Save entry" upserts into `wearable_daily_summary` for `(user_id, summary_date)`. Sleep stored as `sleep_minutes = hours * 60`.
- Toast confirmation + haptic tap.
- After save, recompute `baseline_hr_7d` / `baseline_hrv_7d` client-side from the last 7 entries (simple average of non-null values) and write them back so the existing charts/coach baselines stay accurate.
- If an entry already exists for that date, prefill the inputs so editing is one-tap.

### Where-to-find guide (`HealthSourceGuide`)
- Accordion with one section per source. Each section has 4 short bullets — one per metric — saying exactly which screen to open. Examples:
  - **Apple Health**: Browse → Heart → Resting Heart Rate / Heart Rate Variability; Browse → Sleep; Browse → Activity → Steps.
  - **Garmin Connect**: Health Stats → Heart Rate / HRV Status; Sleep; Steps.
  - **Polar Flow**: Diary → Daily activity → Steps; Nightly Recharge → Sleep / ANS (HRV); Daily activity → Resting HR.
  - **Fitbit**: Today → Heart → Resting / HRV; Sleep; Today → Steps.
  - **Samsung Health**: Steps; Sleep; Heart rate → Resting / HRV.
  - **Whoop**: Recovery → HRV / RHR; Sleep → hours.
- Generic fallback line: "Any device → look for daily summary screen, copy the four numbers."

## Removals

### Files to delete
- `src/pages/WearablesSettings.tsx`
- `src/pages/WearablesSync.tsx`
- `src/components/wearables/WearableConnectWizard.tsx`
- `src/components/health/QuickExportCard.tsx`
- `src/lib/wearables/index.ts` (entire native bridge)
- `src/lib/wearables/quickExport.ts`
- `src/lib/wearables/promptDetection.ts`
- `supabase/functions/ingest-wearable-samples/` (edge function no longer needed)

### Routes (`src/App.tsx`)
- Remove `/wearables` and `/wearables/sync` routes and their imports.

### Dashboard / profile / readiness wiring
- `src/pages/Dashboard.tsx`: remove the dynamic `import("@/lib/wearables")` for `syncOnAppOpen` / `autoAttachWorkoutLogs` and the menu link to `/wearables`. `RecoveryTile` is still shown for users who have any logged data (replace `owns_wearable` gate with "has any summary row" check, or just always show when data exists).
- `src/pages/ProfileSetup.tsx`: remove the `WearableConnectWizard` import, the `owns_wearable` question UI, and stop sending `owns_wearable` to `update-my-profile`. (Column stays in DB; we just don't read/write it from UI.)
- `src/components/ReadinessCard.tsx`: drop the `getYesterdaySummary` dynamic import and the auto-prefill block. Sleep/HRV inputs become fully manual (which they already are visually).
- `src/components/RecoveryTile.tsx`, `src/components/progress/RecoveryProgressSection.tsx`, `src/components/coach/AthleteRecoveryTrend.tsx`, `src/components/ProgressDashboard.tsx`: keep as-is. They already read straight from `wearable_daily_summary` and gracefully handle empty data, so they'll show the manually-entered values automatically. Only tweak: remove the "Connect a watch" / "Open Sync" links and replace with "Log today" → `/health`.

### capacitor-health plugin
- Mark for removal from `package.json` (build harness will handle install). Keep this for the implementation step — no native re-link needed because the app is React-only in the sandbox.

### Translations
- Keep existing `recovery*` / `health*` keys (still used by charts and tiles).
- Add new keys for: `manualHealthTitle`, `manualHealthHint`, `manualSleepLabel`, `manualRhrLabel`, `manualHrvLabel`, `manualStepsLabel`, `manualSaveBtn`, `manualSavedToast`, `healthGuideTitle`, plus the source-name labels. Provide DA, EN, SV, DE, AR.
- Remove or stop referencing wearable-only keys in surfaced UI (translation entries themselves can stay; deleting them risks breaking other strings).

## Technical details

- **Saving**: write directly with the supabase JS client — `supabase.from("wearable_daily_summary").upsert({ user_id, summary_date, sleep_minutes, resting_hr, hrv_rmssd, steps, baseline_hr_7d, baseline_hrv_7d, computed_at: new Date().toISOString() }, { onConflict: "user_id,summary_date" })`. Existing RLS policy `Users view own wearable summary` covers SELECT; we'll add a user-write policy via migration if not already present (currently the table has SELECT policies only — needs INSERT/UPDATE policies for `auth.uid() = user_id`).
- **Migration**: one small migration to add `INSERT` and `UPDATE` RLS policies on `wearable_daily_summary` for the owning user. No schema change.
- **Baseline recompute**: pull last 7 rows for the user, average non-null `resting_hr` and `hrv_rmssd`, write both columns back on the saved row.
- **Form validation**: sleep 0–14 h, RHR 30–120 bpm, HRV 5–250 ms, steps 0–60000. Out-of-range shows inline hint, doesn't block save (user may legitimately have edge values).
- **No native code paths remain**: the `Capacitor.isPluginAvailable("Health")` checks, `ios-healthkit-info.md`, `android-healthconnect-info.md` docs become stale — leave the markdown docs alone, just unused.

## Out of scope

- Removing the `owns_wearable` column from `profiles` (keep for back-compat).
- Touching coach-side recovery views beyond removing dead "connect" CTAs.
- Removing the historical `wearable_samples` table or already-ingested rows.

## Files touched

**Create**
- `src/components/health/ManualHealthEntryCard.tsx`
- `src/components/health/HealthSourceGuide.tsx`

**Edit**
- `src/pages/Health.tsx` — strip sync UI, mount the two new cards on top, keep charts.
- `src/App.tsx` — drop wearable routes/imports.
- `src/pages/Dashboard.tsx` — drop sync side-effects and menu link.
- `src/pages/ProfileSetup.tsx` — drop wearable wizard step.
- `src/components/ReadinessCard.tsx` — drop wearable prefill.
- `src/components/RecoveryTile.tsx`, `src/components/progress/RecoveryProgressSection.tsx`, `src/components/coach/AthleteRecoveryTrend.tsx` — repoint "connect/sync" links to `/health`.
- `src/i18n/translations.ts` — add manual-entry + guide strings (5 languages).
- `package.json` — remove `capacitor-health`.

**Delete**
- `src/pages/WearablesSettings.tsx`, `src/pages/WearablesSync.tsx`, `src/components/wearables/WearableConnectWizard.tsx`, `src/components/health/QuickExportCard.tsx`, `src/lib/wearables/index.ts`, `src/lib/wearables/quickExport.ts`, `src/lib/wearables/promptDetection.ts`, `supabase/functions/ingest-wearable-samples/`.

**Migration**
- Add `INSERT` + `UPDATE` RLS policies on `wearable_daily_summary` so users can write their own rows.
