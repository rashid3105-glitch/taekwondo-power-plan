# Diary scalability — make many entries easy to navigate

The diary already stores `tags`, `mood`, `energy` and `entry_date` on every entry, but the UI just renders one long flat list. Once an athlete has 50+ entries it becomes a wall of text. Below is a layered improvement that keeps the mobile-first cockpit feel.

## What we'll add

### 1. Entry type (new field)
A small, fixed set of types so each entry has a clear purpose and color. Picked once at the top of the form, stored as `entry_type` on the row.

Proposed types (icon + accent color):
- **Training** — daily session reflection
- **Competition** — match day / event
- **Recovery** — rest, sleep, soreness
- **Mental** — focus, nerves, motivation
- **Injury** — pain, rehab notes
- **General** — free-form (default)

This is different from tags: type = the *kind* of entry (one), tags = themes inside it (many).

### 2. Filter & search bar (sticky under header)
- **Search** input — matches `content` (case-insensitive substring)
- **Type chips** — All / Training / Competition / Recovery / Mental / Injury / General. Counts shown next to each.
- **Tag chips** — only the tags actually present in the user's entries (deduplicated from existing data, not the static preset)
- **Date range** — Last 7 days / 30 days / 90 days / All (default 30 days so the initial scroll stays short)
- **Mood filter** (optional, behind a "More filters" toggle) — Low (1–2) / Neutral (3) / High (4–5)

Active filters show as removable chips above the list. A single "Clear" resets all.

### 3. Group by month with sticky headers
Entries grouped under "April 2026", "March 2026", etc. — collapsible. The current month is expanded by default; older months start collapsed. Each group header shows the entry count.

### 4. Compact list view + expand on tap
Default each entry to a one-line summary (date · type icon · mood · first ~80 chars). Tap to expand the full content, tags and coach comments. This dramatically shortens the scroll. A small toggle in the header (compact / detailed) remembers the choice in localStorage.

### 5. Pagination / lazy load
Render the first 20 entries; show a "Load older entries" button at the bottom. Filters always run on the full cached set so search across history still works.

### 6. Quick "Jump to date" calendar
A small calendar icon in the header opens a date picker that scrolls to / filters that day. Useful for coaches reviewing a specific competition.

## Suggested UI layout (mobile)

```text
┌─────────────────────────────────────┐
│ ← Diary                  [+ New]    │  header
├─────────────────────────────────────┤
│ 🔍 Search entries...                │  sticky filter bar
│ [All 47] [Training 22] [Comp 5] ... │  type chips (scrollable row)
│ #competition #sparring #recovery    │  tag chips (scrollable row)
│ Last 30 days ▾   More filters ▾     │
├─────────────────────────────────────┤
│ APRIL 2026 (12)                  ▾ │  month header
│ ─────────────────────────────────── │
│ 🥋 Apr 28 · 😀 ⚡⚡⚡ Felt sharp...  │  compact entry row
│ 🏆 Apr 20 · 🙂 ⚡⚡   First gold...  │
│ 💪 Apr 18 · 😐 ⚡     Heavy legs... │
│ ...                                 │
│ MARCH 2026 (15)                  ▸ │  collapsed
└─────────────────────────────────────┘
```

## Why entry types AND tags (not one or the other)

- **Type** answers "what is this entry?" — single, structural, drives the icon/color and the primary filter chip row. Coaches scanning quickly can spot all competition entries at a glance.
- **Tags** answer "what's in it?" — multiple, free-form themes (sparring, kicks, anxiety). Great for cross-cutting search (e.g. all entries tagged `sparring` regardless of type).

Both together let the athlete pivot the same data two different ways without forcing a rigid taxonomy.

## Technical notes

- **DB**: add `entry_type text not null default 'general'` to `diary_entries` plus a check/enum-style validation trigger (per project rules — no CHECK constraints). Backfill existing rows to `'general'`.
- **Offline**: extend `CachedDiaryEntry`, `DiaryOutboxIntent` and the sync engine in `src/lib/diaryOfflineDB.ts` / `src/lib/diarySyncEngine.ts` to carry `entry_type`. Bump the IndexedDB `DB_VERSION` from 1 → 2 with a no-op `onupgradeneeded` (existing rows just get `entry_type` undefined, treated as `general`).
- **i18n**: add type labels and filter strings to `src/i18n/translations.ts` for EN/DA/SV/DE/AR.
- **Coach view**: pass type + filters through to `CoachAthleteDetail` so coaches see the same structure.
- **Performance**: filtering and grouping happen in memory on the cached list — no extra queries.

## Out of scope (can come later)

- Auto-linking diary entries to a specific competition or training session
- Weekly auto-summary ("you wrote 6 entries this week, mostly tagged sparring")
- Export filtered set to PDF

## Files we'll touch

- `src/pages/Diary.tsx` — filter bar, grouping, compact view, type picker in form
- `src/lib/diaryOfflineDB.ts`, `src/lib/diarySyncEngine.ts`, `src/hooks/useOfflineDiary.ts` — carry `entry_type`
- `src/components/coach/CoachAthleteReflections.tsx` (and any coach diary view) — same filters
- `src/i18n/translations.ts` — new strings
- One Supabase migration — add column + validation trigger + backfill
