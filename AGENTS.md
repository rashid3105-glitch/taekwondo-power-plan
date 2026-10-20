# AGENTS.md

- Public marketing routes own their head tags via a route-level `PublicSeo` in App.tsx (Danish, the indexed language); `PageMeta` yields to it on those paths — why: visitor-locale titles otherwise replaced the canonical metadata Google indexes.
- Static sitewide description/og/twitter tags in index.html carry `data-rh="true"` — why: lets react-helmet-async replace them per route instead of leaving duplicate homepage tags first in the head.
- Official match-analysis routes always use the cloud analyzer, resolving a missing athlete parameter to the signed-in user — why: the literal `/me` route has no route parameter and must never fall back to device-only demo data.
- Public marketing pages share LightLayout and its scoped semantic theme; LandingLayout delegates to it — why: public navigation and content stay consistent without changing authenticated coach themes.
- PublicFooter is shared by the front page and LightLayout — why: public footer links and native exclusions stay consistent in both layouts.
- Contact offers travel in the URL; the dedicated public submit-contact function validates and stores them in the existing contact inbox before a fixed owner email, reusing its database rate-limit trigger — why: selected offers survive reloads and inquiries remain available even if notification fails.
