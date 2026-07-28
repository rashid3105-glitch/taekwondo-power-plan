## 1. PDF/udskriv-knap på peaking- og vægtplanen

`src/components/CompetitionPlanDialog.tsx` har i dag ingen eksport. Jeg tilføjer en download-knap i dialogens header (ikon + "PDF", samme mønster som `RehabPlanCard`):

- Ny hjælpefunktion der bygger en A4-PDF med `jspdf` (dynamisk import, som i rehab-planen), indeholdende: stævnenavn, meta (nuværende/mål/cut/dage), advarsler, resumé, ugentlig taper, dagligt vægttabsskema, ernæringsjusteringer og peak-day-protokol.
- Knappen placeres ved siden af titlen (kun ikon på mobil, `aria-label` + `title`).
- På native (iOS/Android) bruges samme del-flow som Health-rapporten, så filen kan deles i stedet for kun downloades.
- Nye oversættelsesnøgler (`compPlanDownloadPdf`) på alle 7 sprog.

## 2. Fremmøde-siden moderniseres — "Tactical coach cockpit"

Omskrivning af `src/components/coach/SessionAttendance.tsx` (bruges på `/coach/today`) efter den valgte retning:

- **Header**: "Dagens træning" som stor overskrift med pulsende "live"-prik, statistik-knap og datovælger i afrundede pill-kontroller.
- **Forklaring**: farvede status-chips (til stede / forsinket / fraværende / skadet) i stedet for den nuværende tekstlinje.
- **Atletrækker**: større afrundet avatar med status-badge i hjørnet, navn + statustekst ("Session aktiv", "Afventer data", "Skadet"), og de fire status-knapper samlet i én mørk segment-container med farvet aktiv-tilstand. Uregistrerede atleter tones ned.
- **Intensitetsmodul**: RPE vises som et selvstændigt panel med stort tal (8/10) og farvegraderet slider (rød → gul → grøn) med skalatekster. Vises fortsat kun for til stede/forsinket.
- **Opsummeringsbjælke** nederst: deltagelse (x/y) og gennemsnitligt hold-RPE, beregnet ud fra de eksisterende records — ingen nye datakald.
- Mobil: `h-11`-touchmål, kolonnestak i header og footer.

### Teknisk
- Ingen ændringer i datalag, RLS eller `session_attendance`-queries — kun præsentation.
- Farver via semantiske tokens/eksisterende Tailwind-paletter, ikke hårdkodede hex.
- Nye tekstnøgler (fx `attendanceLive`, `attendanceAwaiting`, `attendanceParticipation`, `attendanceTeamRpe`, statusetiketter) tilføjes i alle 7 sprog i `src/i18n/translations.ts` (inkl. `esOverrides`).
- Changelog + relevant hjælpeemne opdateres i `src/pages/Help.tsx` (v1.5.7).
