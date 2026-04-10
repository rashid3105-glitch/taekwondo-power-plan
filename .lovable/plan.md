

## Plan: Fix multi-session schedule saving

### Problem
The Zod schema in the `update-my-profile` edge function defines `DayScheduleSchema` as only `{ day, type }`. When the client sends `{ day, type, sessions: [...] }`, Zod's default behavior strips unrecognized keys. The `sessions` array is silently removed before saving to the database.

### Fix

**`supabase/functions/update-my-profile/index.ts`** — Update the schema to include the optional `sessions` array:

```typescript
const DaySessionSchema = z.object({
  type: z.enum(["tkd", "gym", "rest"]),
});

const DayScheduleSchema = z.object({
  day: z.string().min(1).max(20),
  type: z.enum(["tkd", "gym", "rest"]),
  sessions: z.array(DaySessionSchema).min(1).max(3).optional(),
});
```

This is a one-file change. After deploying, saving the profile will preserve the multi-session data in the `weekly_schedule` JSONB column.

