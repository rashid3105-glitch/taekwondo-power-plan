# Klub-branding: logo-top + Sportstalent bund

Når en klub har branding-tilvalget slået til, skal klubbens logo stå øverst til venstre i den authenticated app, og SportsTalent-mærket flyttes ned i bunden til venstre som en diskret "powered by"-angivelse.

## 1. Top-left: klublogo uden SportsTalent-wordmark

`BrandLogo` udvides med en `mode`-prop:

- `mode="default"` (nuværende): klublogo + SportsTalent-wordmark, eller fallback til SportsTalent-mærket.
- `mode="club-only"`: viser kun klublogoet — intet SportsTalent-wordmark.

I `Dashboard.tsx` header og andre authenticated top-bars skiftes til `mode="club-only"`, når `branding.enabled` er sandt. Det frigør plads til klubbens eget visuelle udtryk øverst.

## 2. Bund: diskret SportsTalent-markering

En ny komponent `PoweredBySportstalent` placeres fast i bunden til venstre på authenticated sider. Den vises kun når klub-branding er aktiv.

```text
┌─────────────────────────────────────┐
│ [klublogo]        🔔  👤            │  ← top, venstre side
├─────────────────────────────────────┤
│                                     │
│              indhold                │
│                                     │
├─────────────────────────────────────┤
│ ⚡  📅  ❤️  🎥            🏃 Sports  │  ← bund, nav + mærke til højre/venstre
└─────────────────────────────────────┘
```

På mobil integreres mærket i venstre side af den eksisterende `AppBottomNav` som et lille ikon + "Sports" (eller kun løber-ikonet), så det ikke optager ekstra højde. På desktop/tablet vises en tynd footer-stribe under sidens indhold med løber-ikonet og "Powered by Sportstalent".

## 3. Hvor det vises — og hvor det ikke gør

- Vis kun på authenticated ruter (`/dashboard`, `/coach/*`, `/health`, `/diary`, `/messages`, `/library/*`, `/moduler`, `/hold/moduler`, `/profile*` m.fl.).
- Offentlige sider (`/`, `/for-traenere`, `/priser`, `/blog`, SEO-landingpages, `/auth`) beholdes uændret med SportsTalent-logo øverst til venstre og nuværende footer.
- Admin-sider (`/admin/*`) beholdes neutralt SportsTalent-brandede — klub-branding gælder ikke her.

## 4. Tekniske detaljer

- `BrandLogo.tsx`: tilføj `mode?: "default" | "club-only"`. I `club-only` vises kun `<img src={clubLogo} />` og fallback til runner-ikonet (hvis intet klublogo er uploadet).
- `PoweredBySportstalent.tsx`: lille fixed/inline komponent, der læser `useClubBranding()` og kun renderer når `enabled === true`.
- `AppBottomNav.tsx`: indsæt mærket i venstre side af nav-baren når `branding.enabled` og vi er på en authenticated rute. Brug `pb-safe` og sørg for, at det ikke overlapper iPhone home-indikator.
- `Dashboard.tsx` header: skift `BrandLogo` til `mode="club-only"` når branding er aktiv.
- Ingen database- eller storage-ændringer — genbruger eksisterende `ClubThemeProvider` og `club-logos` bucket.
- Tilføj evt. aria-label: "Powered by Sportstalent" / "Leveret af Sportstalent".

## 5. Oversættelser og changelog

- Tilføj nøglen `poweredBy` på dansk, engelsk, svensk, tysk, arabisk, norsk og spansk.
- Opdater `Help.tsx` changelog til **v1.5.24** med punktet om klub-branding i appens top/bund.

## 6. Mockup

```text
Authenticated dashboard (branding ON):

┌─ [Klublogo] ─────────────────────── 🔔 👤 ─┐
│                                            │
│   Hej, Rasmus                              │
│   I dag: Ben & core                        │
│                                            │
│   ┌─────────────┐  ┌─────────────┐         │
│   │  Min plan   │  │ Holdets plan│         │
│   └─────────────┘  └─────────────┘         │
│                                            │
├────────────────────────────────────────────┤
│ 🏠  ⚡  📅  ❤️  🎥   🏃 Sports               │  ← bundnav + mærke
└────────────────────────────────────────────┘
```

På desktop vises bundmærket som en tynd stribe under indholdet i stedet for i nav-baren.
