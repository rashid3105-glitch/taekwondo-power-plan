## Hvad forældre kan se i dag (`/parent-dashboard`)

Kilde: `src/pages/ParentDashboard.tsx`. Forældre kobles til atleter via `parent_athletes` (oprettes gennem `parent_invites` + edge function `parent-signup`). En forælder kan være linket til flere børn — hvert barn får sit eget kort med:

1. **Header-kort** — avatar, navn, bæltegrad, klub, land, "Forælder"-badge.
2. **Træningsplan** — navn på aktiv plan, ugeskema (dag + type), knap "Se hele planen" (åbner `PlanViewDialog` med fuldt plan-indhold).
3. **Stævner** — sidste 5 (kommende + resultater): navn, dato, sted, resultat.
4. **Fremmøde** — sidste 10 træningsdage (✓/✗) + fremmødeprocent baseret på op til 200 workout-logs.
5. **Kosttilskud & medicin** — foldbar `SupplementChecker` (aldersvenligt sprog).
6. **Sæsonkalender** — hvis klubben har en aktiv sæsonplan: mini-visning med faser og ugeskabelon.
7. **Kontoindstillinger** — eget navn + telefonnummer (kun sig selv, ikke barnet).
8. Sprogvælger + log ud i toppen. Footer: "kun læseadgang"-note.

**Ikke synligt for forældre:** dagbog, mental assessments, chat/beskeder, readiness, ernæringslogs, vægt, testresultater, video, rehab, coach-noter.

**Adgang styret af RLS:** `parent_athletes` linket → forælder kan læse barnets `profiles`, `training_plans`, `competitions`, `workout_logs`, klubbens sæsonplan.

---

## Foreslået test

Jeg opretter en rigtig forælder-konto koblet til en Sportstalent Demo-atlet og logger ind via Playwright, så vi ser præcis hvad de ser.

### Trin

1. **Find en demo-atlet** — SELECT en atlet i klubben "Sportstalent Demo" fra `profiles` (helst en med aktiv plan, stævner og workout_logs, så alle sektioner har indhold).
2. **Opret forælder-invite** — INSERT en række i `parent_invites` (kode, athlete_id, expires_at = nu + 7 dage) via service role.
3. **Kør `parent-signup` edge function** med invite-koden, testemail (fx `test-parent+demo@sportstalent.dk`) og et testpassword. Det opretter auth-bruger, profil (`is_parent=true`), markerer invite brugt, og linker `parent_athletes`.
4. **Playwright** — log ind som forælderen på `/auth` → naviger til `/parent-dashboard` → screenshot hver sektion (header, plan, plan-dialog åbnet, stævner, fremmøde, kosttilskud åbnet, sæsonkalender).
5. **Rapport** — screenshots + observationer (tomme sektioner, sprogfejl, layout-issues på 882px viewport). Rører ikke kode.
6. **Oprydning** — slet testforælder + invite + parent_athletes-link bagefter, så demoklubben er ren.

### Alternativ (uden ny bruger)

Hvis du hellere vil undgå at oprette en testbruger: jeg kan i stedet lave en ren "gennemgang" — læse RLS-policies + koden og lave en checklist over hvad hver sektion viser + edge cases (barn uden plan, uden stævner osv.), uden Playwright og uden DB-writes.

---

Vil du have **fuld test med rigtig login (trin 1–6)**, eller **kode/RLS-gennemgang uden bruger-oprettelse**?