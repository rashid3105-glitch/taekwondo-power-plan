---
name: Club Landing Page
description: Landing page routes — coach-focused dark page at /, Scandinavian club landing at /v2, original Index at /v1
type: feature
---
- `/` → `CoachLanding` (English, dark/red/gold taekwondo-coded marketing page targeting club coaches; uses Bebas Neue + DM Sans, no PublicNav/AppFooter, no "AI" wording).
- `/v2` → `Landing` (previous Danish-first navy/red club acquisition page, waitlist table).
- `/v1` → `Index` (original athlete-facing landing).
- `/signup` → `/auth?tab=signup`, `/login` → `/auth?tab=signin`.
- Logged-in users on `/` redirect to `/dashboard`.
