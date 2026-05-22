# Fix language override behavior

## What's happening

In your screenshot the switcher actually shows **🇩🇰 Dansk**, not English. That's because `LanguageContext` currently *re-applies* `profiles.default_locale` on every fresh session, overwriting whatever you picked in the switcher last time. So if your profile `default_locale = "da"`, every reload snaps you back to Danish even after you switched to English.

UI labels themselves (`Programperiodisering`, `VOLUMEN`, `Aktiver påmindelser`, …) are correctly translated in all 7 locale blocks — they just render in Danish because the active locale got reset to `da`.

## Change

**Rule going forward:** the user's last switcher selection wins. `default_locale` is only a seed for users who never touched the switcher. English is the final fallback.

### `src/i18n/LanguageContext.tsx`
- On mount, read `localStorage["tkd-lang"]`. If present and valid → use it; never override.
- Only when `localStorage["tkd-lang"]` is absent, fetch `profiles.default_locale` and apply it (and persist it to localStorage so it stays sticky from then on).
- If neither exists → `"en"`.
- Remove the `appliedForSessionRef` re-apply-on-every-session logic; replace with one-shot seeding.
- Keep `SIGNED_OUT` behavior: clear the "seeded" flag so a different user signing in on the same browser gets their own default_locale seeded once.

### `.lovable/memory/features/default-language.md`
Update to reflect: switcher selection is authoritative; `default_locale` only seeds first-ever load; fallback English.

## Out of scope (call out to user)

AI-generated plan content visible in the screenshot — phase titles like *"Anatomisk Tilpasning & Ledstabilitet"*, descriptions, and the plan name *"Eksplosiv Veteran…"* — are stored in the database in whatever language the plan was generated in. Switching the UI to English will **not** retranslate existing saved plans; the user would need to regenerate the plan in English. Strings like `Generated`, `Logging for`, `Active`, `PDF` etc. are already English from i18n and will display correctly once the locale fix lands.

No other files need changes; all UI keys shown in the screenshot already exist in the `en` block (verified: `periodizationTitle`, `periodizationSubtitle`, `enableReminders`, `addToCalendar`, `keyChanges`, plus `volumeLabel`/`intensityLabel`).
