import { useEffect } from "react";
import { useCoachMode } from "./CoachModeContext";
import { useRole } from "./RoleContext";

export function ThemeSync() {
  const { role, hasCoachRole } = useRole();
  const { isCoachMode, isCoachRoute } = useCoachMode();

  useEffect(() => {
    const shouldUseCoachTheme = isCoachMode || isCoachRoute || role === "coach" || hasCoachRole;
    const root = document.documentElement;

    root.style.transition = "color 0.3s ease";

    // Do NOT override --background or --foreground here — the app uses the
    // light palette from index.css. Forcing dark bg + white fg made text
    // unreadable on light cards (bg-card stayed light, text went white).
    root.style.removeProperty("--background");
    root.style.removeProperty("--foreground");

    if (shouldUseCoachTheme) {
      root.style.setProperty("--primary", "38 92% 55%");
      root.style.setProperty("--primary-foreground", "0 0% 0%");
      root.style.setProperty("--ring", "38 92% 55%");
      root.style.setProperty("--accent", "38 92% 55%");
      root.style.setProperty("--accent-foreground", "0 0% 0%");
      root.style.setProperty("--accent-hex", "#F5A623");
    } else {
      root.style.setProperty("--primary", "199 100% 50%");
      root.style.setProperty("--primary-foreground", "0 0% 0%");
      root.style.setProperty("--ring", "199 100% 50%");
      root.style.setProperty("--accent", "199 100% 50%");
      root.style.setProperty("--accent-foreground", "0 0% 0%");
      root.style.setProperty("--accent-hex", "#00C2FF");
    }
  }, [role, hasCoachRole, isCoachMode, isCoachRoute]);

  return null;
}
