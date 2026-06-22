PROBLEM
Både atlet-versionen (`MentalAssessment`) og træner-versionen (`CoachMentalAssessment`) viser hvid tekst oven på lyst kort i spørgsmåls-flowet. Årsag: teksten bruger `text-foreground`, men `ThemeSync` tvinger `--foreground` til hvid på mørk baggrund, mens kortene stadig er lyst grå (`--card` fra light-temaet). Resultat: usynlige spørgsmål og svarmuligheder.

MÅL
Sørg for sort/mørk læsbar tekst på alle sider i den mentale gennemgang (intro, spørgsmål, resultater, historik) — i både atlet- og træner-varianten. Rør ikke database, routing eller forretningslogik.

PLAN
1. Gennemgå `src/components/MentalAssessment.tsx` linje for linje og find alle steder, hvor tekst renderes inde i `<Card>` med `text-foreground`.
2. Erstat `text-foreground` med `text-card-foreground` for tekst, der ligger på lyst kort (spørgsmål, svar-knapper, resultatoverskrifter, intro-titel, historik-titler m.m.).
3. Gør det samme i `src/components/CoachMentalAssessment.tsx`.
4. Bevar alle øvrige klasser, farver og adfærd (valgte svar, hover, ikoner, score-farver).
5. Kør en visuel kontrol i preview: åbn mental gennemgang, bekræft at spørgsmålstekst og svarmuligheder er sorte/mørke på lyst kort, og gennemgå intro/resultat/historik.

FILDER DER ÆNDRES
- `src/components/MentalAssessment.tsx`
- `src/components/CoachMentalAssessment.tsx`

INGEN ÆNDRINGER I
- Database / Edge Functions / migrationer
- Router eller navigation
- Oversættelsesfiler (ingen nye nøgler)
- Andre moduler end de to mental-komponenter