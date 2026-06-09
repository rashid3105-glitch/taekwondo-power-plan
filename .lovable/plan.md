
# Individuelle atlet-mål — guide + klikbar mockup

## Hvorfor

Coachen vil i næste uge bruge appen til **feedback og kommunikation pr. atlet**, og hun spørger specifikt efter *"hvordan sætter jeg individuelle mål"*. Kortlægningen viser at appen i dag **ikke har ét sted** hvor coachen kan skrive 1–3 navngivne mål for én atlet, sætte en deadline, og få atleten til at se det dagligt. Bidder findes spredt — men ingen samlet "mål"-flade.

## Del 1 — Kort guide: hvad coachen KAN gøre i appen i dag

Skrives som en kort sektion (mockup-siden viser den øverst, så coachen kan reagere på den næste uge):

- **Private coach-noter** (`/coach/athlete/:id` → Manage → Activity → "Private Coach Notes")
  Frit tekstfelt pr. atlet. *Synlig kun for coachen (og evt. andre coaches i klubben). Atleten ser den IKKE.*
- **Direkte besked til atleten** (samme side → "Send påmindelse"-knap i headeren)
  Emne + tekst → atleten ser den i sin notifikations-klokke. *Forsvinder når den læses, ingen deadline, ingen struktur.*
- **Ugefokus i teknik** (Sæsonkalender → klik på en uge → vælg teknikker for én atlet)
  Eneste strukturerede coach→atlet kanal i dag. *Kun teknik-tags, ingen fri tekst, ingen mål-framing.*
- **Kommentar på post-stævne-refleksion** (`/coach/athlete/:id` → Manage → Mental → Refleksioner)
  *Kun synlig for coaches.*
- **Dagbogs-kommentar** (åbn atletens dagbog → kommentar pr. opslag)
  Eneste kanal hvor atleten ser coachens tekst i kontekst. *Reaktivt, ikke proaktivt målsætning.*

**Bundlinje for coachen i denne uge:** Brug **dagbogs-kommentarer + ugefokus i sæsonkalenderen + en direkte besked** som midlertidig erstatning for individuelle mål. Det er det bedste appen kan i dag.

## Del 2 — Mockup: `/mockup/athlete-goals`

Ny selvstændig side, ikke linket fra navigation. Lokal state, ingen DB. Følger samme mønster som `/mockup/season-onboarding`.

### Sider/visninger

**Role-toggle øverst: Coach / Atlet** (samme mønster som eksisterende mockup).

### Coach-visning

1. **Atlet-vælger** (chips/avatarer) — 4 mock-atleter (Sara, Liam, Mia, Noah). Klik én → resten af siden viser hendes mål.
2. **"Sådan i dag"-banner** (kan lukkes) — kort version af guiden ovenfor med link til de relevante steder.
3. **Mål-kort for valgt atlet** — 3 strukturerede mål-typer i hver sin farve:
   - **Sportsligt mål** (trofæ-ikon, rosa) — fx "Top 3 ved DM marts"
   - **Trænings-mål** (kalender-ikon, grøn) — fx "4 træninger/uge i 6 uger"
   - **Teknik-fokus** (target-ikon, blå) — fx "Forbedre bandal chagi-timing"
   Hvert mål-kort har: titel · kort beskrivelse · deadline (date picker, mock) · status (ikke startet / i gang / opnået) · "Rediger"-knap.
4. **Tilføj/rediger-dialog** (Sheet) — felter: type, titel, beskrivelse, målbar indikator (valgfri tekst), deadline. Gem opdaterer kun lokal state.
5. **Ugentlig coach-kommentar** — felt under målene: "Sara, godt arbejde i tirsdags — fokuser på fodarbejdet næste uge." Vises også i atlet-preview.
6. **Preview-knap: "Se hvad Sara ser"** — toggler hurtigt til atlet-visning for samme atlet.

### Atlet-visning

1. **Topkort:** "Dine mål fra din coach" — 3 mål-kort i samme farvekodning, status-badge, dage til deadline.
2. **Ugens kommentar fra coachen** — citat-blok med dato.
3. **Lille progress-strip** — fx "2/3 mål i gang · 1 opnået i sidste måned".
4. **Note:** "Dette er en mockup — målene er eksempler."

### Designkrav

- Genbruger `Card`, `Button`, `Sheet`, `Popover`, badges fra appen.
- Tre faste mål-typer med distinkte tokens (rosa/grøn/blå) konsistent med eksisterende tab-farvekodning.
- Mobile-first (atleten ser det på telefon). Touch targets ≥44px.
- Al data er hardcoded mock i komponenten. Ingen Supabase-kald.
- Banneret med "sådan i dag" bruger samme `Sparkles` + `bg-primary/5` mønster som season-onboarding-mockup'en.

### Tekniske detaljer

- Ny fil: `src/pages/MockupAthleteGoals.tsx`
- Tilføj route i `src/App.tsx`: `<Route path="/mockup/athlete-goals" element={<MockupAthleteGoals />} />` (lazy import)
- Lokal state typer:
  ```ts
  type GoalType = "sport" | "training" | "technique";
  type GoalStatus = "not_started" | "in_progress" | "achieved";
  type Goal = { id: string; type: GoalType; title: string; desc: string; metric?: string; deadline: string; status: GoalStatus; };
  type Athlete = { id: string; name: string; avatar?: string; goals: Goal[]; coachComment: string; };
  ```
- 4 mock-atleter, hver med 2–3 prefyldte mål så coachen ser et realistisk billede.

## Hvad jeg IKKE rører

- Den rigtige `/coach/athlete/:id`, `coach_athlete_notes`, `athlete_week_technique_focus`, RLS, database, edge functions, changelog.
- Ingen nye tabeller. Mockup'en eksisterer kun for at evaluere konceptet før vi beslutter om det skal bygges rigtigt.

## Leverancer

- `src/pages/MockupAthleteGoals.tsx` (ny)
- `src/App.tsx` (én route tilføjet)
- Rapport tilbage med ruten og hvad der blev bygget.
