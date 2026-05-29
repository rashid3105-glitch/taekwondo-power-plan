## Problem
`src/pages/Profile.tsx` blev bygget som en standalone "design"-side med hardcoded farver (`#0a0a0a`, `bg-white/[0.03]`, `var(--accent-hex)`), custom rounded `[14px]` korthylstre og dansk hardcoded tekst. Det matcher ikke mønstret fra Health, Diary, SubscriptionSettings, Help m.fl., som alle bruger:

- `min-h-screen bg-background` (semantiske tokens — ikke hex)
- Centreret container `mx-auto max-w-2xl px-4 py-6` (eller py-8)
- Tilbage-knap øverst (`Button variant="ghost"` + `ChevronLeft`/`ArrowLeft`)
- shadcn `<Card> / <CardHeader> / <CardTitle> / <CardContent>` til sektioner
- `<PageMeta>` for title/description
- `<AppFooter />` og evt. `<Watermark />` i bunden
- Oversættelser via `useLanguage()` + `t(...)` — aldrig hardcodede strenge

## Plan
Refaktorér `src/pages/Profile.tsx` så den følger de øvrige authenticated sider. Kun præsentation ændres — data-hentningen (profiles, coach_athletes, coach_license_fields, license_values) bevares som den er nu.

### Layout-skelet
```tsx
<div className="min-h-screen bg-background">
  <PageMeta title="Min profil" description="..." />
  <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
    <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
      <ChevronLeft className="h-4 w-4 mr-1" /> Tilbage
    </Button>
    <Card> … profil-header … </Card>
    <Card> … Sport & disciplin … </Card>
    <Card> … Licenser & registreringer … </Card>
    <Card> … Mine mål … </Card>
    <Card> … Konto … </Card>
    <Button variant="destructive" className="w-full">Log ud</Button>
  </div>
  <AppFooter />
</div>
```

### Konkrete ændringer
1. Fjern `style={{ backgroundColor: "#0a0a0a" }}` → brug `bg-background`.
2. Fjern alle `bg-white/[0.03] border-white/10 rounded-[14px]` wrappers → erstat med `<Card>` + `<CardHeader><CardTitle>...</CardTitle></CardHeader><CardContent>`.
3. Fjern `var(--accent-hex)` inline-styles. Brug semantiske Tailwind-tokens: `bg-primary text-primary-foreground` (aktive pills/badges), `text-muted-foreground` (labels), `border-border` (delerlinjer), `text-destructive` (slet/log ud).
4. Erstat custom `Section/Row/ActionRow/MetaCell` helpers — Row/MetaCell kan beholdes, men de skal bruge `text-muted-foreground` og `text-foreground` i stedet for `text-white/35` / `text-white/85`. Section-wrapper droppes til fordel for shadcn Card.
5. Tilføj `<PageMeta>` + `<AppFooter />` (som Health/Diary).
6. Tilføj tilbage-knap øverst.
7. Erstat hardcoded danske strenge med `t("...")`-kald. Tilføj nye nøgler i `src/i18n/translations.ts` for alle 7 sprog (en, da, sv, de, ar, no, es) — påkrævede nøgler:
   - `profileTitle`, `profileNoClub`, `profileNoName`, `profileBirthDate`, `profileBeltLevel`, `profileHeight`, `profileWeight`, `profileSportDiscipline`, `profileSport`, `profileDiscipline`, `profileRole`, `profileRoleAthlete`, `profileRoleCoach`, `profileRoleBoth`, `profileLicensesTitle`, `profileLicensesNoCoach`, `profileLicensesNoFields`, `profileLicensesFooter`, `profileLicenseActive`, `profileLicenseExpiringSoon`, `profileLicenseExpired`, `profileLicenseExpires`, `profileLicenseNotDefined`, `profileGoalsTitle`, `profileGoalsEmpty`, `profileAccountTitle`, `profileAccountEmail`, `profileChangePassword`, `profileExportData`, `profileDeleteAccount`, `profileDeleteAccountSub`, `profileLogout`, `profileBack`, `profileEdit`.
8. Behold den eksisterende Supabase-query (med `coach_club_name` fallback og uden `sport`-kolonnen), så data fortsat vises.

### Filer der røres
- `src/pages/Profile.tsx` (refaktor)
- `src/i18n/translations.ts` (nye nøgler × 7 sprog)

### Det jeg IKKE rører
- Datahentning og felter
- Routing (`/profile-setup` → `/profile` redirect står)
- Profile.tsx-funktionaliteten (eksport, logout, navigation til change-password/delete-account)
- `coach_license_fields`-tabel og migration