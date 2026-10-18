---
name: Landing page routes
description: Public marketing routes — light DraftHome at /, benefit subpages at /fordele/:slug, CoachLanding at /for-traenere
type: feature
---
- `/` → `DraftHome` (light design approved Oct 2026; replaced the dark/gold `Index`, which is kept in code but unrouted).
- `/fordele/spar-tid|trivsel|roed-traad|videoanalyse` → `DraftBenefit`. Old `/draft-home(/:slug)` redirect here.
- Page images are swappable inline by platform admins ("Skift billede"); screenshots must not show real names, club names or athlete codes.
- Signed-in non-admins on `/` redirect to `/dashboard`; admins stay to edit images.
- `/for-traenere` → `CoachLanding`. `/signup` → `/auth?tab=signup`, `/login` → `/auth?tab=signin`.
- Per-route SEO via `PublicSeo` (Danish).
