import { useEffect } from "react";
import { useCoachMode } from "./CoachModeContext";
import { useRole } from "./RoleContext";

export function ThemeSync() {
  const { activeRole } = useRole();
  const { isCoachMode, isCoachRoute } = useCoachMode();

  useEffect(() => {
    const shouldUseCoachTheme = isCoachMode || isCoachRoute || activeRole === "coach";
    const root = document.documentElement;

    root.style.transition = "color 0.3s ease";

    // Shared (both roles)
    root.style.setProperty("--background", "0 0% 4%");
    root.style.setProperty("--foreground", "0 0% 100%");

    if (shouldUseCoachTheme) {
      // Coach — gold #F5A623
      root.style.setProperty("--primary", "38 92% 55%");
      root.style.setProperty("--primary-foreground", "0 0% 0%");
      root.style.setProperty("--ring", "38 92% 55%");
      root.style.setProperty("--accent", "38 92% 55%");
      root.style.setProperty("--accent-foreground", "0 0% 0%");
      root.style.setProperty("--accent-hex", "#F5A623");
    } else {
      // Athlete — blue #00C2FF
      root.style.setProperty("--primary", "199 100% 50%");
      root.style.setProperty("--primary-foreground", "0 0% 0%");
      root.style.setProperty("--ring", "199 100% 50%");
      root.style.setProperty("--accent", "199 100% 50%");
      root.style.setProperty("--accent-foreground", "0 0% 0%");
      root.style.setProperty("--accent-hex", "#00C2FF");
    }
  }, [activeRole, isCoachMode, isCoachRoute]);

  return null;
}
