# Klubanalysen: skarpere spørgsmål og en mere sandfærdig analyse

## Kort vurdering af det, der findes i dag

**Spørgsmålene (15 stk., 3 pr. område, 4 svarmuligheder)**
- Hvert område kan kun lande på 0-9 point ud fra 3 spørgsmål. Det er groft: ét enkelt svar flytter en tredjedel af området.
- Samlet niveau sættes af det svageste område (`Math.min`). Et enkelt lavt svar kan alene sende hele klubben ned på "Begynder". Det er retorisk stærkt, men ikke altid retvisende.
- Der er ingen "ved ikke"-mulighed. Den, der svarer, gætter i stedet — og gætter typisk pænere end virkeligheden.
- Alle svar kommer fra én person. En formand og en træner svarer forskelligt på de samme spørgsmål, og der er ingen justering for det, selvom rollen allerede indsamles.
- Et par spørgsmål blander to ting i samme svar (fx administrationstid, hvor svarene både handler om hvor meget tid og om hvorvidt I har målt det). Det gør svaret svært at tolke.
- Alle spørgsmål vender samme vej (sidste svar er altid det bedste). Det inviterer til at klikke sig ned ad højre side.

**Analysen**
- Den bygger på rigtige tal, så retningen er troværdig: svageste område, stærkeste område og konsekvenserne er reelt klubbens egne svar.
- Men den ser ikke, hvad klubben faktisk svarede. Kun tallene og en talrække sendes med — ikke spørgsmålsteksterne eller de valgte svar. Derfor må modellen digte de konkrete detaljer, og "Kritiske huller" bliver generisk frem for citérbart.
- Afsnittet "Sådan hjælper Sportstalent" har ingen faktaliste at holde sig til, så den kan komme til at love moduler eller funktioner, som ikke findes.
- Klubstørrelse, antal hold og antal trænere indgår ikke, selvom rådene til en klub med 40 og 400 medlemmer er vidt forskellige.

## Hvad jeg foreslår

### 1. Analysen får det fulde svargrundlag (størst effekt, mindst arbejde)
- Send spørgsmålstekst + det valgte svar ordret med i grundlaget, ikke bare talrækken.
- Send også pointene pr. område med navn og niveau, samt de tre laveste og tre højeste enkeltsvar.
- Tilføj en fast liste over, hvad platformen faktisk kan, og bed om, at afsnittet "Sådan hjælper Sportstalent" kun må bruge punkter fra den liste.
- Bed om, at hvert kritisk hul citerer klubbens eget svar.

### 2. Spørgsmålene gøres mere finmaskede
- Fra 15 til 20 spørgsmål: 4 pr. område, så et enkelt svar fylder mindre.
- To af de nye spørgsmål formuleres omvendt (første svar er det bedste), så man ikke kan klikke sig igennem på autopilot.
- Tilføj "Ved ikke" som svar. Det tæller som 0 point, men markeres særskilt, så analysen kan skelne "vi er dårlige" fra "vi ved det ikke" — det sidste er i sig selv et fund.
- Ryd op i de spørgsmål, der blander to ting, så hvert spørgsmål måler én ting.

### 3. Niveauet bliver mere fair uden at blive blødt
- Vis fortsat "svageste led" som klubbens niveau, men beregn det på et område, ikke på et enkelt svar: et område skal have mindst to lave svar for at trække hele niveauet ned.
- Vis både samlet niveau og gennemsnit på resultatsiden, så billedet er ærligt.

### 4. Lidt mere kontekst
- To ekstra felter i starten: antal medlemmer (interval) og antal aktive trænere (interval). Begge frivillige, begge med i analysen.

## Teknisk
- `src/data/clubAssessment.ts` + `src/data/clubAssessmentEn.ts`: nye spørgsmål, "ved ikke"-værdi (-1 gemmes særskilt), justeret `levelForScore`/samlet niveau.
- `supabase/functions/_shared/club-assessment-content.ts`: uændrede dimensionstekster, ny konstant med platformens reelle moduler til brug i prompten.
- `supabase/functions/analyze-club-assessment/index.ts`: prompten bygges af spørgsmål + valgte svar + områdescorer + kontekst; strammere instruks om kun at bruge modul-listen.
- `supabase/functions/send-assessment-report/index.ts`: samme niveaulogik som frontend.
- `club_assessments`: to nye valgfrie kolonner til medlems- og trænerinterval; eksisterende rækker påvirkes ikke.
- Gamle besvarelser med 15 svar skal fortsat kunne vises på adminsiden.

## Bemærk
Ændres spørgsmålene, kan nye og gamle besvarelser ikke sammenlignes direkte. Der gemmes et versionsnummer på hver besvarelse, så adminsiden kan vise, hvilken udgave svaret stammer fra.
