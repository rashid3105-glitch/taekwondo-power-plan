# Promo text: 2-faktor login + ny kostplanlægger

Add short teaser promotion for the two newest features on the public features page, and matching changelog entries in Help.

## Public features page (/funktioner)

A new "Nyt" highlight strip placed between the hero section and the module accordion — two compact cards, each with icon, gold "NYT" badge, headline and 1-2 sentences:

1. **Sikker login med 2-faktor** — Frivillig ekstra sikkerhed med engangskode fra en authenticator-app. Husk enheden i 7 dage, så hverdagen stadig er hurtig.
2. **Ny kostplanlægger** — Guidet opsætning, dagligt kaloriemål og trendkurve for vægt. Rene måltidsplaner uden støj — mål hentes automatisk fra atletens opsætning.

Styling matches the existing page: `rgba(255,255,255,0.03)` cards, 0.5px borders, gold `#D4AF37` accents. No new libraries or layout framework.

## Help changelog

Add a new version entry **v1.5.19** dated 2026-08-05 with two lines summarising the same two features (wording aligned with the promo, in-app phrasing).

## Technical notes

- `src/pages/Funktioner.tsx`: new `PROMO` array + section rendered above the module list.
- `src/pages/Help.tsx`: add `changelogEntry201` / `changelogEntry202` and a `v1.5.19` row at the top of the changelog array; bump the displayed app version.
- `src/i18n/translations.ts`: new keys (`funcNewBadge`, `funcNew1Title/Desc`, `funcNew2Title/Desc`, `changelogEntry201`, `changelogEntry202`) in all 7 languages (da, en, sv, de, ar, no, es). No hardcoded strings.
- Wording avoids "AI" — automated features described as "automatisk"/"systemet".
