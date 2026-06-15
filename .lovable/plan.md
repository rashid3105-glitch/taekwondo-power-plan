# Plan: Oprydning + multi-sprog blog (DA/EN)

Tre forarbejder først, så blog. Alt udføres på public/landing-sider — ingen ændringer i atlet/coach dashboards.

## Del 1 — Oprydning (hurtige rettelser)

### 1a. Fjern flydende AI-assistant
- `src/App.tsx`: fjern `AIAssistant`-import, `shouldShowAIAssistant`-helper og render-linje. Komponentfilen lader vi ligge (kan slettes senere hvis ønsket).

### 1b. Menulinks under logo på alle landing-sider
- `src/components/landing/LandingLayout.tsx`: omstrukturer top-nav til to rækker på mobil (samme mønster som tidligere `Index.tsx`):
  - Række 1: logo (venstre) + LanguageSwitcher + "Log ind"-knap (højre). Fjerner "Prøv gratis" fra nav (kun "Log ind" beholdes, jf. tidligere beslutning).
  - Række 2: nav-links (Platform · Funktioner · Priser · Om os) centreret, mindre font (12–13px), let dæmpet, tynd top-border.
- På desktop (>= 768px) kan vi beholde alt på én række eller bruge samme to-rækkers struktur for konsistens — jeg vælger to-rækkers på alle bredder så det matcher forsiden.

### 1c. Funktioner-siden — foldede kort
- `src/pages/Funktioner.tsx`: erstat den nuværende 2-kolonne grid med en liste af foldede kort (accordion) med shadcn `Collapsible`.
- Hvert kort viser kollapset: ikon, titel, tag (Coach/Atlet), kort 1-linjes teaser, chevron-ikon.
- Klik udfolder kortet og viser fuld beskrivelse + "Indeholder"-liste (alle 10 moduler har allerede `desc` + `features` array — genbruges direkte).
- Tilføj kort teaser-felt `short` til hvert modul-objekt (1 linje, ~60-80 tegn).
- Layout bliver én kolonne fuld-bredde (max 720px) — fjerner overflow-problemet helt.

## Del 2 — Multi-sprog blog (DA/EN)

### Database (1 migration)
- Tabel `blog_posts`:
  - `slug` (unik per locale via composite key `(locale, slug)`)
  - `locale` ("da" | "en")
  - `title`, `excerpt`, `content_html` (sanitiseret rich text)
  - `cover_image_url`
  - `status` ("draft" | "published")
  - `published_at`, `expires_at` (nullable — skjules når udløbet)
  - `author_id` (FK → auth.users)
  - `translation_group_id` (uuid — binder DA+EN versioner sammen så `/blog/:slug` kan vise sprogvælger)
- RLS:
  - Public SELECT: kun rækker hvor `status='published'` AND `published_at <= now()` AND (`expires_at` IS NULL OR `expires_at > now()`)
  - Admin (via `is_admin()`-RPC): fuld CRUD
- GRANT SELECT til `anon` + `authenticated`; INSERT/UPDATE/DELETE kun til `authenticated` (RLS gatekeeper på admin)
- Storage bucket `blog-images` (public) til cover-billeder

### Admin editor (under admin-menu)
- Nye routes:
  - `/admin/blog` — liste med status, sprog, udløbsdato, rediger/slet
  - `/admin/blog/new` og `/admin/blog/:id/edit` — formular
- Editor-form felter: sprog-toggle (DA/EN), titel, slug (auto-genereret fra titel), excerpt, cover-billede (drag-drop til Storage), rich-text editor (TipTap m. bold/italic/headings/lists/links/images), publiceret-dato, udløbsdato, status-toggle (draft/published)
- HTML sanitiseres med DOMPurify før gem
- "Oversæt"-handling: dupliker post til andet sprog (samme `translation_group_id`)
- Tilføj link i admin-menuen til `/admin/blog`

### Offentlig blog
- `src/pages/Blog.tsx`: erstat "Kommer snart" — vis aktive posts i nuværende sprog (`useLanguage().language`), grid med cover + titel + excerpt + dato
- Ny route `/blog/:slug` — detalje med SEO meta + JSON-LD Article + hreflang til evt. oversat version + sprogvælger hvis begge versioner findes
- Tom-state hvis ingen posts på valgt sprog: "No posts in English yet — view Danish posts"

### i18n
- Nye nøgler i `src/i18n/translations.ts` for alle 7 sprog (UI-strings: "Read more", "Published", "By", "No posts yet", admin-labels osv.). Blog-indhold selv kun DA/EN.

### TipTap dependencies
- `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-image`, `dompurify`, `@types/dompurify`

## Rækkefølge
1. Del 1a + 1b + 1c (én pass — UI only)
2. Database migration + storage bucket (kræver din godkendelse)
3. Admin editor + offentlig blog + i18n
4. Help.tsx + changelog opdatering

## Ikke inkluderet
Kommentarer, kategorier/tags, RSS, scheduled publishing (kun "publicer nu" + udløb), AI-assisteret skrivning. Kan tilføjes senere.
