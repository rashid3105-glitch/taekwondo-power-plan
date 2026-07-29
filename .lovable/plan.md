## Mål

Skarpere, mere selvsikker marketing-copy i hele det offentlige lag — inspireret af referencens direkte, korte sætningsrytme, men 100 % nyskrevet tekst i Sportstalents egen stemme (dansk klubfokus, 40 års trænererfaring, GDPR, "Operating System for Elite Talent Development"). Ingen kopiering af referenceformuleringer, ingen "AI"-jargon, ingen sportsspecifikke (kampsports-)referencer.

Tone: niveau 3 af 5 — direkte og kompromisløs i overskrifter, rolig og troværdig i brødtekst. Korte hovedsætninger. Ingen buzzwords, ingen udråbstegn.

## Hvad der skrives om

Al tekst ligger allerede i `src/i18n/translations.ts` som nøgler, så arbejdet er primært tekst — ikke struktur.

**1. Forsiden (`src/pages/Index.tsx`)**
- Hero: ny badge, H1, underrubrik, 3 bullets, CTA-labels, trust-linje.
- Kapitel 01 Problem, 02 Løsning, 03 Funktioner (8 kort), 04 Sådan virker det, samt FAQ/afslutnings-CTA.
- SEO-titel og -beskrivelse justeres til den nye positionering.

**2. Funktioner + Platform (`FeatureDetail.tsx`, `PlatformMarketing.tsx`)**
- Modulbeskrivelser omskrives til én skarp påstandslinje + kort forklaring + 4 konkrete punkter pr. modul (samme rytme på tværs af moduler: Træning, Ernæring, Restitution/Rehab, Mental, Video, Test, Kalender, Rapporter).
- Stat-blokken får ærlige, klub-relevante labels.

**3. Om + Trænerlanding (`About.tsx`, `CoachLanding.tsx`)**
- Grundlægger-noten skrives om til en personlig, første-persons tekst i 3 korte afsnit, underskrevet af grundlæggeren — placeret under billedet (den eksisterende `.founder-grid`-stak bevares).
- Værdikortene (4 stk.) får nye titler/tekster.
- Trænerlandingen får en skarpere "hvad du slipper for"-vinkel.

**4. Priser (`Priser.tsx`)**
- H1, underrubrik, tier-noter, kalkulator-labels og de 4 FAQ'er omskrives.
- Ingen ændring af priser eller trappemodellens tal.

## Nye sektioner (3 stk.)

1. **"Enhver sport"-chips** på forsiden under hero: klikbare/statiske pill-tags (Fodbold, Håndbold, Svømning, Atletik, Badminton, Kampsport, Cykling, Roning, Gymnastik, Volleyball, Ishockey, Basketball + "Din sport"). Understreger den nye sport-neutrale positionering. Aktive tags i guld, øvrige som outline — Noir & Gold, ikke ny farvepalet.
2. **Grundlægger-note som selvstændig sektion** på forsiden (kort uddrag med link til /about), i samme stil som på Om-siden.
3. **"Lad os tale om det"-blok nederst på Priser**: kort tekst om at prisen tilpasses klubbens størrelse og rollout, punktliste over hvad der er inkluderet ved opstart, og en kontakt-CTA med "svar inden for 48 timer".

## Sprog

Alle 7 sprog opdateres: da, en, sv, de, no, es, ar. Dansk skrives først som kilde, derefter idiomatiske oversættelser (ikke ordret). Arabisk holdes RTL-kompatibelt. Nye nøgler tilføjes i alle 7 blokke — ingen engelske fallbacks.

## Teknisk

- Ændringer i `src/i18n/translations.ts` (omskrivning + nye nøgler) og i de fem sidefiler for de nye sektioner.
- Nye sektioner bygges med eksisterende Noir & Gold-tokens og samme inline-stilmønster som resten af siderne; mobil-first (chips wrapper, ingen vandret scroll).
- Kun offentlige marketingsider berøres — ingen ændringer i app-UI, backend, priser eller SEO-ruter.
- Verificeres med en Playwright-gennemgang af /, /funktioner, /platform, /about, /for-traenere og /priser i mobil- og desktopbredde.
