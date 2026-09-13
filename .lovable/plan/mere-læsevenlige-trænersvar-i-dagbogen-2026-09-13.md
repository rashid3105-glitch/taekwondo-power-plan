# Mere læsevenlige trænersvar i dagbogen

Trænernes kommentarer i dagbogen står i dag som en tæt klump lille tekst: linjeskift fra træneren forsvinder, navn, tidspunkt og mærkater ligger på samme linje som teksten, og flere svar efter hinanden er svære at skelne.

## Det ændres

- Linjeskift og afsnit fra træneren bevares, så et svar med flere punkter faktisk vises med flere linjer.
- Selve svarteksten gøres lidt større og får mere luft mellem linjerne.
- Navn og tidspunkt står som en tydelig overskrift over svaret, med tydeligere adskillelse fra teksten.
- Mærkaterne (delt i klub / kun træner og atlet) og sletteknappen flyttes ned som en diskret række, så de ikke bryder læsningen.
- Hvert svar får tydeligere kort med mere afstand imellem, så flere svar ikke smelter sammen.
- Når samme træner svarer flere gange i træk, gentages navnet ikke; kun tidspunktet vises.

Ingen ændring i hvem der kan se hvad, i hvordan svar gemmes, eller i delings- og sletteknapperne — kun visningen.

## Teknisk

Kun `src/components/DiaryComments.tsx` (visningsdelen, linje 163–216):

- `whitespace-pre-line` på kommentarteksten, `text-sm leading-relaxed`.
- Header-rækken opdeles: navn + tid øverst, badges/slet i en fodrække med `mt-1.5`.
- Liste: `space-y-2.5`, hvert kort `rounded-lg border border-border/60 bg-accent/40 px-3 py-2.5`.
- Gruppering: sammenlign `coach_id` med forrige kommentar for at skjule gentaget navn.

Ingen nye oversættelsesnøgler, ingen databaseændringer, ingen ændring af kommentarfeltet eller coach-køen.
