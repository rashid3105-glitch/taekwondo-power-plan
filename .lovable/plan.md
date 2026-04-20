
The user wants implementation details for all three ideas. I'll keep each section concise — what to build, key technical pieces, DB changes, and effort estimate. No code, just architecture.

Key project facts to leverage:
- Already a PWA (manifest.json, /install page exists)
- Supabase backend with edge functions, RLS, pg_cron capability
- Already have: training_plans, diary_entries, profiles, workout_logs, nutrition_plans
- Already have email infrastructure (notify.sportstalent.dk) and `event_reminders` table
- Lovable AI Gateway (Gemini) for plan generation
- 5 languages incl. RTL Arabic

I'll structure: each feature gets Scope / Data / Backend / UI / Effort.
