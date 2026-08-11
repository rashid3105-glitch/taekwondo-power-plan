# Promo-banner på forsiden: justering + ny tekst

## 1. Layout på PC-skærm

Banneret på forsiden (den smalle stribe under menuen) har elementer der ikke står på samme grundlinje: prikken, "BETA ÅBEN"-labelen i monospace, brødteksten og knappen har hver sin skriftstørrelse og linjehøjde, så teksten ser ud til at "hænge" for højt i forhold til knappen.

Rettelser:

- Sæt ensartet `line-height: 1` på label, tekst og knap, så de deler samme optiske midte.
- Øg bannerets lodrette padding en smule på desktop (fra 6px til 10px) så indholdet får luft.
- Giv knappen samme lodrette centrering (flex, `align-items: center`) og lidt højere padding, så den ikke trækker rækken skæv.
- Luk-krydset centreres lodret med `top: 50%` / `translateY(-50%)` i stedet for at flyde med rækken.

Ingen ændring på mobil ud over at samme centrering også gælder der.

## 2. Ny bannertekst

Nuværende: "BETA ÅBEN — Få 2 måneder gratis når du opretter din klub" + knap "Kom med →".

Forslag (mit bud, DA):

- Label: `TEST SELV`
- Tekst: "Se platformen live — book en uforpligtende demo"
- Knap: `Book demo →` (linker til /contact i stedet for /auth?tab=signup)

Teksten opdateres i alle 7 sprog (DA, EN, SV, DE, AR, NO, ES) via nøglerne `homePromoLabel`, `homePromoText`, `homePromoCta`.

## Teknisk

- `src/pages/Index.tsx` linje 185-201: styling af promo-banneret, og knappens `navigate("/auth?tab=signup")` ændres til `navigate("/contact")`.
- `src/i18n/translations.ts`: opdater `homePromoText` og `homePromoCta` i alle 7 sprogobjekter.