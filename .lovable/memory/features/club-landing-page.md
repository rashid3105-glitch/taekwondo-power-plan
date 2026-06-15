---
name: Landing page routes
description: Landing page routes — new dark/gold Index at /, CoachLanding at /v3, Landing at /v2
type: feature
---
- `/` → `Index` (new dark/gold marketing landing, Danish, founder section with `/founder-farooq.jpg`, hero + stats + features + pricing).
- `/v3` → `CoachLanding` (previous light Everfit-style coach-focused page).
- `/v2` → `Landing` (Danish-first navy/red club acquisition page, waitlist table).
- `/signup` → `/auth?tab=signup`, `/login` → `/auth?tab=signin`.
- Logged-in users on `/` redirect to `/dashboard` (handled inside Index).
