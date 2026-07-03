## Mål
Ny side der viser alle **samtykker** i klubben — både voksne (self) og børn under 18 (parent) — så coachen kan dokumentere GDPR-grundlaget.

## Mockup (layout)

```text
┌─────────────────────────────────────────────────────────────────────┐
│  ← Tilbage                                                          │
│  Samtykker · Copenhagen City                            [Eksport CSV]│
│  42 aktive · 3 tilbagetrukket · 5 mangler                           │
├─────────────────────────────────────────────────────────────────────┤
│  [Alle] [Voksne] [Under 18] [Mangler]      🔎 Søg navn…             │
├─────────────────────────────────────────────────────────────────────┤
│  Atlet              Type      Godkendt af           Dato       Status│
│  ─────────────────────────────────────────────────────────────────── │
│  Adam Nielsen       Voksen    Adam Nielsen (selv)   03-07-2026  ●   │
│  Liva Sørensen (14) Forælder  mor@mail.dk (forældre)28-06-2026  ●   │
│  Noah Berg (12)     Forælder  —                     —           ⚠   │
│  Sara Holm          Voksen    Sara Holm (selv)      12-05-2026 ⊘tilbage│
│  …                                                                  │
└─────────────────────────────────────────────────────────────────────┘
● Aktiv    ⚠ Mangler    ⊘ Tilbagetrukket
```

Kolonner:
- **Atlet** — navn (+ alder hvis under 18)
- **Type** — Voksen (self) / Forælder (parent)
- **Godkendt af** — `granted_by_email` + `granted_by_relation` (selv / forældre); tom hvis mangler
- **Dato** — `granted_at` formateret dansk
- **Status** — badge: aktiv / mangler / tilbagetrukket · policy-version som tooltip

Øverst tællere + filterknapper + søgning. Eksport CSV-knap (navn, type, email, relation, dato, status, policy).

## Adgang
- Ny rute `/coach/consents`
- Ny knap på **CoachDashboard** ved siden af `ConsentMissingButton` (linje 433): "Samtykker" (shield-icon, outline). "Mangler"-knappen forbliver som hurtig-adgang til de manglende.

## Data
Én query pr. klub (RLS tillader allerede coach-læsning):
```sql
select cr.athlete_id, cr.status, cr.granted_at, cr.granted_by_email,
       cr.granted_by_relation, cr.policy_version, cr.withdrawn_at,
       p.display_name, p.birth_date, p.age
from consent_records cr
join profiles p on p.user_id = cr.athlete_id
where cr.club_id = :club_id
  and cr.consent_type = 'health_data_processing';
```
+ liste af klubmedlemmer der **ikke** har nogen række → vises som "Mangler".

Alder beregnes klient-side via eksisterende `effectiveAge()`. Ingen migrations eller edge-functions nødvendige.

## Filer
- **Ny**: `src/pages/CoachConsents.tsx` — side (tabel, filtre, søg, CSV-eksport)
- **Ret**: `src/App.tsx` — rute `/coach/consents`
- **Ret**: `src/pages/CoachDashboard.tsx` — tilføj "Samtykker"-knap ved siden af `ConsentMissingButton`
- **Ret**: `src/i18n/translations.ts` — nye nøgler i alle 7 sprog (titel, kolonner, filtre, statuslabels, CSV-headers, tom-state)

## Ikke inkluderet (spørg hvis ønsket)
- Handlingsknapper (send påmindelse, tilbagetræk) — findes allerede i `ConsentMissingPanel`
- Historik/audit-log ud over nuværende `granted_at` / `withdrawn_at`
