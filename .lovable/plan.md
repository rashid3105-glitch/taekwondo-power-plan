

## Plan: Redesign landing page — fewer ord, mere visuelt impact

### Problemet nu
Siden har 3 lange prosa-sektioner ("What is Sportstalent?", "Who is it for?", "How it works") med 3 afsnit tekst hver. Det føles som en artikel, ikke en salgside. Brugere scanner — de læser ikke 500 ord før de beslutter sig.

### Designprincipper
- **Scan-venligt**: Erstat lange afsnit med korte one-liners + ikoner/visuelle elementer
- **Social proof tidligt**: Flyt case study ("10.5% jump increase") op, tættere på hero
- **Klar værdi-hierarki**: Hero → proof → features → ugeplan → FAQ → CTA
- **Mere whitespace og visuel rytme**: Veksle mellem mørke og lette sektioner

### Ny sektions-rækkefølge

```text
1. Hero (forkortet — 1 sætning subtitle i stedet for 3 linjer)
2. Social proof bar (kort stat-linje: "Used by 50+ athletes · 10.5% avg jump increase")
3. 3-kolonne "What you get" (ikon + titel + 1 sætning, erstat den lange What is + Who is for)
4. Weekly plan eksempel (behold — det er stærkt visuelt)
5. Case study (behold men kompakt)
6. Feature grid (behold)
7. FAQ (behold)
8. CTA (behold)
```

### Konkrete ændringer

**`src/pages/Index.tsx`**
- Fjern sektionerne "What is Sportstalent?", "Who is it for?", "How it works" (3 lange prose-blokke)
- Forkort hero subtitle til 1 sætning
- Tilføj en ny "social proof bar" under hero — 3 stat-badges i en række
- Omskriv "What you get" sektionen til et 3-kolonne grid med ikon + kort titel + 1 sætning (i stedet for de 6 listeformaterede items)
- Flyt ugeplanen op (lige efter det nye grid)
- Behold CaseStudy, FeatureGrid, FAQ og CTA som de er

**`src/i18n/translations.ts`**
- Tilføj nye korte keys til social proof bar og omskrevne sektioner
- Fjern ubrugte lange tekst-keys (oprydning)

### Visuelt resultat

```text
┌─────────────────────────────────────────┐
│  HERO: Titel + 1 sætning + CTA         │
├─────────────────────────────────────────┤
│  ⚡ 50+ athletes  📈 10.5% jump  🏆 U21│  ← social proof
├─────────────────────────────────────────┤
│  [Periodized]  [Sport-specific]  [AI]   │  ← 3-col value props
│   1 sætning     1 sætning      1 sætn. │
├─────────────────────────────────────────┤
│  📅 Weekly Plan Example (7 day cards)   │
├─────────────────────────────────────────┤
│  Case Study (behold)                    │
├─────────────────────────────────────────┤
│  Feature Grid (behold)                  │
├─────────────────────────────────────────┤
│  FAQ (behold)                           │
├─────────────────────────────────────────┤
│  CTA (behold)                           │
└─────────────────────────────────────────┘
```

### Filer der ændres
- `src/pages/Index.tsx` — primær omstrukturering
- `src/i18n/translations.ts` — nye korte keys, fjern gamle

