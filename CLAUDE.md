# Sportstalent.dk — Claude Instructions

## Project
- Lovable project ID: a65f5c86-1a84-4640-b139-4767189347ea
- Stack: React + TypeScript + Tailwind + shadcn/ui + Supabase
- Languages: en, da, sv, de, ar, no, es (7 total)

## Rules — always follow
- Read files BEFORE modifying them
- Never hardcode English text — always use t() from useLanguage()
- Add translations for ALL 7 languages when adding new keys
- Update Help.tsx + changelog at major changes
- Use getUser(token) in edge functions — never getUser() without token argument
- Test logic thoroughly before sending to Lovable — minimize credit usage

## Architecture

### Users
- Athletes: /dashboard with activeTab system (hub, plan, calendar, diary, mental, rehab, progress, nutrition, testing)
- Coaches: /coach route, isCoach boolean in Dashboard, separate bottom nav
- Parents: is_parent boolean, /parent-dashboard, read-only access
- Platform admin: is_admin() RPC

### Bottom nav
- Athletes: I dag (hub) · Træn (plan) · Kalender (calendar) · Dagbog (/diary) · Chat
- Coaches: Hold (/coach) · Træning (/coach/season-calendar) · Stævner (/coach/competitions) · Beskeder (chat) · Mig (switch to athlete)
- Profile: accessible via header avatar click → /profile-setup

### Key files
- Dashboard: src/pages/Dashboard.tsx
- Chat: src/components/chat/ + src/lib/chatApi.ts
- Translations: src/i18n/translations.ts (Locale type: "en"|"da"|"sv"|"de"|"ar"|"no"|"es")
  - Farsi (fa) was removed — do NOT add it back
  - RTL languages: ar only
- Season calendar coach: src/pages/SeasonCalendar.tsx
- Season calendar athlete: src/components/hub/SeasonCalendarView.tsx
- Season lib: src/lib/seasonCalendar.ts
- Help + changelog: src/pages/Help.tsx
- Push notifications: src/lib/pushNotifications.ts + supabase/functions/send-push/
- Coach notifications: supabase/functions/notify-coaches-athlete-activity/

### Database patterns
- All tables have RLS enabled
- club_id is the primary isolation key between clubs
- coach_athletes table links coaches to athletes (not a column on profiles)
- parent_athletes table links parents to athletes
- Techniques: club_techniques → club_week_technique_focus → athlete_week_technique_focus

### Edge functions
- Auth pattern: const token = authHeader.replace("Bearer ", ""); const { data: { user } } = await supabase.auth.getUser(token);
- Email: use enqueue_email RPC or email_queue table — never call Resend directly
- Push: invoke send-push function with { user_ids, title, body, url, tag }

### Chat
- Threads: chat_threads (kind: "direct" | "group")
- Members: chat_thread_members (has last_read_at)
- Messages: chat_messages (has deleted_at for soft delete)
- Reactions: chat_reactions
- Parents shown as "Name (P)" in contact lists

## Season calendar
- Plans: club_season_plans → phases (club_season_phases) → day templates (club_season_day_templates)
- Technique focus: club_week_technique_focus (team) + athlete_week_technique_focus (individual)
- Visibility: opt-out — all club members see plan unless visibility rows exist, then only listed athletes

## Module access
- Club defaults: club_module_defaults
- Athlete overrides: athlete_module_overrides
- Hook: useAthleteModuleAccess() → isModuleEnabled(module)
- Modules: hub, plan, progress, mental, nutrition, testing, video, rehab, diary

## Known issues / watch-outs
- iOS safe area: use pt-safe / pb-safe CSS classes, style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
- SheetContent: use hideClose prop and add own close button for full safe-area control
- Poomsae category in technique library only shown for poomsae discipline profiles
- Mental assessment: monthly reminder via pg_cron (1st of month) + reminder card in hub tab if >30 days since last assessment

## React Native migration
- Planned start: ~July 2026
- Migration plan: /mnt/user-data/outputs/sportstalent-rn-migration-plan.md
- ~60-70% of business logic (hooks, Supabase queries, edge functions, translations) can be reused directly
