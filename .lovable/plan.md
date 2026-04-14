

## Plan: Dark-to-Light Hybrid Theme

### Concept
Keep the dramatic dark hero section at the top of pages, then transition to a light background for content sections. This creates visual depth and a premium feel while improving readability.

### Scope
This affects **public-facing pages only** (landing, methodology, features, pricing, auth, help). The **Dashboard** and other authenticated pages stay dark — athletes/coaches expect a dark "cockpit" UI.

### Changes

#### 1. CSS Variables — Add Light Mode Tokens (`src/index.css`)
Add a new set of CSS variables for the "light content" sections:
```
--light-bg: 0 0% 98%;
--light-card: 0 0% 100%;
--light-card-foreground: 220 20% 15%;
--light-border: 220 10% 90%;
--light-muted: 220 10% 95%;
--light-muted-foreground: 220 10% 40%;
```

Add a utility class `.theme-light-section` that applies these as local overrides, so cards/text inside it automatically use the light palette.

#### 2. Landing Page (`src/pages/Index.tsx`)
- Hero section stays dark (current styling)
- Add a gradient transition div after the hero: dark → light (using the hybrid pattern you chose)
- Social proof bar, value props, week plan preview, case study, features, FAQ, and CTA sections get wrapped in the light theme class
- CTA section at bottom transitions back to dark for contrast
- Footer stays dark

#### 3. Methodology Page (`src/pages/Methodology.tsx`)
- Hero/header stays dark
- Content sections transition to light background

#### 4. Feature Detail Pages (`src/pages/FeatureDetail.tsx`)
- Hero with gradient stays dark
- Benefits list and long description sections use light background

#### 5. Pricing Page (`src/pages/Pricing.tsx`)
- Header stays dark
- Pricing cards use light background with subtle shadows

#### 6. Auth Page (`src/pages/Auth.tsx`)
- Left panel/hero stays dark
- Form area uses light background for better form readability

#### 7. Help Page (`src/pages/Help.tsx`)
- Header stays dark
- FAQ/collapsible content uses light background

#### 8. Footer (`src/components/AppFooter.tsx`)
- Stays dark for visual grounding

#### 9. Component Adjustments
- Cards in light sections: white background, subtle border, light shadow
- Text colors: dark text (slate-900/slate-600) in light sections
- Badges/pills: adapted border and background colors
- Buttons: primary gradient stays the same (works on both backgrounds)

### Technical Approach
- Use a CSS class-based approach (`.light-section`) rather than changing global CSS variables, so dark sections (Dashboard, authenticated pages) are unaffected
- The transition gradient is a simple `div` with `bg-gradient-to-b from-background to-white` placed between hero and content
- Tailwind's `dark:` prefix is not used — we control themes via explicit section classes

### Files Modified
- `src/index.css` — light section utility classes
- `src/pages/Index.tsx` — hero dark, content light
- `src/pages/Methodology.tsx` — same pattern
- `src/pages/FeatureDetail.tsx` — same pattern
- `src/pages/Pricing.tsx` — same pattern
- `src/pages/Auth.tsx` — form area light
- `src/pages/Help.tsx` — content light
- `src/components/AppFooter.tsx` — minor border color adjustment
- `src/components/landing/CaseStudy.tsx` — adapt card colors for light bg
- `src/components/landing/FeatureGrid.tsx` — adapt for light bg
- `src/components/landing/FAQSection.tsx` — adapt for light bg
- `src/components/landing/WeekPlanPreview.tsx` — adapt for light bg

### What Stays Dark
- Dashboard (athlete/coach)
- All authenticated app pages
- Diary, Library, Admin pages
- Hero sections on public pages
- Footer

