
The user is on Danish locale but ReadinessCard shows English. Looking at the code I have, ReadinessCard.tsx uses hardcoded English strings ("Morning readiness check", "How do you feel today?", "Sleep last night", etc.) — no `useLanguage()` / `t()` calls.

Same likely applies to NotificationSettings, Competitions page, and CompetitionPlanDialog (all created in the same big push — I never added i18n).

Plan: thread `t()` through all four new surfaces and add the keys to `src/i18n/translations.ts` for all 6 locales (DA, EN, SV, DE, AR, NO).
