## Bug
On the Competitions page my recent change queried profiles with `.eq("id", user.id)`, but the `profiles` table is keyed on `user_id` (the `id` column is a separate UUID). So the lookup returned nothing and `isPoomsae` stayed `false`, even for athletes with `discipline = 'poomsae'` (verified in DB for the current user).

## Fix
**File: `src/pages/Competitions.tsx`** — in the `load()` Promise.all, change the profile query from:

```ts
supabase.from("profiles").select("discipline").eq("id", user.id).maybeSingle()
```

to:

```ts
supabase.from("profiles").select("discipline").eq("user_id", user.id).maybeSingle()
```

No other changes needed — once the lookup returns the row, the existing `isPoomsae` gating already hides the weight log card, the weight-class field in the create dialog, the weight-class badge, and the weight-cut status block.