import { useEffect } from "react";
import { useRole } from "./RoleContext";

export function ThemeSync() {
  const { activeRole } = useRole();

  useEffect(() => {
    if (activeRole === "coach") {
      document.body.style.setProperty("--accent", "38 92% 55%");
      document.body.style.setProperty("--accent-hex", "#F5A623");
    } else {
      document.body.style.setProperty("--accent", "199 100% 50%");
      document.body.style.setProperty("--accent-hex", "#00C2FF");
    }
  }, [activeRole]);

  return null;
}
