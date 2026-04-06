

## Plan: Fix translation errors and add German language

### Translation errors found

1. **Missing `paid` key in DA and SV** — The English locale has `paid: "Paid"` (line 370), but both Danish and Swedish are missing this key. DA should have `paid: "Betalt"`, SV should have `paid: "Betald"`.

2. **Pervasive `as any` casts on translation keys** — Over 1,100 instances across 29 files use `t("key" as any)` instead of typed keys. This is a type-safety issue but not a runtime translation error. Many of these keys do exist in all three locales. This is a code-quality issue, not a missing-translation issue, and fixing all 29 files would be a large refactor best handled separately.

3. **No actual wrong/broken translations detected** — All three locales (EN/DA/SV) have 760+ keys each, and content is consistent across languages. The only missing keys are `paid` (in DA/SV).

### Adding German (de) locale

This requires changes to 3 files:

**1. `src/i18n/translations.ts`**
- Update `Locale` type: `"en" | "da" | "sv" | "de"`
- Add missing `paid` key to DA and SV blocks
- Add complete `de: { ... }` block with all ~760 keys translated to German

**2. `src/i18n/LanguageContext.tsx`**
- Add `"de"` to the saved locale check on line 13: `saved === "de"`

**3. `src/components/LanguageSwitcher.tsx`**
- Add German flag entry: `de: { emoji: "🇩🇪", label: "Deutsch" }`

### Technical details

- The `de` block will be a full translation of all 761 English keys into German
- The translations.ts file will grow by roughly 800 lines (from ~2441 to ~3241)
- All edge functions that generate AI content already read the user's locale, so German plans will work automatically once the locale is available
- The `as any` casts throughout the codebase are not addressed in this plan — they are a separate code-quality refactor

