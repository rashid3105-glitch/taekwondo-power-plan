## Changes to `src/pages/Index.tsx`

### 1. Replace stats section (lines 70–80)

Remove the "150+ / 2.400+ / 38 / 8 timer" grid. Replace with a centered text block in the same dark band (#13141F):

- Eyebrow: "BYGGET PÅ ÅRTIERS ERFARING"
- Heading: "En platform skabt af coaches — til coaches"
- Paragraph: "Sportstalent er bygget af aktive trænere med årtiers erfaring fra sportshallen. Hver eneste funktion løser et reelt problem fra hverdagen — ikke et tænkt scenarie fra et kontor. Vi deler ikke brugertal endnu; vi fokuserer på at bygge det bedste værktøj til dig og dine atleter."

### 2. Swap hero image (line 58)

Replace `heroImage` in the hero preview with the new "coach sitting" photo (`user-uploads://ChatGPT_Image_15._jun._2026_10.38.39.png`). Upload via `lovable-assets` to `src/assets/coach-sitting.jpg.asset.json` and import it.

### 3. Swap "Why" section image (line 132)

Replace `heroImage` with the new "coach standing" photo (`user-uploads://709737584_10164324396250783_4016614190742833532_n.jpg`). Upload via `lovable-assets` to `src/assets/coach-standing.jpg.asset.json` and import it.

(Keep `heroImage` import only if still used; otherwise remove.)

### 4. Anonymize testimonials (lines 147–165)

Remove `name`, `role`, and the avatar/name footer block. Keep only the quote text and the opening quotation mark. Replace the footer with a small neutral label like "— Coach på platformen" in muted color.  
  
5. the links in the top does not work. They have to be linked to the correct pages

No other sections, routes, or files change.