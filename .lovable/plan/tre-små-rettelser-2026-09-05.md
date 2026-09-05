# Tre små rettelser

## 1. Atleter fra en betalende klub markeres automatisk som betalt

Når en atlet accepterer et invitationslink, sættes klub og træner på profilen, men betalingsstatus forbliver "ikke betalt", så admin skal sætte den manuelt.

Ændring: når invitationen indløses, og klubben har en aktiv licens, sættes atletens betalingsstatus til "betalt" med dagens dato. Har atleten allerede status "betalt", ændres intet. Hører klubben ikke til en aktiv licens, er der ingen ændring.

## 2. Trænerens holdoversigt: knapper altid synlige, ingen grøn baggrund

- De tre ikonknapper nederst til højre på hvert atletkort vises altid — ikke kun når musen holdes over kortet (som på mobil i dag).
- Den grønne farve, der lyser op, når musen er over kortet, skyldes at systemets fremhævningsfarve er limegrøn. Kortet får i stedet en neutral, mørk fremhævning, så det bliver diskret mørkt i stedet for grønt.

## 3. Admin – rediger bruger: felterne står ikke i linje

I redigeringsvinduet står "Fødselsdato" og "Vægt" ved siden af hinanden, men fødselsdatoen har en hjælpetekst over feltet, så inputfelterne havner i forskellig højde. Samme problem for "Bæltegrad" og "Startdato".

Ændring: hjælpeteksterne flyttes ned under inputfeltet, så alle inputfelter i en række starter i samme højde, og rækkerne justeres til at flugte i toppen.

## Teknisk

- Databasefunktion `apply_invite_to_my_profile`: efter klubben er fundet, slå `clubs.license_active` op; ved true sæt `payment_status = 'paid'` og `payment_date = current_date` når profilen ikke allerede er betalt.
- `src/components/coach/SquadOverview.tsx`: kortets `hover:bg-accent/30` erstattes med en neutral hover (muted-baseret); handlingsknappernes `opacity-0 group-hover:opacity-100` fjernes, så de altid er synlige.
- `src/pages/AdminApproval.tsx` (rediger bruger-dialog, ca. linje 1230-1278): hjælpetekst under input, `items-start` på de to `grid-cols-2`-rækker.
- Ingen nye tekststrenge, så ingen oversættelser er nødvendige.
