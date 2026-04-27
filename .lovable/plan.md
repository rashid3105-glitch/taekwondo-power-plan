## Problem

The "Sync failed — Edge Function returned a non-2xx status code" toast on the reflection screen is caused by a server-side validation bug in `generate-competition-reflection`.

The reflection wizard collects ratings on a **1–10 scale** (visible in the screenshot: "Overall performance 9/10", "Emotional control 6/10", etc. and the prompt itself says "1=poor, 10=excellent"), but the edge function rejects anything above 5:

```ts
if (typeof v !== "number" || v < 1 || v > 5)
  return json({ error: "Ratings must be 1-5" }, 400);
```

Every submission therefore returns 400, the outbox marks it as failed, and reflections never reach the database. This explains why Zakinah and Danilo's reflections have been stuck pending — they were never bad data, the server was rejecting them.

Edge logs confirm a steady stream of 400 responses from this function.

## Fix

**One-line change** in `supabase/functions/generate-competition-reflection/index.ts`:

- Update the rating bounds check from `v < 1 || v > 5` to `v < 1 || v > 10`.
- Update the error message to "Ratings must be 1-10".

That's the only required change — the AI prompt and the rest of the function already operate on a 1–10 scale.

## After deploy

- Existing pending reflections in athletes' offline outboxes will sync automatically the next time those athletes open the app online (the sync engine retries on reconnect and on the manual "Sync now" button we already added).
- Ask Zakinah and Danilo to open the app once with internet — their reflections should then appear under the Mental tab in the Coach Dashboard.

## Files

- `supabase/functions/generate-competition-reflection/index.ts` — fix rating range validator (1 line + error message).

No client, schema, or RLS changes needed.
