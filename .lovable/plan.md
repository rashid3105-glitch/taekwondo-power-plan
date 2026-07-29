## Leverance

To .pptx-filer og to elevator pitches — dansk og engelsk — som downloadbare artefakter. Ingen ændringer i app-koden.

1. `Sportstalent-pitch-DA.pptx` (14 slides)
2. `Sportstalent-pitch-EN.pptx` (14 slides)
3. `Sportstalent-elevator-pitch.md` — kort (20 sek.), mellem (45 sek.) og lang (90 sek.) version på begge sprog

## Indhold (samme struktur, to sprog)

Salgsvinkel til klubber/forbund, men med nok forretning til at fungere over for partnere og investorer.

1. Titel — "Operating System for Elite Talent Development" + slogan
2. Virkeligheden i klubben i dag (kort scene-sætning)
3. Smertepunkter — regneark, spredt viden, gæt på periodisering, trænerskifte tager viden med ud af klubben
4. Konsekvensen — talent tabes, ingen rød tråd, ingen dokumentation
5. Løsningen — ét system, én sandhed, viden bliver i klubben
6. Sådan virker det — 4 trin (opsæt klub → planlæg sæson → atleter udfører → klubben ser data)
7. Modulerne — træning, ernæring, restitution/rehab, mental, video, test, kalender, rapporter
8. For træneren — hvad man slipper for
9. For atleten — hvad man får
10. For klubben/ledelsen — overblik, dokumentation, kontinuitet
11. Bygget af en træner — 40+ års erfaring, ikke en generisk app
12. Sikkerhed og GDPR — data i klubben, 7 sprog, virker offline
13. Priser — trappemodel pr. atlet, klub-only
14. Næste skridt — CTA, kontakt, svar inden for 48 timer

Al tekst hentes fra den nuværende site-copy i `src/i18n/translations.ts` (da/en), så decket matcher hjemmesiden 1:1. Ingen opdigtede tal, kundenavne eller resultater — hvis en slide kræver et tal vi ikke har, indsættes en tydeligt markeret pladsholder, og jeg oplyser hvilke.

## Design

Noir & Gold, samme identitet som sitet: mørk baggrund `0B0C14`, panel `13141F`, guld accent `F5C842`, hvid/grå tekst. Mørke title- og afslutningsslides, lysere kontrast-slides midtvejs så decket ikke bliver monotont. Ét gennemgående motiv (guld hairline + nummererede kapitler). Store overskrifter (40-54pt), læsbar brødtekst (20-24pt), ingen bullet-tunge slides — ikoner, stat-callouts og to-kolonne-layouts.

## Teknisk

- Genereres med pptxgenjs efter pptx-skillen
- Validering af filerne, derefter konvertering til billeder og visuel gennemgang af alle 28 slides for overløb, kollisioner og kontrast — rettes og re-verificeres før levering
- Filer lægges i `/mnt/documents` og vises som artefakter i chatten
