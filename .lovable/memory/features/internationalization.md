---
name: Internationalization
description: 7 languages - DA, EN, SV, DE, AR (RTL), NO (Bokmål), FA (RTL, infra-only with English UI fallback + Farsi AI plans)
type: feature
---
The platform supports seven languages: Danish, English, Swedish, German, Arabic (RTL), Norwegian (Bokmål), and Persian/Farsi (RTL).
- Arabic and Farsi both trigger RTL via `RTL_LOCALES` in `src/i18n/LanguageContext.tsx`.
- Farsi UI strings fall back to English (set via `(translations as any).fa = translations.en` at the bottom of `src/i18n/translations.ts`). Translate progressively by adding a real `fa: { ... }` block.
- AI plan generators (training, nutrition, mental, rehab, competition reflection, weekly summary, match report) all emit Farsi when `language === "fa"`.
- Norwegian was derived from Danish with systematic Bokmål adjustments.
