

## Plan: Replace Dashboard Header with Sheet Side Menu

### What Changes
Replace the two-row sticky header (logo + nav tabs) with a slim single-row header and a slide-in Sheet panel from the right. Mobile bottom nav stays unchanged.

### New Header (single row)
- Left: Logo + "SPORTSTALENT"
- Right: `EventRemindersDropdown` + hamburger menu button (Menu icon)

### Sheet Side Panel (slides from right, `w-72`)
- **User section**: Avatar, display name, club, belt badge
- **Navigation**: Hub, Plan, Progress, Nutrition, Rehab, Mental, Testing, Library — each with icon + label, color-coded active state, demo-locked items shown disabled
- **Divider**
- **Utilities**: Profile, Coach Dashboard (if coach), Admin (if admin), Help
- **Divider**
- **Language switcher**
- **Sign Out** button at bottom

### Files Modified
- `src/pages/Dashboard.tsx` — remove nav row from header, add Sheet import and side menu component, keep mobile bottom nav as-is

### Design
- Dark cockpit theme preserved
- Same tab color tokens (text-tab-plan, text-tab-rehab, etc.)
- Sheet closes on nav item click
- Uses existing `Sheet` component from `src/components/ui/sheet.tsx`

