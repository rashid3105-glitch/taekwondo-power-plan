

## Plan: Add Top-Level Navigation & New Pages

### Overview
Restructure the public site navigation based on the proposed sitemap, adding a persistent top nav bar and 3 new page groups.

### New Pages

**1. About (`/about`)**
- Hero with mission statement
- Sub-sections: "Vores Team" and "Mission & Vision"
- Can be a single page with anchor sections or two sub-routes (`/about/team`, `/about/mission`)
- Recommend: single page with smooth scroll sections for simplicity

**2. Training Programs (`/programs`)**
- Public-facing page showcasing available training program types
- Shows 2-3 sample program cards (e.g., "Competition Prep", "General S&C")
- Each card links to a detail view with sample week preview
- CTA to sign up / log in to access full programs
- No auth required to browse

**3. Contact (`/contact`)**
- Contact form (name, email, message)
- Backend function to send the email via the email infrastructure already in place
- Success confirmation after submission
- Database table to store contact submissions

### Navigation Changes

**Header Nav Bar (public pages)**
- Replace the minimal header with a proper navigation bar
- Links: Om Sportstalent | Træningsprogrammer | Priser | Kontakt | [Language] | Log ind
- Mobile: hamburger menu with the same links
- Sticky header with backdrop blur (consistent with current style)
- Reusable `PublicNav` component used across all public pages

**Auth section**
- "Login/Profil" maps to existing `/auth` route — just needs a prominent nav link
- "Opret profil" is the signup tab on the auth page — no new page needed

### Files to Create
- `src/components/PublicNav.tsx` — shared navigation component
- `src/pages/About.tsx` — about page with team + mission sections
- `src/pages/Programs.tsx` — public training programs showcase
- `src/pages/Contact.tsx` — contact form page

### Files to Modify
- `src/App.tsx` — add 3 new routes
- `src/pages/Index.tsx` — use `PublicNav` instead of inline header
- `src/pages/Methodology.tsx` — use `PublicNav`
- `src/pages/Pricing.tsx` — use `PublicNav`
- `src/pages/Help.tsx` — use `PublicNav`
- `src/pages/FeatureDetail.tsx` — use `PublicNav`
- `src/pages/Auth.tsx` — use `PublicNav`
- `src/i18n/translations.ts` — add translations for new nav items and page content

### Database
- New `contact_submissions` table (id, name, email, message, created_at) with open INSERT RLS policy (no auth needed to submit)
- Edge function or existing email infra to notify admin of new submissions

### Design
- All new pages follow the dark-to-light hybrid pattern
- Nav bar: dark background matching the hero, with light text
- Mobile: slide-out or dropdown menu

