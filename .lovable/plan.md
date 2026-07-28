MÅL
Skifte Sportstalents offentlige profil fra kampsport-specifik til bredere elite talent-udvikling for danske klubber — uden at miste eksisterende SEO-værdi eller sportsspecifikke use cases.

KERNEBUDSKAB (godkendt udgangspunkt)
"The Operating System for Elite Talent Development in Danish Clubs. Built by a 40-year veteran coach. Secure, GDPR-compliant, and designed for clubs that demand results."

AFGRÆNSNING (fra afklarende spørgsmål)
- Scope: Kun offentlige marketing-sider (forside, om, platform, priser, trænerlandingsside, SEO-sider, llms.txt, manifest, sitemap).
- Visuel identitet: Eksisterende taekwondo-billeder beholdes på sportsspecifikke sider. Forside og hovedsider får bredere sportsmotiver/illustrationer.
- SEO-sider: Omdøbes fra taekwondo-specifikke til generelle sportssider, men beholdes som content/use-case sider.
- Prioritet: Forsiden (/) først.

STRUKTUREL TILGANG
````text
Offentlige sider opdeles i tre lag:

1. Brand-lag (bredt budskab)
   /                    → Forside: "Operating System..."
   /about               → Trust: 40-årig coach, GDPR, dansk klubfokus
   /platform            → Platform: ét system for hele klubben
   /for-traenere        → B2B: trænere og klubledelse
   /priser              → Klub-priser (per atlet, årlig)

2. Use-case lag (sportseksempler)
   /taekwondo-training-program    → omdøbes til generelt "træningsprogram"
   /poomsae                       → beholdes som eksempel, men linkes fra generelt perspektiv
   /taekwondo-teknik              → omdøbes til "tekniktræning"
   /staevneforberedelse-taekwondo → omdøbes til "staevneforberedelse"
   /fysisk-test-taekwondo         → omdøbes til "fysiske test"

3. Teknisk/SEO-lag
   index.html, manifest.json, robots.txt, sitemap.xml, llms.txt
````

KONKRETE ÆNDRINGER

1. Forside (src/pages/Index.tsx) — HØJESTE PRIORITET
   - Hero-badge: fra "SYSTEM V1.0 · ACTIVE / Taekwondo Sport Science" til "Operating System for Danish Elite Clubs" eller lignende.
   - Hero-titel: skift "Sport Science Training for Taekwondo" til "The Operating System for Elite Talent Development in Danish Clubs".
   - Subtitle: fremhæv "40-year veteran coach", "GDPR-compliant", "club-first".
   - Bullet points: behold strukturen, men skift indhold til klub-/talent-udvikling frem for TKD-specifikke pointer.
   - Trust line: tilføj "GDPR-compliant", "Danish-owned", "CVR 33685815".
   - Hero-billede: vurder nyt bredere sportsmotiv (f.eks. atletisk træning, hold, eller data-cockpit). Beholder TKD-billeder på sportsspecifikke sider.
   - Problem-sektion (Chapter 01): omformuler fra TKD-problemer til klub-problemer (admin, data, udvikling).

2. Oversættelser (src/i18n/translations.ts) — alle 7 sprog
   - Opdater følgende nøgler for alle locales (en, da, sv, de, ar, no, es):
     * homeHeroBadge, homeHeroTitle1, homeHeroTitle2Prefix, homeHeroTitle2Em
     * homeHeroSubtitle, homeHeroBullet1-3, homeTrust1-3
     * homeProblemEyebrow, homeProblemTitlePre, homeProblemTitleEm, homeProblemSub, homeProblem1T/D-3T/D
     * homeCh1Label, homeCh1Title
     * homeSeoTitle, homeSeoDesc
     * aboutSeoTitle, aboutSeoDesc, aboutH1a, aboutH1b, aboutIntro
     * aboutMissionA, aboutMissionB
     * aboutFounderRole, aboutFounderQuote, aboutFounderP2a, aboutFounderP2b
     * aboutTag1-4, aboutCtaTitle, aboutCtaSub
     * pmSeoDesc, pmH1a, pmH1b, pmSub, pmBadge, pmBenefitsTitle, pmBenefitsLabel
     * pmB1Title-6Title, pmB1Desc-6Desc
     * pmStepsLabel, pmStepsTitle, pmStep1Title-4Title, pmStep1Desc-4Desc
     * pmStat1-4, pmCtaTitle, pmCtaSub, pmCtaBtn
   - Sikr at ar (RTL) og øvrige sprog får konsistent tone og ikke engelsk fallback.

3. Om-siden (src/pages/About.tsx)
   - Hero: "Built by a 40-Year Veteran Coach" frem i front.
   - Founder-sektion: fremhæv 30+ års erfaring og bred sports-coaching, ikke kun taekwondo.
   - Mission: skriv om "Danish clubs", "elite talent development", "secure & GDPR-compliant".
   - Værdier: juster ikoner/tekster fra TKD-only til klub-/talent-udvikling.
   - CTA: behold to knapper, men teksten rettes.

4. Platform-siden (src/pages/PlatformMarketing.tsx)
   - H1: "Coaching that works. Data that proves it." → justeres til "One Operating System for Your Entire Club".
   - Subtitle: bredere klubfokus.
   - Benefits: 6 nye benefit-kort centreret omkring klubdrift, talentudvikling, data, kommunikation, planlægning, resultater.
   - Steps: justeres fra TKD-flow til klub-onboarding.
   - Stats: vurder om nuværende tal stadig er valide; ellers justeres eller fjernes.

5. Trænerlandingsside (src/pages/CoachLanding.tsx)
   - Hero-badge og -titel rettes til "For Coaches and Clubs" / "Built for Danish Clubs".
   - Hero-desc: fokus på klubdrift, ikke kun taekwondo.
   - Features: behold struktur, men teksterne bredes ud.
   - Trust line: tilføj GDPR/sikkerhed.
   - coachLandingStrings.ts opdateres for alle sprog.

6. Priser (src/pages/Priser.tsx)
   - Top-overskrift: "Klub-priser" / "Club pricing".
   - Intro-tekst: fremhæv at det er klub-only, per atlet, årlig betaling.
   - FAQ: juster svar, så de ikke lyder TKD-specifikke.

7. SEO- og tekniske filer
   - public/llms.txt: omskrives til bredere beskrivelse.
   - public/manifest.json: opdater name/short_name/description.
   - public/sitemap.xml: opdater eventuelle nye ruter og sidetitler.
   - index.html: sikr at baseline title/description ikke er "Lovable App".
   - Schema.org JSON-LD på forsiden: skift Organization-beskrivelse til det nye brandbudskab.

8. SEO-landingssider (src/pages/seo/)
   - Omdøb ruterne i App.tsx fra /taekwondo-* til /traeningsprogram, /tekniktraening, /staevneforberedelse, /fysiske-test.
   - Tilføj redirects fra gamle /taekwondo-* ruter til de nye, så eksisterende links ikke går 404.
   - Opdater sidetitler, H1 og meta-beskrivelser til generelle sportstermer.
   - Behold relevant TKD-indhold som eksempel i brødteksten, men ramme det som "brugt af taekwondo-klubber".

9. Navigation og shared komponenter
   - src/components/landing/LandingLayout.tsx: nav-links justeres hvis nødvendigt.
   - BrandLogo og AppFooter: tekstuelle elementer tjekkes, men forventes ikke ændret.

IMPLEMENTERINGSRAKKEFØLGE
1. Oversættelser (da + en først, derefter sv, de, no, es, ar).
2. Forside (Index.tsx) med nye tekster og evt. nyt hero-billede.
3. Om-siden (About.tsx).
4. Platform-siden (PlatformMarketing.tsx).
5. Trænerlandingsside (CoachLanding.tsx + coachLandingStrings.ts).
6. Priser (Priser.tsx).
7. SEO-landingssider + redirects.
8. llms.txt, manifest.json, sitemap.xml.
9. Gennemlæsning og test af alle 7 sprog + mobilvisning.

HVAD DER IKKE ÆNDRES
- App-interne flows (dashboard, auth, onboarding, feature-navne) — medmindre brugeren ønsker det senere.
- Faktisk funktionalitet: træningsplaner, tests, kost, dagbog, chat mv. forbliver urørt.
- Supabase-schema, RLS, edge functions.

VERIFICERING
- Build uden fejl.
- Visuel tjek af forsiden, om-siden, platform, priser og trænerlanding på både desktop og mobil.
- Tjek af alle 7 sprog for nye marketing-nøgler.
- Tjek at gamle /taekwondo-* URLer redirecter korrekt.
- SEO-scan efterfølgende (bruger kan køre Rescan i SEO-fanen).

ESTIMERET OMFANG
- Tekstomskrivning af ~80-100 oversættelsesnøgler × 7 sprog.
- 6-8 React-filer justeres.
- 4-5 SEO-sider omdøbes med redirects.
- Ingen backend-ændringer.