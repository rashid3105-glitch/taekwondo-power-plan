# Bedre coach-flow til at starte tests

## Mål
Gør det enklere for coachen at starte en test. I dag skal man først vælge atleter i toppen og derefter åbne en katalog-dialog. Det vendes om: **vælg test → vælg atleter → start**, præcis som Beep test-flowet — men tilgængeligt for alle tests via et tydeligt **Start-ikon** pr. række.

## Ændringer

### 1. Test-katalog som hovedvisning (coach mode)
I `PhysicalTesting.tsx` fjernes den store "Vælg atleter"-boks i toppen for coach mode. I stedet vises testkataloget direkte (grupperet pr. kategori, som i screenshot #2 — "Udholdenhed 7", "Hurtighed 4" osv.), så coachen ser alle tests med det samme.

Hver række får i højre side:
- Et **Start-ikon** (Play-knap i primær farve, rund, h-9 w-9) — det er den primære call-to-action
- Den eksisterende chevron/expand til detaljer beholdes

For atleter (individual mode) ændres ikke noget visuelt udover at Start-ikonet også bruges der (springer athlete-picker over og går direkte til runner).

### 2. Athlete-picker som mellemtrin (coach mode)
Når coachen trykker Start på en test åbnes en lille dialog magen til Beep Test Timer-pickeren (screenshot #3):

```text
┌─────────────────────────────────┐
│ 🏃 12-minutters løb (Cooper)  ✕ │
│ Vælg atleter        Vælg alle   │
│ ○ Annamaria Fallesen            │
│ ○ Danilo                        │
│ ○ Hassan Ali                    │
│ ...                             │
│ ─────────────────────────────── │
│ [    Start test  (3 valgt)   ]  │
└─────────────────────────────────┘
```

- Genbruger samme look som `BeepTestTimer`s picker (mørk card, orange accent, runde radio-style checkboxes, "Vælg alle"-link)
- Knappen er disabled indtil mindst én atlet er valgt
- Ved tryk på Start → lukker pickeren og åbner `TestRunner` med de valgte atleter (allerede understøttet via `athletes`-prop)
- Beep Test bruger samme picker (sin egen er allerede der — beholdes)

### 3. Fjern dobbelt-X på Beep Test-dialogen
Screenshot #3 viser to ✕-knapper øverst til højre. Den ene kommer fra shadcn `DialogContent` (default close), den anden fra `BeepTestTimer`s egen header. Løsning: fjern den interne close-knap i `BeepTestTimer` (behold kun shadcn-default). Samme tjek køres på den nye athlete-picker dialog, så vi ikke gentager fejlen.

### 4. Fjern den gamle multi-select boks
Den nuværende "Vælg atleter"-checkbox-liste + "Fokus atlet"-selector i toppen fjernes for coach mode (overflødig nu, da valg sker pr. test). "Fokus atlet" flytter ned i **Progression**- og **Resultater**-fanerne som en kompakt dropdown (vises kun når der er historik for flere atleter).

## Filer der ændres
- `src/components/PhysicalTesting.tsx` — fjern top-multi-select, vis katalog direkte, ny start-flow med picker-dialog, flyt focus-athlete dropdown ned i tabs
- `src/components/testing/TestCatalogPicker.tsx` — tilføj Start-ikon pr. række (primær)
- Ny: `src/components/testing/TestAthletePicker.tsx` — genbrugelig athlete multi-select dialog (matcher Beep-stil)
- `src/components/BeepTestTimer.tsx` — fjern intern ✕-knap (behold shadcn default)
- `src/i18n/translations.ts` — nye nøgler: `ptStartTest`, `ptSelectedCount` på alle 7 sprog (en, da, sv, de, ar, no, es)

## Ikke ændret
- Selve `TestRunner`-komponenten (multi-athlete entry virker allerede)
- Datamodellen / `physical_test_results` skrivning
- Athlete-tilstand (mode "individual") — fungerer som i dag, blot med nyt Start-ikon
