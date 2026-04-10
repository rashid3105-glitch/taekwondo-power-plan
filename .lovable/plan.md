

## Plan: Flere træningspas per dag

### Hvad ændres
I dag har hver dag i ugeplanen én type (TKD, Gym eller Rest) med én liste øvelser. Vi ændrer strukturen så hver dag kan have flere **sessions** — f.eks. "Styrke (morgen)" og "TKD (aften)" på samme dag.

### Datastruktur

Nuværende format per dag:
```json
{ "dayOfWeek": "Monday", "type": "gym", "label": "Power", "focus": "...", "exercises": [...] }
```

Nyt format per dag:
```json
{
  "dayOfWeek": "Monday",
  "sessions": [
    { "type": "gym", "label": "Styrke (morgen)", "focus": "...", "exercises": [...] },
    { "type": "tkd", "label": "TKD (aften)", "focus": "...", "exercises": [] }
  ]
}
```

Bagudkompatibilitet: Hvis `sessions` ikke findes, wrappe den eksisterende dag i en enkelt session automatisk — så alle eksisterende planer fortsat virker uden migration.

### Filer der ændres

1. **`src/components/WeekSchedulePicker.tsx`** — Udvid så man kan tilføje flere sessionstyper per dag (f.eks. klik "+" for at tilføje en ekstra session, klik "×" for at fjerne). Vis sessions som stablede badges per dag.

2. **`src/components/AIPlanCard.tsx`** — Tilpas dagvisningen til at vise sessions som tabs eller collapsible sektioner inden for en valgt dag. Øvelseshåndtering (add/swap/remove/reorder/logs) scopes til den aktive session. PDF-eksport opdateres til at håndtere flere sessions per dag.

3. **`supabase/functions/generate-plan/index.ts`** — Opdater AI-prompten til at generere det nye `sessions`-format, så planer med flere daglige pas bliver skabt korrekt.

4. **`src/hooks/useWorkoutLogs.ts`** — Tilføj `session_index` parameter så logs kan skelne mellem morgen- og aftensession på samme dag.

5. **`src/components/PlanViewDialog.tsx`** og **`src/pages/AdminApproval.tsx`** — Opdater PDF-generering og planvisning til at håndtere sessions-strukturen.

6. **`src/components/ProgressDashboard.tsx`** — Tilpas progress-beregninger til at tælle øvelser på tværs af sessions.

7. **`src/components/CalendarDropdown.tsx`** og **`src/lib/calendarExport.ts`** — Generer separate kalenderbegivenheder per session (morgen vs. aften med forskellige tidspunkter).

8. **`src/i18n/translations.ts`** — Tilføj keys: "addSession", "removeSession", "morning", "evening", "session" osv.

9. **Database migration** — Tilføj `session_index` kolonne til `workout_logs` tabellen (default 0) for at understøtte logging af flere sessions per dag.

### Kompatibilitetslag

En hjælpefunktion `normalizeDaySessions(day)` bruges overalt:
```typescript
function normalizeDaySessions(day: any) {
  if (day.sessions) return day.sessions;
  return [{ type: day.type, label: day.label, focus: day.focus, exercises: day.exercises || [] }];
}
```

Dette sikrer at eksisterende gemte planer fortsat virker uden at kræve datamigration.

