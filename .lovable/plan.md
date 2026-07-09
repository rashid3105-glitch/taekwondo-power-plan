## Problem

Klik på arkiv-ikonet gør ingenting for de fleste samtaler. To grunde:

1. **RLS blokerer opdateringen.** `archiveThread` skriver `archived_at`/`archived_by` på `chat_threads`, men RLS-policyen `"Owner updates thread"` tillader kun UPDATE hvis brugeren har rollen `owner` i tråden. I direct-tråde er kun den der startede samtalen owner — den anden part kan derfor ikke arkivere. Supabase `.update()` returnerer så 0 rækker uden fejl, og UI virker "dødt".
2. **Semantisk forkert.** `archived_at`/`archived_by` ligger på selve tråden, så hvis policyen alligevel tillod det, ville arkiveringen skjule tråden for begge parter. Kommentaren i `ThreadList` siger allerede at det skal være per bruger.

Bonus: `<button>` (arkiv-ikonet) ligger inde i `<button>` (række-vælgeren) i `ThreadList.tsx` — ugyldig HTML, kan give upålidelige klik.

## Fix

Flyt arkiv-tilstand til medlemsrækken (per bruger) i stedet for på tråden.

### 1. Migration
- `ALTER TABLE public.chat_thread_members ADD COLUMN IF NOT EXISTS archived_at timestamptz;`
- Index på `(user_id) WHERE archived_at IS NOT NULL`.
- Eksisterende `"Members update own membership"`-policy dækker allerede UPDATE for egen række, så ingen ny policy nødvendig.
- (Vi rører ikke de gamle `chat_threads.archived_at/archived_by`-kolonner — de bliver bare ubrugte.)

### 2. `src/lib/chatApi.ts`
- `archiveThread(threadId)`: `update chat_thread_members set archived_at = now() where thread_id = _ and user_id = auth.uid()`.
- `unarchiveThread(threadId)`: samme med `archived_at = null`.
- Udvid `ChatThread.members[*]` med `archived_at: string | null` og læs den i `listThreads` (allerede `select *`, så feltet kommer med — bare tilføj til mapping).

### 3. `src/components/chat/ThreadList.tsx`
- `isArchivedForMe(t)` = `!!t.members.find(m => m.user_id === meId)?.archived_at`.
- Fix nested-button: gør række-containeren til `<div role="button" tabIndex={0}>` med `onClick`/`onKeyDown`, så arkiv-`<button>` er en gyldig søskende inde i containeren (ikke inde i et andet `<button>`).

### 4. Verificér
Playwright på `/messages`: åbn en samtale hvor brugeren ikke er owner, klik arkiv-ikonet, bekræft at rækken flytter til "Vis arkiv (n)" og at den anden deltager stadig ser tråden aktiv (via anden session eller DB-check).

## Filer
- ny migration under `supabase/migrations/`
- `src/lib/chatApi.ts`
- `src/components/chat/ThreadList.tsx`
