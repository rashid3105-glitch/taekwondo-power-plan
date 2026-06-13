## Goal

Add a new "Data Hosting & Residency" section to the Privacy Policy page so users (and clubs evaluating GDPR compliance) can see where their data lives and what safeguards are in place — while we wait for Lovable Support's reply on the exact region.

## Changes

### 1. `src/pages/PrivacyPolicy.tsx`
Insert a new `<section>` between **Data Sharing** and **Retention** using two new translation keys:
- `privacyHosting` (heading)
- `privacyHostingDesc` (body)

### 2. `src/i18n/translations.ts`
Add the two keys for all 7 locales (da, en, sv, de, ar, no, fa).

Proposed copy (EN, others translated equivalently):

> **Data Hosting & Residency**
> Sportstalent runs on Lovable Cloud, which is built on Supabase (PostgreSQL, Auth, Storage) and managed by Lovable AB (Sweden). All personal data is processed within the EU/EEA where possible. Some sub-processors (e.g. Lovable AI Gateway via Google Gemini, Stripe for payments, transactional email) may process limited data outside the EU under EU Standard Contractual Clauses (SCCs). Contact us at rashid3105@gmail.com to request our current list of sub-processors or a Data Processing Agreement (DPA).

Danish (primary) copy:

> **Dataplacering og hosting**
> Sportstalent kører på Lovable Cloud, som er bygget på Supabase (PostgreSQL, Auth, Storage) og drives af Lovable AB (Sverige). Personoplysninger behandles så vidt muligt inden for EU/EØS. Enkelte underdatabehandlere (fx Lovable AI Gateway via Google Gemini, Stripe til betalinger, transaktionelle e-mails) kan behandle begrænsede data uden for EU under EU-standardkontraktbestemmelser (SCC'er). Kontakt os på rashid3105@gmail.com for at få vores aktuelle liste over underdatabehandlere eller en databehandleraftale (DPA).

### 3. Bump the `privacyLastUpdated` date to today (2026-06-13).

## Out of scope

- No backend, RLS, or schema changes.
- No actual region migration — that requires Lovable Support's response first.
- No changes to Help.tsx changelog (minor copy change).

Approve to implement.