## Auto-sync HealthBridge on app open

Make the "Re-sync from iPhone" call fire automatically so athletes always see fresh data without tapping the button.

### Behavior
- Trigger `resync-health` automatically when the **Health page mounts**, right after the first `load()` completes.
- **Throttle to once every 15 minutes per device** using `localStorage` key `health:lastAutoSync` (timestamp). Prevents hammering the edge function on every navigation.
- **Silent mode**: no toast on success for the auto-run (only on the manual button). On failure, log to console only — don't nag the user.
- After a successful auto-sync, re-run `load()` so the chart and tiles reflect newly mirrored rows.
- The manual **"Re-sync from iPhone"** button stays as-is (always runs, shows toasts, ignores throttle).

### Technical changes
Single file: `src/pages/Health.tsx`
- Add `runResync({ silent }: { silent: boolean })` helper; refactor existing `handleResync` to call it with `silent: false`.
- New `useEffect` after the initial load `useEffect`:
  - Read `localStorage.getItem("health:lastAutoSync")`.
  - If missing or older than 15 min, call `runResync({ silent: true })` and write `Date.now()` back.
- Guard with `syncing` flag to avoid overlap with a manual click.

No edge function, DB, or i18n changes needed.
