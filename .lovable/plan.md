## Diagnosis
- `wearable-ingest` is not registered in the live backend: a direct call returns `404 Requested function was not found`.
- There are no recent logs for `wearable-ingest`, which confirms the iOS app cannot reach a deployed function.
- The native HealthKit bridge is now working; this remaining issue is backend deployment/verification.

## Plan
1. Deploy the existing `wearable-ingest` Edge Function.
2. Verify it responds live by calling it directly with an authenticated empty payload.
3. Check recent function logs after the test call.
4. If deployment succeeds but the function returns a runtime error, fix only that backend function and redeploy.
5. Leave the JS API and native HealthKit plugin unchanged.

## Technical details
- Target function: `supabase/functions/wearable-ingest/index.ts`
- Expected post-deploy test with empty samples: `{ inserted: 0, workouts_inserted: 0 }`
- Current live backend response: `404 NOT_FOUND`, so the immediate fix is deployment, not native registration.