## Mål
På `/mockup/season-onboarding` skal man kunne hovre (desktop) eller tappe (mobil) på en dag-prik i `MiniMonthCalendar` og se dagens fokus-tags. Gælder begge visninger (coach + atlet), da begge bruger samme komponent.

## Ændringer (kun i `src/pages/MockupSeasonOnboarding.tsx`)

1. **Definer en mock dags-fokus-mapping** ved siden af `weekPattern`:
   - `sky` (TKD) → `["Teknik", "Sparring"]`
   - `emerald` (Styrke) → `["Styrke", "Kondition"]`
   - `rose` (Stævne) → `["Konkurrenceforberedelse", "Mental"]`
   - `muted` (Hvile) → `["Restitution"]`
   - Variér let pr. ugedag, så det ikke virker statisk (fx tirsdag = Teknik+Kondition, torsdag = Sparring+Mental).

2. **Tilføj tooltip på prikkerne** i `MiniMonthCalendar`:
   - Brug eksisterende `HoverCard` fra `@/components/ui/hover-card` (allerede i projektet) for desktop hover.
   - Wrap hver dag-celle (`div` med dato + prik) i `HoverCard` / `HoverCardTrigger`.
   - `HoverCardContent` viser:
     - Lille header: "Uge {w} · {ugedag}" 
     - Type-label (TKD / Styrke / Stævne / Hvile) med farveprik
     - Tag-chips med fokus-tags (samme stil som de eksisterende chips: `rounded-full bg-secondary px-2 py-0.5 text-[10px]`)
   - Hvis dagen er hvile, vis blot "Restitution" som muted tekst.
   - Sæt `openDelay={80}` så det føles snappy, og giv triggeren `cursor-help` så det signalerer interaktivitet.

3. **Mobil-fallback**: `HoverCard` understøtter ikke touch. Tilføj `onClick` på cellen der toggler en lokal `activeDay`-state og viser samme indhold i en lille popover (kan reuse `HoverCardContent` via `open`-prop, eller simpelt absolutpositioneret kort under prikken). Holdes minimalt — det er en mockup.

4. **Visuelt hint**: Tilføj en lille linje under kalenderen ("Hold musen over en dag for at se fokus") så det er opdageligt.

## Hvad jeg IKKE rører
- `SeasonCalendarView` (rigtige atlet-visning), `SeasonCalendar.tsx`, `seasonCalendar.ts`, RLS, DB, oversættelser, changelog.
- Resten af mockup-siden (banner, template picker, fase-liste, role-toggle).
