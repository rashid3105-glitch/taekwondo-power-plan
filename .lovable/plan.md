
The user reports that on the published site (sportstalent.dk), they don't see the Competitions block on the dashboard hub. Looking at the screenshot they shared (Danish dashboard), I count the cards: Træningsplan, Fremgang, Ernæring, Skade-genoptræning, Mental præstation, Fysisk Testning, Bibliotek, Sådan bruger du SPORTSTALENT — that's 8 cards but **no Competitions/Konkurrencer card**.

Per the deployment context: frontend changes require clicking "Update" in the publish dialog to go live. Backend changes deploy automatically.

But before assuming this is just a publish issue, I need to verify whether the Competitions card was actually added to the Dashboard hub grid, OR only to the landing page FeatureGrid.

Looking back at the conversation history, in the previous turn I added the Competitions card to:
- `src/components/landing/FeatureGrid.tsx` (landing page) ✓
- `src/pages/FeatureDetail.tsx` (detail page) ✓
- `src/pages/Help.tsx` (changelog) ✓
- `src/pages/Dashboard.tsx` — I claimed "Refactored to replace hardcoded strings... with `t('hubCompetitionsTitle')`" but the screenshot shows NO Competitions card at all in the hub grid.

So either:
1. The card is in Dashboard.tsx but only shows under a condition (e.g., user is paid subscriber, or behind a feature flag)
2. The card was never actually added to the hub grid — I only added the translation keys

Let me check Dashboard.tsx to confirm.
