## Hvad bygges

Du valgte **"Flat mørk elevated"** retningen. To sammenhængende rettelser, kun frontend.

### 1. Library-kort: ét unified mørkt look

Fil: `src/pages/LibraryChooser.tsx`

- Erstat regnbue-`bgClass` (orange/lilla/grøn/gul/rød/emerald) med ét unified mørkt look på ALLE 7 kort:
  - Kort: `bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/80`
  - Ikon-tile: `bg-primary/10` med ikon i kortets egen farve (beholder den lille farvekode via `lib.color` → ikonet, IKKE kortet)
  - Titel: `text-zinc-100 font-bold` (ikke `text-card-foreground` som blender ud)
  - Beskrivelse: `text-zinc-400`
- Fjerner pr.-kort `bgClass` feltet helt fra `libraries` listen (forenkler datastrukturen). Ikon-farver (`color`) bevares så hvert modul stadig har et lille visuelt anker på ikonet.
- Samme behandling i `Library.tsx` for nutrition-undersiden (samme 3 kort har lige nu emerald/nutrition/amber bg — gøres unified).

### 2. Grå-på-mørk tekst (læsbarhedsbug)

Problemet: i den autentificerede cockpit (mørk baggrund) bruges hvide `bg-card` kort med `text-card-foreground` mange steder, men når kortet ligger direkte på mørk baggrund og selv bliver mørk/transparent, forsvinder `muted-foreground` tekst i grå tone.

Scope holdt **minimal og målrettet** — kun de skærme du viste:
- **LibraryChooser** (skærmbillede 4): løses i punkt 1.
- **Plan-siden ugeoversigt** (skærmbillede 1 — dagskort MAN/TIR/ONS med utydelige sessions-navne): gør tekst på inaktive dagskort til `text-foreground` i stedet for `text-muted-foreground` så "Eksplosiv Underkrop & RFD" osv. er læsbart. Lokaliseres i `src/components/PlanWeekView.tsx` eller den komponent der renderer dagspillerne (jeg finder den præcise fil i build).
- **Custom Exercise dialog** (skærmbillede 2 — "Add Custom Exercise", labels usynlige): dialogen har hvid baggrund men labels står i lys grå. Fix: tving labels til `text-foreground` i `AddCustomExerciseDialog` (eller den filnavn der bruges).
- **Tuesday-kort på Plan** (skærmbillede 3 — "Strength & Speed Session A" overskrift forsvinder): session-titlen sættes til `text-foreground` på det aktive dagskort i stedet for muted.

### Hvad ikke ændres

- Ingen ændringer i andre sider, tokens i `index.css`/`tailwind.config.ts`, RLS, database, edge functions, oversættelser, eller changelog.
- Hub-chips, bottom nav, header, andre tab-farvekoder bevares uændret.
- Ingen "global søg/erstat" af `muted-foreground` — kun de 4 konkrete steder ovenfor.

### Filer der røres

- `src/pages/LibraryChooser.tsx`
- `src/pages/Library.tsx` (nutrition-undersidens 3 kort)
- Plan ugeoversigt-komponent (find præcis i build — `PlanWeekView` / `WeekDayCard`)
- Custom exercise dialog-komponent (find præcis i build)

Rapport efter build: præcis hvilke filer + hvilke linjer.