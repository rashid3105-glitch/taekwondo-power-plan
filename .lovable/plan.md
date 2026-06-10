
# Mockup-udvidelse: individuelle atleter i season-onboarding

Begge mockups forbliver isolerede sandboxes uden DB. Kun `src/pages/MockupSeasonOnboarding.tsx` ændres.

## 1. Atlet-vælger i Coach-view

Tilføj en lille toolbar over månedskalenderen (vises kun når en skabelon er valgt):

```text
[ Hele holdet ▾ ]   [ Sara K. ]  [ Jonas M. ]  [ Mikkel A. ]  [ Layla H. ]
```

- Lokal state `selectedAthlete: "team" | athleteId`.
- "Hele holdet" = nuværende visning (uændret).
- Når en atlet vælges: kalenderen viser ekstra individuelle tags/badges oven på holdets dage.

## 2. Individuelle overlays på dagene

Hver mock-atlet får 2–3 hårdkodede "individuelle fokus" knyttet til specifikke (uge, ugedag):

```ts
const ATHLETE_OVERLAYS = {
  sara:   [{week:2, dow:1, tag:"Ekstra bandal chagi"}, {week:3, dow:4, tag:"Sparring vs. højre"}],
  jonas:  [{week:1, dow:2, tag:"Knæ-rehab let"},      {week:4, dow:0, tag:"Eksplosivitet"}],
  mikkel: [{week:2, dow:5, tag:"Poomsae detail"}],
  layla:  [{week:3, dow:2, tag:"Mental: pres-scenarie"}],
};
```

I `MiniMonthCalendar`:
- Tag en `overlays` prop.
- Hvis en dag har et overlay: vis en lille farvet prik/ring (fx amber) ved dot'en + tilføj overlay-tag'en i popoveren under "Individuelt fokus".

Popover-indhold bliver:
```text
Uge 3 · Torsdag
● TKD
Hold: Sparring, Mental
─────────────
👤 Sara: Sparring vs. højre
```

## 3. Link til athlete-goals mockup

Når en specifik atlet er valgt, vises under kalenderen et lille kort:

```text
Vil du sætte langsigtede mål for Sara?
→ Åbn individuelle mål (sport / træning / teknik)   [knap]
```

Knappen linker til `/mockup/athlete-goals` (åbnes i samme tab via `<Link>`).

Når "Hele holdet" er valgt vises i stedet en mere generel CTA:
```text
Sæt individuelle mål pr. atlet → /mockup/athlete-goals
```

## 4. Lille forklarende banner-update

Coach-banneret tilføjes én linje:
> Vælg en atlet for at se hvor holdets plan suppleres med individuelt fokus.

## Tekniske detaljer

- Kun ét filændring: `src/pages/MockupSeasonOnboarding.tsx`.
- Ny `Athlete`-type + `ATHLETES` array + `ATHLETE_OVERLAYS` map.
- `MiniMonthCalendar` får ny prop `overlays?: {week:number; dow:number; tag:string}[]` og en `athleteName?: string`.
- `DayFocusContent` får ny prop `overlayTag?: string` + `athleteName?: string` til at vise den ekstra sektion.
- Atlet-vælger styles som de eksisterende role-toggle pills (genbruger samme look).
- Ingen ændringer i: App.tsx, routes, DB, RLS, edge functions, translations (mockup forbliver dansk-only som i dag), changelog, eller `/mockup/athlete-goals`.

## Hvad det IKKE er

- Ingen rigtig data — alt hårdkodet.
- Ingen edit-funktion (man kan ikke tilføje overlays i UI'et — kun se dem).
- Ingen påvirkning af den rigtige `/coach/season-calendar`.

Formålet er kun at vise konceptet "holdets plan + individuelle lag + langsigtede mål" i ét samlet flow, så coachen kan vurdere idéen.
