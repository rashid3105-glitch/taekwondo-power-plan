---
name: Club Landing Page
description: Landing page routes — light sporty coach page at /, Scandinavian club landing at /v2, original Index at /v1
type: feature
---
- `/` → `CoachLanding` (English/i18n, **light Everfit-style palette**: white bg, navy text `#0B1220`, red accent `#E63946`, sport blue `#0EA5E9`; Bebas Neue + DM Sans; coach-focused).
- Trust band shows a single neutral line ("Used by clubs specialized in sparring and poomsae — and built so any club can benefit.") in all 6 locales — **no club names, no logos** (don't imply endorsements).
- Final CTA band uses dark navy `#0B1220` with white text and red CTA button.
- Footer columns wired to real routes: Platform → `/pricing`, `/methodology`, `/programs`, `/help`; For Coaches/Athletes use `#for-coaches`/`#for-athletes` anchors + `/contact`/`/install`; Company → `/about`, `/contact`, `/privacy`, `/auth?tab=signin`, `/auth?tab=signup`. Translated for en/da/sv/no/de/ar.
- `/v2` → `Landing` (previous Danish-first navy/red club acquisition page, waitlist table).
- `/v1` → `Index` (original athlete-facing landing).
- `/signup` → `/auth?tab=signup`, `/login` → `/auth?tab=signin`.
- Logged-in users on `/` redirect to `/dashboard`.
