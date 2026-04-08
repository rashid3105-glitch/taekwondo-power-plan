

## Plan: Fix build errors, merge conflict, and profile save issue

### 1. Fix README.md merge conflict
The file has Git conflict markers (`<<<<<<< HEAD`, `=======`, `>>>>>>>`) that need to be resolved by keeping the Lovable version.

### 2. Fix edge function build errors

**`supabase/functions/get-admin-users/index.ts` (line 62)**
- `err` is of type `unknown` — cast to `Error`: `(err as Error).message`

**`supabase/functions/process-email-queue/index.ts` (7 errors)**
- The `createClient` from npm is untyped, causing type mismatches with `.insert()`, `.rpc()`, and function parameters
- Fix `moveToDlq` parameter type: change `ReturnType<typeof createClient>` to `any`
- Add explicit types to `.map((msg: any) =>` and `.filter((id: any): id is string =>`
- Cast `.insert()` and `.rpc()` payloads with `as any` to bypass the untyped client generics

### 3. Investigate and fix profile save for Ky Tu Dang
The database row exists with valid protected fields. RLS policies and data are consistent. The most likely cause is a **stale auth session** where the access token expires between page load and form submission.

**Changes in `src/pages/ProfileSetup.tsx`:**
- Before calling `getUser()` in `handleSubmit`, call `supabase.auth.getSession()` first to force a token refresh if needed
- Add `console.error` logging when 0 rows are returned, including the response details, to aid debugging if this happens again
- Translate the error message (add translation keys for DA/SV/DE)

### Technical details
- Edge function type errors are caused by the untyped Supabase client (`createClient` without generic `<Database>` parameter) used in Deno edge functions — adding `as any` casts is the standard workaround
- The profile save debugging log will only fire on failure, so no performance impact
- 4 files modified: `README.md`, 2 edge functions, `ProfileSetup.tsx`, plus translation keys in `translations.ts`

