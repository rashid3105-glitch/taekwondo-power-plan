## Problem
I `/coach/season-calendar` vises 31.05.2026 i mandagskolonnen for juni. Det er forkert (31.05.2026 er en søndag). Den rigtige dato i den celle er 01.06.2026.

## Årsag
I `src/pages/SeasonCalendar.tsx` (linje 132-143) bygges månedens datoer sådan:

```ts
const d = new Date(viewYear, viewMonth, 1);          // lokal midnat
...
days.push(d.toISOString().slice(0, 10));             // ← bug
d.setDate(d.getDate() + 1);
```

`new Date(2026, 5, 1)` er lokal midnat 1. juni. I dansk sommertid (UTC+2) konverterer `toISOString()` det til `2026-05-31T22:00:00Z`, så `.slice(0,10)` giver **"2026-05-31"**. Resultatet: hver celle viser dagen før (i UTC), mens dagens nummer renders via `new Date(iso+"T00:00:00").getDate()` — så cellen lander i mandags-slottet (fordi 1. juni er en mandag) men viser "31".

Samme fejl findes ikke i `src/components/hub/SeasonCalendarView.tsx` rent visuelt (den bruger samme mønster — bør tjekkes/fixes samme sted), men brugerens skærmbillede er coach-siden.

## Fix
Erstat `d.toISOString().slice(0,10)` med en lokal YYYY-MM-DD formatter, så ISO-strengen matcher den lokale dato:

```ts
const toLocalIso = (dt: Date) =>
  `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
```

og brug `toLocalIso(d)` i stedet.

## Ændringer
1. **`src/pages/SeasonCalendar.tsx`** — fix `calendarDays` memo (linje 132-143) til at bruge lokal ISO-formattering.
2. **`src/components/hub/SeasonCalendarView.tsx`** — samme fix i `daysInMonth` memo (samme mønster med `new Date(viewYear, viewMonth, 1)` + `toISOString().slice(0,10)`), så atletvisningen ikke får samme bug.
3. Hurtigt grep efter andre `toISOString().slice(0, 10)`-brug kombineret med lokal `new Date(y,m,d)` for at fange evt. yderligere forekomster — kun de der opfylder begge dele rettes.

Ingen DB/translation ændringer. Ingen anden adfærd røres.
