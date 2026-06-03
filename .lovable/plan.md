## Problem 1: "Stuck" on coach dashboards

Den admin/coach-bruger har `role === "coach"` (via active membership). I `src/pages/Dashboard.tsx` linje 190–194 redirecter `/dashboard` automatisk en coach til `/coach`. Pilen tilbage i `CoachDashboard` peger på `/dashboard` → loop. Pilen i `SeasonCalendar` peger på `/coach`, så man kan ikke komme videre til forsiden derfra heller.

**Fix:** Lad tilbage-pilen på begge coach-sider gå direkte til forsiden `/` i stedet.

- `src/pages/CoachDashboard.tsx` (linje 334): `navigate("/dashboard")` → `navigate("/")`
- `src/pages/SeasonCalendar.tsx` (linje 479): `navigate("/coach")` → `navigate("/")`

(Vi rører IKKE redirect-logikken i Dashboard.tsx — den er korrekt for en ren coach.)

## Problem 2: ClubSwitcher skal under overskriften

I `CoachDashboard.tsx` ligger `<ClubSwitcher />` i højre side af header-rækken sammen med Trænings-/Beskeder-/Sprog-knapper, hvilket gør rækken overfyldt på mobil.

**Fix i `src/pages/CoachDashboard.tsx` header-blokken (linje 331–352):**

- Behold række 1 = tilbage-pil + ikon + "Træner Dashboard" + (sæsonkalender-knap, beskeder, sprogvælger).
- Fjern `<ClubSwitcher />` fra række 1.
- Tilføj en række 2 under titel-rækken (stadig inden i `<header>`), som kun rendres når brugeren har >1 medlemskab — `ClubSwitcher`-komponenten self-skjuler allerede ved ≤1, så vi placerer den bare i en `flex justify-end` wrapper med lidt top-margin: `<div className="px-3 sm:px-4 pb-2 flex justify-end"><ClubSwitcher /></div>`.
- Gør samtidig switcherens trigger lidt bredere (`min-w-[180px]`) så klubnavnet ikke trunkeres til "UC…".

**Lille justering i `src/components/ClubSwitcher.tsx`:**
- Ændr `min-w-[140px]` → `min-w-[180px]` og fjern `w-auto` så den ikke shrinker.

## Problem 3: SeasonCalendar header skubbet til venstre / out of bounds

I `src/pages/SeasonCalendar.tsx` linje 477 bruger headeren `justify-between` med titel + "Udskriv / Eksporter PDF"-knap + `LanguageSwitcher`. På mobil (402 px) bliver indholdet bredere end viewport → højre side klippes/ skubbes ud.

**Fix i header-blokken (linje 476–494):**

- Tilføj `min-w-0` på begge inner-divs så de må shrinke.
- Gør titel-spannet til `truncate`.
- På mobil: vis kun printer-ikon uden tekst — `<Printer />` med `<span className="hidden sm:inline ml-1">{t("seasonPrint")}</span>`.
- Konsistens med Coach-dashboard: lad tilbage-pilen pege på `/` (se Problem 1).

Ingen ændringer i forretningslogik, RLS, edge functions eller oversættelser. Ingen changelog-opdatering (lille bugfix + layout-justering).

## Tekniske ændringer (filer)

```text
src/pages/CoachDashboard.tsx   — back-nav til "/", flyt ClubSwitcher til ny række under titel
src/pages/SeasonCalendar.tsx   — back-nav til "/", header min-w-0 + truncate + print-knap kun ikon på mobil
src/components/ClubSwitcher.tsx — min-w-[180px], fjern w-auto for at undgå "UC…" trunkering
```
