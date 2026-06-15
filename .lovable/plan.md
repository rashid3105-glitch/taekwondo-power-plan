## Problem
Det nye gold/mørke Index-design jeg byggede ligger i `src/pages/Index.tsx`, men `/` viser stadig `CoachLanding`. Derfor er det nye design ikke synligt på forsiden.

## Plan
Opdatér routing i `src/App.tsx` (linje 129-131):

```
/    → Index           (nyt design — ny forside)
/v3  → CoachLanding    (flyttes fra /)
/v2  → Landing         (uændret)
/v1  → Index            (fjernes — Index er nu på /)
```

Konkret diff:
- `<Route path="/" element={<Page><CoachLanding /></Page>} />` → `<Route path="/" element={<Page><Index /></Page>} />`
- `<Route path="/v1" element={<Page><Index /></Page>} />` → `<Route path="/v3" element={<Page><CoachLanding /></Page>} />`
- `/v2` (Landing) forbliver

Opdatér `mem://features/club-landing-page` så den afspejler den nye rute-mapping.

Ingen andre ændringer — Index.tsx er allerede færdig, founder-billedet er uploadet til `/public/founder-farooq.jpg`, og auth-redirect øverst i Index sender loggede-ind brugere videre til `/dashboard`.
