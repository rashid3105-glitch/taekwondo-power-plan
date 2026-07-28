# Redesign af atlet-dashboard "I dag"

## Mål
Omskrive atletens forside, så:
1. **Min plan** og **Holdets plan** vises som to selvstændige paneler (ikke én toggle).
2. **Dagbog** og **Beskeder** vises side om side på samme række.
3. Det visuelle følger den valgte retning: mørk "cockpit"-baggrund, guld-accenter (#c9a84c / #f0d78c), skarpe paneler, hero-grid-opbygning.

## Scope
Kun præsentations- og layoutændringer i atlet-dashboardet. Ingen ny business logic, ingen nye datakilder, ingen backendændringer.

## Filændringer

### 1. `src/components/hub/AthleteDashboard.tsx`
Hovedfilen omskrives visuelt, men beholdes al eksisterende data-logik.

**Nyt layout (top-til-bund):**
```text
┌─────────────────────────────────────────┐
│  I DAG · Tirsdag 28. jul          [Check ind]  │  ← lille header-række inde i komponenten
├──────────────────┬──────────────────────┤
│  MIN PLAN        │  HOLDETS PLAN        │  ← 2 paneler side om side
│  (individuel)    │  (fælles / landshold)│
├──────────────────┼──────────────────────┤
│  DAGBOG          │  BESKEDER            │  ← 2 paneler side om side
├──────────────────┴──────────────────────┤
│  Næste stævne + hurtig-genveje            │  ← eksisterende indhold beholdes
└─────────────────────────────────────────┘
```

**Konkrete ændringer:**
- Fjern den store "I DAG"-sektion med `planView`-toggle.
- Erstat den med en 2-kolonne grid (`md:grid-cols-2`), hvor venstre kolonne er "Min plan" og højre er "Holdets plan".
  - "Min plan" viser `todayPlan`-data (eller tom/helligdagstilstand).
  - "Holdets plan" viser `clubToday`-data (eller tom/helligdagstilstand).
  - Hver panel får en tynd guld venstrekant og en lille badge ("Individuel" / klubnavn/"Fælles").
- Flyt dagbog og beskeder ned i en ny 2-kolonne grid-række lige under planerne.
  - Dagbog: behold `latestDiary`, coach-comment-indikator og klik til dagbogsdialog.
  - Beskeder: behold `totalUnread`, klik til `/messages`.
- Behold næste stævne + hurtig-genveje nederst, men juster styling så det passer til den nye guld/mørke palette.
- Bevar alle eksisterende handlers: klik på plan-paneler går til `/dashboard?tab=plan`, dagbog åbner dialog, beskeder går til `/messages`.
- Behold loading-skeletons og empty states.

**Styling:**
- Baggrund: eksisterende `#0a0a0a` (komponenten sætter allerede `backgroundColor: "#0a0a0a"`).
- Paneler: mørkere overflade (`#1a1a1a` / `bg-white/[0.03]`), tynde grænser (`border-white/10`).
- Accenter: guld venstrekant på primære paneler, guld tekst/badges/knapper.
- Hvis `--accent-hex` ikke allerede er guld, tilføjes en ny CSS-variabel eller bruges Tailwind-arbitrære værdier (`bg-[#c9a84c]`, `text-[#f0d78c]`) begrænset til dette view.
- Mobil: alle 2-kolonne grids stables til 1 kolonne under `md`-breakpoint.

### 2. `src/index.css`
- Verificér at `--accent-hex` findes og hvilken farve den har.
- Hvis nødvendigt, tilføj en scoped guld-token (f.eks. `--gold: #c9a84c; --gold-light: #f0d78c;`) så komponenten kan bruge semantiske variable i stedet for hårdkodede hex-værdier.

### 3. `src/i18n/translations.ts`
Tilføj eller genbrug nøgler til:
- `hubPlanMineTitle` = "Min plan"
- `hubPlanClubTitle` = "Holdets plan"
- `hubCheckIn` = "Check ind" / "Registrer fremmøde"
- Evt. badge-tekster: "Individuel", "Fælles".

Oversættes til alle 7 sprog (da, en, sv, de, ar, no, es).

### 4. `src/pages/Help.tsx`
- Opdater changelog med redesign af atlet-dashboardet.

## Teknisk tilgang
- Ingen nye dependencies.
- Genbrug eksisterende Lucide-ikoner (`Calendar`, `Trophy`, `NotebookPen`, `MessageCircle`, `Play`, `BarChart3`, `Video`).
- Ingen ændringer i datafetching — `useEffect`, `todayPlan`, `clubToday`, `latestDiary`, `totalUnread` beholdes.
- Sørg for at `SelfTrainingLogDialog` og dagbogsdialog stadig fungerer.

## Acceptkriterier
- [ ] Atlet-dashboardet viser to separate plan-paneler uden toggle.
- [ ] Dagbog og beskeder vises side om side på desktop og stablet på mobil.
- [ ] Farver og typografi matcher den valgte Noir & Gold / Sora + Manrope-retning.
- [ ] Alle eksisterende klik- og navigations-flows stadig virker.
- [ ] Build (`bun run build`) fejler ikke.
- [ ] Ingen console errors ved visning af dashboardet.
- [ ] Hjælp-sidens changelog er opdateret.