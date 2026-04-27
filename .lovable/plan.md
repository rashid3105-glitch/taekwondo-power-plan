## Goal

Get the wearables shout-out in front of **everyone** — landing visitors AND logged-in athletes — using the existing `landing_announcements` system you already control from the admin panel. No new tables, no new editor: you write the copy yourself in the admin "What's New" editor, and the banner shows up in two places.

## What you'll do (no code)

1. Open the admin panel → "Landing announcement" editor.
2. Fill in the 6 language fields with your wearables shout-out (≤80 chars each), e.g. EN: "Sync Apple Health & Health Connect — Recovery & Readiness, automatic.".
3. Set link URL to `/wearables` (or `/help#changelog` if you prefer the explanation).
4. Toggle **Show on landing** on, save.

## What I'll build

The single change: **make the existing `WhatsNewInline` banner also render on the authenticated dashboard hub**, so the same admin-controlled message reaches both audiences.

### Where it appears on the dashboard

`src/pages/Dashboard.tsx`, hub tab — directly under the welcome card (with Next event + Quote of the day) and above `ReflectionPromptCard` / `ReadinessCard`. Same compact one-line style as on the landing page; tappable, links to whatever URL you set in the admin editor.

```text
┌──────────────────────────────────────────────┐
│ Welcome back, Farooq!                        │
│ 🏆 Next up           💬 Quote of the day      │
└──────────────────────────────────────────────┘
   ✨ What's new: Sync Apple Health …  Read →    ← banner
┌──────────────────────────────────────────────┐
│ ReflectionPromptCard / ReadinessCard …       │
└──────────────────────────────────────────────┘
```

### Behaviour

- Reads the **single active row** from `landing_announcements` (RLS already allows `anon` + `authenticated` to view active rows — no policy change needed).
- Hidden when no active announcement exists, so toggling it off in admin instantly removes it from both the landing page and the dashboard.
- Hidden for demo accounts? **No** — this is general-audience marketing news, so it shows for everyone including demo users (matches landing behaviour).
- Reuses the exact same component, so the styling, i18n routing, internal vs external link handling, and motion intro are identical to the landing version.

### Technical details

- Add `<WhatsNewInline />` import + render to `Dashboard.tsx` inside the hub tab (`activeTab === "hub"`), placed between the welcome card and the `ReflectionPromptCard`.
- No DB migration. No new translation keys (the prefix/link labels already exist: `whatsNewPrefix`, `whatsNewLink`).
- No admin UI change — your existing editor already controls visibility via the `is_active` flag.
- One file changed: `src/pages/Dashboard.tsx`.

## Out of scope

- No dismiss button (you control duration via the admin toggle — flip it off when the news is stale).
- No coach-dashboard variant (coaches still get it via the landing page if they visit, plus the changelog).
- No notification/email push.