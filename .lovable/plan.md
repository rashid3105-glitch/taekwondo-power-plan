## Diagnose & fix: Coach Mental Review "AI failed to give advice"

### What I checked
- `supabase/functions/generate-coach-mental-advice/index.ts` exists and the code path is correct (auth check → entitlement → AI gateway → JSON parse).
- Client caller (`useOfflineCoachMentalAssessments.ts`) invokes it via `supabase.functions.invoke` with the right payload.
- Edge-function logs for `generate-coach-mental-advice` are **empty** — there is no record of any invocation reaching the deployed function. The other coach function I just shipped (`consent-coach-actions`) only shows boot/shutdown.
- You are currently on `/auth`, which suggests the session may have been bounced (401 from the function would not by itself redirect, but a stale session is likely).

### Most probable causes (in order)
1. The newly created function never finished deploying after the last rebuild → client gets a 404/network error → UI shows "AI failed to give advice".
2. Session expired between opening the assessment and pressing submit → 401 from the function.
3. AI gateway returned non-JSON content for the new (rewritten) prompt → the `JSON.parse` step throws and surfaces as "Failed to parse AI response".

### Plan
1. **Force a fresh deploy** of `generate-coach-mental-advice` (and the related `generate-mental-advice` to be safe).
2. **Smoke-test** the deployed function with a minimal payload using `supabase--curl_edge_functions` while you are logged in, so we can see the real status code and body.
3. **Read the function logs** right after the test call to confirm whether the failure is auth (401), entitlement (402), gateway (500 with "AI gateway error"), or JSON parse (500 with "Failed to parse AI response").
4. **Targeted fix based on signal**:
   - If 404/boot fail → redeploy / fix imports.
   - If 401 → ask you to re-login (the `/auth` route confirms this is plausible) and add a clearer toast on the client.
   - If gateway 500 → adjust the prompt (e.g. add explicit "Return ONLY valid JSON, no prose" guardrail and/or `response_format: { type: "json_object" }`).
   - If parse 500 → harden parsing (strip leading prose, retry once with stricter instruction).
5. **Surface the real error in the UI** instead of a generic "failed", so future failures are diagnosable in one step.

### Files likely to change
- `supabase/functions/generate-coach-mental-advice/index.ts` — add `response_format`, harder JSON parsing, clearer error codes.
- `src/components/CoachMentalAssessment.tsx` and/or `src/hooks/useOfflineCoachMentalAssessments.ts` — surface the server-provided error code/message in the toast.

No DB or schema changes needed.

Approve and I'll switch to build mode, deploy, run the smoke test, and patch based on the actual error.