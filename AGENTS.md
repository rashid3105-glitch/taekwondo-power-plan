# AGENTS.md

- Public marketing routes own their head tags via a route-level `PublicSeo` in App.tsx (Danish, the indexed language); `PageMeta` yields to it on those paths — why: visitor-locale titles otherwise replaced the canonical metadata Google indexes.
- Static sitewide description/og/twitter tags in index.html carry `data-rh="true"` — why: lets react-helmet-async replace them per route instead of leaving duplicate homepage tags first in the head.
