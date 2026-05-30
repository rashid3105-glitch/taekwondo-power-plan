## Problem

The new dashboard side menu in `src/pages/Dashboard.tsx` has no "Ernæring" item, so the FoodScanner (which lives inside `activeTab === "nutrition"`) is unreachable. The Bibliotek → "Ernæring & opskrifter" link goes to `/library` → recipes only.

## Change

Add a single nav entry to `NAV_ITEMS` in `src/pages/Dashboard.tsx` (~line 315):

```ts
{ tab: "nutrition", icon: Apple, labelKey: "nutrition", color: "text-tab-nutrition" },
```

Place it after `testing` (so order becomes: Hjem, Plan, Sæsonkalender, Fremgang, Skade, Mental, Test, **Ernæring**, Bibliotek).

`Apple` icon is already imported (used in the existing nutrition bottom-tab definition at line 251). Translation key `nutrition` already exists in all 7 languages. No other files need changes — the existing `activeTab === "nutrition"` branch at line 1006 already renders the home view with the Kostplanlægger card (which contains FoodScanner) and the Opskrifter card.

## Result

Open side menu → tap "Ernæring" → see two cards → tap "Kostplanlægger & madregistrering" → FoodScanner appears at top.
