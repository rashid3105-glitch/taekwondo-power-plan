## Problem

I `src/pages/Dashboard.tsx` linje 916–923 renderes to ekstra legacy-komponenter direkte under `<AthleteDashboard />` / `<CoachDashboard />`:

- `<HubTodayHero ... />` — det gamle "I DAG"-kort
- `<HubNextEvent event={nextEvent} />` — det gamle "Næste begivenhed"-kort

De er ikke skjult bag `SHOW_LEGACY_HUB_SECTIONS`-flag'et, så de vises altid og duplikerer dermed de nye sektioner inde i `AthleteDashboard`. Det er dem du ser nederst på skærmbilledet.

## Plan

Skjul begge linjer bag den eksisterende `SHOW_LEGACY_HUB_SECTIONS`-feature-flag, så de kan vækkes igen senere:

```text
{SHOW_LEGACY_HUB_SECTIONS && <HubTodayHero ... />}
{SHOW_LEGACY_HUB_SECTIONS && <HubNextEvent event={nextEvent} />}
```

Ingen ændringer i `AthleteDashboard.tsx`, `CoachDashboard.tsx`, `Help.tsx` eller changelog.
