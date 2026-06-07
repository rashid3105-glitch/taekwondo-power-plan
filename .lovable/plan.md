## Mål
Alle tekster på den sorte baggrund i atletprofilen skal være helt hvide — ikke grålige (translucent hvid). Gælder både `Profile.tsx` (visning) og `ProfileEdit.tsx` (redigering), som begge bruger `backgroundColor: #0a0a0a`.

## Filer

### 1. `src/pages/Profile.tsx`
Erstat alle dæmpede hvide teksttoner med fuld hvid (`text-white`) — bevar layout, ikoner, badges og accentfarver:

- `sectionTitleCls`: `text-white/35` → `text-white`
- Tilbage-knap & menu-knap: `text-white/70` → `text-white`
- Sub-tekst under navn: `text-white/50` → `text-white`
- Disciplin-label: `text-white/50` → `text-white`
- Disciplin-chips inaktiv: `color: rgba(255,255,255,0.6)` → `color: #ffffff`
- Rolle-tekst: `text-white/60` → `text-white`
- Tom-state tekster (`text-white/50`, `text-white/40`): → `text-white`
- Licens-felt label/værdi (`text-white/50`, `text-white/40 italic`): → `text-white` (behold italic; behold rød for udløbet)
- Badge default `color: rgba(255,255,255,0.6)` → `#ffffff` (behold rød/orange for udløbet/snart)
- Mål-chips `color: rgba(255,255,255,0.75)` → `#ffffff`
- Logud-knap `text-white/80` → `text-white`
- Stat-kort label `text-white/60`, sub `text-white/50`, samt mini-label `text-white/45` → `text-white`
- Action-kort accent-grenens `color: var(--accent-hex)` bevares (det er accentfarven, ikke grå)

### 2. `src/pages/ProfileEdit.tsx`
Samme princip:

- `sectionTitleCls`: `text-white/35` → `text-white`
- `inputCls`: `placeholder:text-white/30` → `placeholder:text-white/70` (placeholders skal stadig være svagere end indtastet tekst, men læsbare; selve `text-white` for værdien bevares)
- Tilbage-knap `text-white/70` → `text-white`
- Avatar-fallback ikon `text-white/40` → `text-white` (ikon, men gør fuldt hvidt for konsistens)
- Disciplin-chip inaktiv `color: rgba(255,255,255,0.7)` → `#ffffff`
- Tom-state `text-white/50` → `text-white`
- Licens-felt navn `text-white/55`, slet-knap `text-white/40` → `text-white` (behold hover-rød)
- Hjælpetekst `text-white/40 pt-3` → `text-white`
- `Label`-komponent `text-white/45` → `text-white`

## Hvad rører jeg IKKE
- Baggrundsfarver, layout, padding, ikoner (form), borders (`border-white/10`), kort-baggrunde (`bg-white/[0.04]` etc.) — kun tekstfarver.
- Accentfarver (gul/blå via `var(--accent-hex)`), destruktiv rød, advarsels-orange, succes-grøn — bevares uændret.
- `ProfileSetup.tsx` (separat side på lys baggrund) — rør ikke.
- Ingen ændringer i logik, oversættelser, edge functions, RLS eller DB.
- Ingen changelog (kosmetisk justering).

## Test
Åbn `/profile` og `/profile-edit` som atlet og bekræft at al brødtekst, labels, sub-tekster, hjælpetekster og chip-tekster nu er fuldt hvide og letlæselige på den sorte baggrund. Placeholders i input-felter er stadig en anelse dæmpede men læsbare.
