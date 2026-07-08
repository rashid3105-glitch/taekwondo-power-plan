# Fælles topmenu + fix af sprogvælger

## Hvad brugeren oplever

1. Sprogvælgeren "hopper tilbage" når man klikker på et menupunkt (Platform, Funktioner, Priser, Om os, Blog).
2. Forsiden (`/`) har en anden topmenu end undersiderne — så headeren ser forskellig ud fra side til side.

## Årsag til "sprog-reset"

Sproget bliver faktisk ikke nulstillet. Flagvælgeren viser stadig det valgte sprog, og valget gemmes korrekt. Problemet er at **menu-labels og "Log ind"-knappen i den fælles topbar (`LandingLayout`) er hardcodet på dansk** ("Platform", "Funktioner", "Priser", "Om os", "Blog", "Log ind"). Når man skifter til engelsk og klikker rundt, forbliver menuen på dansk — og det opleves som om sproget "hopper tilbage".

Derudover bruger forsiden (`Index.tsx`) en helt egen header (uden menulinks), så udseendet skifter når man navigerer mellem `/` og fx `/about`.

## Løsning

### 1. Én fælles topbar på alle homepage-sider

- Forsiden `src/pages/Index.tsx` skiftes til at bruge `LandingLayout` — dens nuværende private `<header>` (linje ~196-210) fjernes, og resten af siden wrappes i `<LandingLayout>`.
- Alle offentlige sider bruger nu samme `LandingLayout`: `Index`, `About`, `Funktioner`, `Priser`, `PlatformMarketing`, `Blog`, `BlogPost`, `BlogCommentConfirm`, `Terms`, `PrivacyPolicy` (de sidste 8 gør det allerede).

### 2. Aktiv side markeres med gul ramme

I `LandingLayout` opdateres nav-links så det aktive punkt får en **gul kant** (`border: 1px solid #F5C842`, let padding, afrundede hjørner) i stedet for kun gul tekst. Ikke-aktive links beholder deres nuværende stil.

`/` tilføjes som første nav-link ("Hjem" / "Home") så forsiden også kan markeres aktiv.

### 3. Fix sprog-"reset" — oversæt topbaren

Nav-labels og "Log ind" i `LandingLayout` bindes til `useLanguage().t()` i stedet for hardcoded dansk. Nye i18n-nøgler tilføjes til **alle 7 sprog** i `src/i18n/translations.ts`:

- `navHome` — Hjem / Home / Hem / Startseite / الرئيسية / Hjem / Inicio
- `navPlatform` — Platform / Platform / Plattform / Plattform / المنصة / Plattform / Plataforma
- `navFeatures` — Funktioner / Features / Funktioner / Funktionen / الميزات / Funksjoner / Funciones
- `navPricing` — Priser / Pricing / Priser / Preise / الأسعار / Priser / Precios
- `navAbout` — Om os / About / Om oss / Über uns / معلومات عنا / Om oss / Sobre nosotros
- `navBlog` — Blog / Blog / Blogg / Blog / المدونة / Blogg / Blog

"Log ind" bruger allerede eksisterende `signIn`-nøgle.

Footer-links (`Privatlivspolitik`, `Vilkår`, `Kontakt`, `Blog`) oversættes tilsvarende — de har allerede eksisterende nøgler (`footerPrivacy`, `footerTerms`, osv.) eller får nye.

## Tekniske detaljer

- `LandingLayout.tsx`: flyt `NAV_LINKS` ind i komponenten så `t()` kan bruges; erstat aktiv-stil med gul border; tilføj `/` til listen.
- `Index.tsx`: fjern egen `<header>` (linje 196-210) og "PROMO"-bar (linje ~180-195) hvis den ligger i header — verificér før fjernelse; wrap return-JSX i `<LandingLayout>`; behold PageMeta og alt sideindhold uændret.
- `translations.ts`: tilføj 6 nye nøgler × 7 sprog.
- Ingen ændringer i `LanguageContext` — den fungerer korrekt; det var kun labels der ikke oversatte.

## Ude for scope

- Ingen ændringer i dashboard-header (kun offentlige sider).
- Ingen designoverhaling af hero, priser eller sektioner på forsiden — kun topbar udskiftes.
