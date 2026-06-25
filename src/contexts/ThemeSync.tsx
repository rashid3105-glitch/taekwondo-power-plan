import { useEffect } from "react";
import { useCoachMode } from "./CoachModeContext";
import { useRole } from "./RoleContext";
import { useActiveClub } from "./ActiveClubContext";

export function ThemeSync() {
  const { role, hasCoachRole } = useRole();
  const { isCoachMode, isCoachRoute } = useCoachMode();
  const { activeClubId, primaryClubId } = useActiveClub();

  const shouldUseCoachTheme = isCoachMode || isCoachRoute || role === "coach" || hasCoachRole;
  const isForeignClub = Boolean(
    hasCoachRole && primaryClubId && activeClubId && activeClubId !== primaryClubId,
  );

  useEffect(() => {
    if (shouldUseCoachTheme && isForeignClub) {
      document.body.classList.add("coach-foreign-club");
    } else {
      document.body.classList.remove("coach-foreign-club");
    }
  }, [shouldUseCoachTheme, isForeignClub]);

  useEffect(() => {

    root.style.transition = "color 0.3s ease";

    root.style.setProperty("--background", "0 0% 4%");
    root.style.setProperty("--foreground", "0 0% 100%");

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
