# Coach diary view — samme filtrerings- og grupperingsprincipper som atletens dagbog

Coach åbner i dag en `Dialog` i `src/pages/CoachDashboard.tsx` der bare lister alle dagbogsindlæg flat. Når en atlet har mange entries bliver det lige så uoverskueligt som det var for atleten selv. Vi genbruger samme model som vi netop indførte i `src/pages/Diary.tsx`.

## Hvad coachen får

### 1. Sticky filterbjælke i toppen af dialogen
- **Søgning** i `content` (case-insensitive)
- **Type-chips**: Alle / Træning / Konkurrence / Recovery / Mental / Skade / Generel — med antal pr. type
- **Tag-chips** baseret på de tags der faktisk findes i atletens entries
- **Datointerval**: Sidste 7 / 30 / 90 dage / Alle (default 30 dage så scroll er kort)
- **Humør-filter** bag "Flere filtre" (Lav 1–2 / Neutral 3 / Høj 4–5)
- Aktive filtre vises som fjernbare chips + "Ryd alle"

### 2. Gruppering pr. måned med sticky headers
"April 2026", "Marts 2026" osv. Indeværende måned åben, ældre måneder kollapset. Antal vises i header.

### 3. Kompakt visning + tap for at udvide
Hver række: dato · type-ikon · humør · ~80 tegn af content. Tap åbner fuld tekst, tags og **eksisterende coach-kommentar (`DiaryComments`)** — uændret funktionalitet, bare pakket ind.

Compact/detailed-toggle huskes i localStorage (separat nøgle fra atletens, så coachens valg ikke overskrives).

### 4. Lazy load
Render første 20 entries, "Indlæs ældre" knap. Filtre kører altid på hele det hentede sæt.

### 5. Hop til dato
Lille kalender-ikon i header der filtrerer til en specifik dag — nyttigt når coach vil se en konkret konkurrencedag.

## Mock-up (mobil)

```text
┌─────────────────────────────────────┐
│ 📓 Mikkel — Dagbog            [x]   │
├─────────────────────────────────────┤
│ 🔍 Søg i indlæg...                  │
│ [Alle 47] [Træning 22] [Komp 5] ... │
│ #sparring #recovery #angst          │
│ Sidste 30 dage ▾   Flere filtre ▾   │
├─────────────────────────────────────┤
│ APRIL 2026 (12)                  ▾ │
│ 🥋 28. apr · 😀 ⚡⚡⚡ Følte mig...  │
│ 🏆 20. apr · 🙂 ⚡⚡   Første guld...│
│ MARTS 2026 (15)                  ▸ │
└─────────────────────────────────────┘
```

## Tekniske noter

- Ingen DB-ændringer — `entry_type` og `tags` er allerede tilføjet i forrige PR.
- Trækker stadig data direkte fra `diary_entries` for den valgte atlet (coach har kun læseadgang, ingen offline-cache nødvendig).
- Genbrug så vidt muligt små rene funktioner fra `src/pages/Diary.tsx` ved at flytte dem til en delt fil:
  - `src/lib/diaryFilters.ts` (ny): `filterEntries`, `groupByMonth`, `availableTags`, `typeCounts`, type-konstanter (label, ikon, accentfarve).
  - `src/pages/Diary.tsx` refaktoreres til at importere fra den fælles fil — ingen funktionel ændring der.
- Ny komponent `src/components/coach/CoachDiaryView.tsx` indeholder filterbjælke, gruppering, kompakt liste og udvidelse. Tager `athleteId`, `athleteName` og en `entries`-prop (eller henter selv).
- `src/pages/CoachDashboard.tsx` udskifter den nuværende inline-liste i dialogen med `<CoachDiaryView entries={diaryEntries} ... />`. Eksisterende `DiaryComments` integration bevares uændret i den udvidede række.
- i18n: alle nye strenge findes allerede fra atlet-dagbogen — ingen nye nøgler.
- localStorage-nøgle for compact-toggle: `coach-diary-compact` (separat fra atletens `diary-compact`).

## Filer der ændres

- `src/pages/CoachDashboard.tsx` — erstat inline diary-liste med `CoachDiaryView`
- `src/components/coach/CoachDiaryView.tsx` — ny komponent
- `src/lib/diaryFilters.ts` — ny delt helper-modul (udtræk fra `Diary.tsx`)
- `src/pages/Diary.tsx` — refaktor til at bruge `diaryFilters.ts` (ingen UI-ændring)

## Uden for scope

- At lade coach redigere/tilføje dagbogsindlæg
- Eksport af filtreret sæt til PDF
- Cross-athlete søgning på tværs af hele klubben
