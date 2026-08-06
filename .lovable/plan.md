# Fejl i skridt- og kalorietal efter Apple Health-synk

## Hvad der er galt

Bekræftet i data: for 6. august ligger der to kilder for samme dag — iPhone (23.593 skridt) og Apple Watch (21.694 skridt). Appen lægger dem sammen til 45.287, mens Apple Health viser 22.153, fordi Apple selv fjerner overlap mellem telefon og ur.

Samme problem rammer aktiv energi (kcal), som også summeres på tværs af begge enheder. Puls, hvile-puls, HRV og søvn er ikke ramt på samme måde (de bruger gennemsnit / natvindue).

## Rettelse

1. Skridt pr. dag beregnes fremover som **den højeste enkeltkildes total** for dagen i stedet for summen af alle kilder. Med eksemplet ovenfor giver det ca. 23.593 i stedet for 45.287 — tæt på Apples eget tal.
2. Samme logik for aktiv energi (kcal).
3. Alle allerede gemte dage genberegnes én gang, så historikken og graferne på Sundhed-siden retter sig med det samme (også for de andre brugere).
4. Manuelt indtastede tal bevares uændret — den nuværende beskyttelse (rør kun feltet, hvis der findes målinger den dag) bliver stående.

Bemærk: tallet kan stadig afvige et par hundrede skridt fra Apple Health, fordi Apple flætter kilder minut for minut. At vælge den stærkeste kilde er den gængse og sikre metode og fjerner dobbelttællingen.

## Teknisk

- Migration: `public.recompute_wearable_summary` ændres, så `v_steps` og `v_energy` beregnes som `MAX(pr. source_device-sum)` i stedet for `SUM(alle)`, med `source_device IS NULL` behandlet som én kilde.
- Samme migration kører en engangs-genberegning for alle `(user_id, dato)`-kombinationer, hvor der findes `wearable_samples` for skridt/energi.
- Ingen ændringer i `wearable-ingest`, i iOS/Android-klienten eller i UI — kun beregningen i databasen.
- Changelog + Help opdateres (v1.5.22) med en kort note om korrigeret skridtberegning.
