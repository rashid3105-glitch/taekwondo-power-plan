---
name: Landing page routes
description: Public marketing routes — Index at /, CoachLanding at /for-traenere (with /v3 redirect)
type: feature
---
- `/` → `Index` (dark/gold marketing landing, Danish, founder section, hero + stats + features + pricing).
- `/for-traenere` → `CoachLanding` (coach-focused Everfit-style page). Legacy `/v3` redirects here.
- `/signup` → `/auth?tab=signup`, `/login` → `/auth?tab=signin`.
- Logged-in users on `/` redirect to `/dashboard` (handled inside Index).
- Per-route SEO metadata via `PublicSeo` (react-helmet-async). Private routes inherit `noindex,nofollow` from `index.html`.
