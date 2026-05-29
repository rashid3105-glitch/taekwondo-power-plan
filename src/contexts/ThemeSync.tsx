import { useEffect } from "react";
import { useCoachMode } from "./CoachModeContext";
import { useRole } from "./RoleContext";

export function ThemeSync() {
  const { activeRole } = useRole();
  const { isCoachMode, isCoachRoute } = useCoachMode();

  useEffect(() => {
    const shouldUseCoachTheme = isCoachMode || isCoachRoute || activeRole === "coach";

    if (shouldUseCoachTheme) {
      document.body.style.setProperty("--accent", "38 92% 55%");
      document.body.style.setProperty("--accent-hex", "#F5A623");
    } else {
      document.body.style.setProperty("--accent", "199 100% 50%");
      document.body.style.setProperty("--accent-hex", "#00C2FF");
    }
  }, [activeRole, isCoachMode, isCoachRoute]);

  return null;
}
