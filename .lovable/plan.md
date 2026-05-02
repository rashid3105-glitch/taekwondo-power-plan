## Goal

Replace the current `/` landing page with a new public landing page targeted at small Taekwondo clubs (navy + red, club-focused copy). Archive the existing landing at `/v1`. Add `/signup` and `/login` redirects. Localize everything via the existing i18n system. Add a waitlist table.

## Routing changes

- `/` → new `Landing.tsx` (the new club-focused page)
- `/v1` → existing `Index.tsx` (archived, unchanged)
- `/signup` → redirect to `/auth?tab=signup`
- `/login` → redirect to `/auth?tab=signin`
- `Auth.tsx` already supports tab switching; verify it reads the `tab` query param (small tweak if not).

## Page sections (single scrollable page)

1. **Sticky navbar** — transparent over hero, solid navy on scroll. Logo "Sportstalent.dk" left. Right: language switcher (reuse `LanguageSwitcher`), "Log ind" ghost → `/login`, "Kom i gang" red → `/signup`.
2. **Hero** — H1, subhead, two CTAs ("Opret gratis konto" red → `/signup`, "Få tidlig adgang" outline → scroll to `#waitlist`), small "Allerede medlem? Log ind her" link → `/login`.
3. **Pain points** — 3-column grid, lucide icons (`Clock`, `TrendingUp`, `BookOpen`).
4. **Features** — 2×2 card grid, icons (`MessageSquare`, `CalendarDays`, `BookOpen`, `Users`). Per project rule, label these as "Personlig assistent" / "Personalized" — never "AI".
5. **Credibility** — centered dark card, "Bygget af en tidligere landsholdstræner" copy.
6. **Waitlist** (`id="waitlist"`) — name / club / email form → inserts into new `waitlist` table → inline success toast. Below form: "Klar til at starte nu? → Opret konto" link.
7. **Footer** — copyright + Privatlivspolitik (`/privacy`) + Kontakt (`/contact`).

All sections use `motion` enter animations consistent with the existing landing.

## Design tokens

Add to `src/index.css` and `tailwind.config.ts` (HSL values):

- `--landing-navy: 217 68% 14%`        (#0B1F3A)
- `--landing-navy-elevated: 222 60% 18%` (#112347)
- `--landing-red: 353 100% 45%`         (#E8001D)
- `--landing-red-hover: 353 100% 40%`

Map Tailwind classes `bg-landing-navy`, `bg-landing-elevated`, `bg-landing-red`, `text-landing-red`, `border-landing-red`. Use these tokens throughout the new page — no raw hex in components.

## Internationalization

Add ~35 new keys to `src/i18n/translations.ts` for all 5 locales (DA, EN, SV, DE, AR), namespaced `landingClub*` (e.g. `landingClubHeroTitle`, `landingClubPain1Title`, `landingClubWaitlistSuccess`). Danish is the source of truth (uses the exact copy provided); EN/SV/DE/AR are faithful translations. RTL handled automatically by existing LanguageContext.

The "Sportstalent.dk" wordmark stays the same string in all languages (brand). Wordmark co-exists with existing "SPORTS TALENT" identity used inside the app — landing page is the public-facing club acquisition entry point.

## Waitlist database

New migration:

```sql
CREATE TABLE public.waitlist (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  club text not null,
  email text not null,
  locale text,
  created_at timestamptz not null default now()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Public can sign up
CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(name)  BETWEEN 1 AND 120 AND
    char_length(club)  BETWEEN 1 AND 120 AND
    char_length(email) BETWEEN 3 AND 254 AND
    email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );

-- Only admins can read
CREATE POLICY "Admins read waitlist"
  ON public.waitlist FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE INDEX waitlist_email_idx ON public.waitlist (email);
```

Client-side: zod validation on form (name 1–120, club 1–120, email valid + ≤254), `supabase.from('waitlist').insert(...)`, success → sonner toast + replace form with success message.

## Files

**New**
- `src/pages/Landing.tsx`
- `src/components/landing/club/LandingNav.tsx`
- `src/components/landing/club/LandingHero.tsx`
- `src/components/landing/club/PainPoints.tsx`
- `src/components/landing/club/FeatureCards.tsx`
- `src/components/landing/club/Credibility.tsx`
- `src/components/landing/club/WaitlistForm.tsx`
- `src/components/landing/club/LandingFooter.tsx`
- `supabase/migrations/<timestamp>_waitlist.sql`

**Edited**
- `src/App.tsx` — `/` → Landing, `/v1` → Index, add `/signup` and `/login` redirect routes.
- `src/pages/Auth.tsx` — read `?tab=signup|signin` and open the right tab.
- `src/index.css` — add landing color tokens.
- `src/tailwind.config.ts` — register the tokens as Tailwind colors.
- `src/i18n/translations.ts` — add `landingClub*` keys for DA / EN / SV / DE / AR.

**Untouched** — every other page, route, component, and the existing `Index.tsx` (just remounted at `/v1`).

## Out of scope / not changed

- Existing `Index.tsx` and all its sub-components stay as-is.
- No changes to existing brand identity inside the authenticated app.
- No email infrastructure changes; waitlist signup is DB-only for now (admin notification can be added later).
- No SEO sitemap edits beyond `<PageMeta>` on the new page (canonical `https://sportstalent.dk/`, hreflang for the 5 locales).

## Verification after build

- `/` renders the new page; `/v1` still renders the old one.
- `/signup` and `/login` land on the right Auth tab.
- Waitlist form: invalid email → inline error; valid submit → row appears in `waitlist` table; success message shown.
- Language switch in navbar updates all copy live (incl. RTL for Arabic).
- Mobile (402×636) layout: nav collapses cleanly, all CTAs ≥ 44px tap targets, no horizontal scroll.