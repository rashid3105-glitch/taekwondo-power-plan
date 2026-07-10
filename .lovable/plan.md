## Mål
På mobil (< 720px) skal den vandrette linkrække i toppen erstattes af et hamburger-ikon, der åbner en overlay-menu. Desktop-navigation forbliver uændret.

## Ændringer i `src/components/landing/LandingLayout.tsx`

1. **Row 2 (linkrækken) skjules på mobil.** Den vises kun når `!isMobile`.
2. **Nyt hamburger-ikon** placeres i Row 1 til venstre for LanguageSwitcher (kun synligt når `isMobile`). Bruger `Menu`/`X` fra `lucide-react`, 40×40 tap-target, transparent baggrund, guldfarvet stroke ved aktiv.
3. **Ny state `menuOpen`** styrer overlay.
4. **Overlay-menu**:
   - Fast position under navbaren (`top: 48px`), fylder viewporten (`left/right: 0`, `height: calc(100vh - 48px)`).
   - Mørk baggrund (`#0B0C14`) med subtil gradient, `backdrop-filter: blur(8px)`.
   - Links stakket lodret, centreret, `fontSize: 20`, `fontWeight: 600`, `padding: 16px`, aktivt link i guld med venstre-border.
   - "Log ind"-knap gentages nederst i overlay som stor primær CTA (guld, fuld bredde minus 32px margin).
   - Luk ved: klik på link (efter navigate), klik på X-ikon, `Escape`-tast.
5. **Body scroll lock** når menuen er åben (`document.body.style.overflow`), ryddes op i `useEffect` cleanup.
6. **Navbar-højde**: Row 1 forbliver 48px på mobil; da Row 2 fjernes, får hero mere plads over folden — løser samtidig "toppen tager ud over siden".

## Tekniske noter
- Ingen ændringer i translations, routes eller andre sider.
- Bruger inline styles (matcher eksisterende stil i filen).
- `useLocation` bruges allerede til aktiv-tilstand — genbruges i overlay.
- Ingen ny dependency (`lucide-react` er allerede i projektet).

## Ikke omfattet
- Desktop-nav, footer, sprogvælger og "Log ind"-knap i navbaren ændres ikke visuelt ud over tilføjelsen af hamburger-ikonet.
