## Problem

Edge-funktionen returnerede `{"error":"Ingen mad fundet i billedet"}` for et billede der tydeligvis viser mad (avocado-toast, æg, blåbær, spinat). Modellen (`google/gemini-2.5-flash`) tog den nemme udvej i prompten.

## Fix i `supabase/functions/scan-food/index.ts`

1. **Stærkere vision-model**: skift default fra `google/gemini-2.5-flash` til `google/gemini-2.5-pro` — bedre billedforståelse, færre falske afvisninger.
2. **Strammere system-prompt**:
   - Fjern den "lette udvej" — modellen må KUN returnere `{"error":...}` hvis billedet helt klart ikke indeholder spiselig mad (fx landskab, person, tekst-dokument).
   - Eksplicit: "Hvis du er i tvivl, identificér så mange komponenter som muligt — returnér ALDRIG fejl for et tallerken-billede."
3. **Retry-fallback**: hvis første kald returnerer `{error: "Ingen mad fundet..."}`, kald gateway én gang til med endnu mere insisterende prompt ("Billedet indeholder garanteret mad — identificér komponenterne") før vi giver op.
4. Ingen ændringer i frontend, klient-API eller response-shape.

## Verifikation
Kald `scan-food` med det uploadede billede via `supabase--curl_edge_functions` og bekræft at `result.items` har ≥3 komponenter (toast, æg, blåbær, spinat).
