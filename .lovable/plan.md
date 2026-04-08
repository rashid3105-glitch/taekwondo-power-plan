

## Plan: Add personalized welcome section to dashboard hub

### What changes
Replace the generic centered "hubWelcome" text block (lines 428-433) with a personalized welcome card showing the user's avatar, name, belt level, club, and key stats.

### Design
A horizontal card at the top of the hub with:
- Left: User avatar (using existing `AvatarImg` component)
- Center: Greeting with display name, belt badge, club name underneath
- Right: Quick stats row — experience years, training days/week, program weeks

The card uses the existing `bg-card/80 backdrop-blur-sm` style to match the hub cards, with a subtle gradient.

### File changes

**`src/pages/Dashboard.tsx`**
- Replace the `<div className="text-center space-y-1">` block (lines 428-433) with a new welcome section
- Uses `profile.avatar_url`, `profile.display_name`, `profile.belt_level`, `clubName`, `profile.experience_years`, `profile.tkd_sessions_per_week`, `profile.program_weeks` — all already loaded in state
- Import `Badge` from `@/components/ui/badge`

**`src/i18n/translations.ts`**
- Add keys: `welcomeBack`, `yearsExp`, `sessionsWeek`, `weekProgram` in EN, DA, SV, DE

### Layout sketch
```text
┌──────────────────────────────────────────────┐
│  [Avatar]  Velkommen tilbage, Ky Tu!         │
│            🟢 Green belt · TKD Club Name     │
│                                              │
│   3 års erfaring  ·  5x/uge  ·  8 uger      │
└──────────────────────────────────────────────┘
```

