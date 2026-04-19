

## Plan: Fix Mixed-Up Norwegian Translations

### Problem confirmed

The Norwegian (`no`) section in `src/i18n/translations.ts` is a half-finished derivation from Danish:

- **852 keys vs 859** in other languages → 8 missing (`session`, `sessions`, `sessionsWeek`, `addSession`, `removeSession`, `gymSession`, `nSessions`, `latestMentalScore`) plus 1 mistranslated key name (`latestMentalPoengsum` should be `latestMentalScore`).
- **~230+ entries are still pure Danish** (e.g. `weeklySchedule: "Ugeplan"` → should be `"Ukeplan"`, `sparring: "Sparring (Kæmper)"` → `"(Kjemper)"`, `tkdPerWeek: "TKD/uge"` → `"TKD/uke"`).
- **Many half-translated entries with Danish leftovers** mixed into Bokmål sentences: words like `for at` (NB: `for å`), `kræver` (NB: `krever`), `mellem` (NB: `mellom`), `undgår` (NB: `unngår`), `fundet` (NB: `funnet`), `gemmes/gem` (NB: `lagres/lagre`), `kunne ikke` (NB: `kunne ikke` — same, but combined with Danish verbs around it), `ind/ud` (NB: `inn/ut`), `klik/klikk`, `vælg`, `bytte mellem`, `på/at` confusion.
- **Typos introduced during partial translation**: `tilbakestillling` (3 l's), `passordn`, `opprettte`, `godkjennelse` (should be `godkjenning`).

### Fix

Rewrite the entire `no: { ... }` section (lines ~4567–5499) of `src/i18n/translations.ts` so that:

1. **All 859 keys present** — match the `en` keyset exactly. Add the 8 missing keys, rename `latestMentalPoengsum` → `latestMentalScore`.
2. **Every value is proper Norwegian Bokmål** — systematic pass replacing Danish forms:
   - `uge → uke`, `kæmper → kjemper`, `gemme/gemt → lagre/lagret`, `kræver → krever`, `mellem → mellom`, `undgår → unngår`, `fundet → funnet`, `tilbage → tilbake` (already mostly done), `ind/ud → inn/ut`, `for at → for å`, `at + infinitive → å + infinitive`, `nogen/noget → noen/noe`, `hvad → hva`, `nu → nå`, `igen → igjen`, `også → også` (same), `meget → mye`, `bliver/blev → blir/ble`, `give/giver → gi/gir`, `sådan → slik/sånn`, `sammen med → sammen med` (same), `tjek → sjekk`, `opret → opprett`, `gemmes → lagres`, `valgt → valgt` (same), `tilføj → legg til`, `fjern → fjern` (same), `klik → klikk`, `vælg → velg`, `spørgsmål → spørsmål`, `mål → mål` (same).
3. **Fix all typos** (`tilbakestillling`, `passordn`, `opprettte`, `kjennelse`).
4. **Keep proper-name values intact** (Sportstalent, Stripe, etc.) and keep ICU placeholders (`{name}`, `{count}`) untouched.
5. **Order keys identically to the `da` section** so future diffs stay clean.

### Approach

Programmatic rewrite: read the `da` section as the structural template (since Norwegian Bokmål is closest to Danish), apply a deterministic Danish→Bokmål substitution table to every value, then overwrite the `no` block. Manually QA ~30 high-visibility strings (hero, nav, dashboard, auth, errors).

### Files modified

- `src/i18n/translations.ts` — rewrite the `no: { ... }` block only. No other files touched.

### Verification after implementation

I'll re-run the keycount check (must show 859/859/859/859/859/**859**) and the Danish-marker scan (target: near-zero hits, allowing legitimate shared words like `og`, `til`, `din`, `samme`, `med`).

