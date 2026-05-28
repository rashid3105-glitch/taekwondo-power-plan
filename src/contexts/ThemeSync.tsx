import { useEffect } from "react";
import { useRole } from "./RoleContext";

const ROLE_ACCENTS: Record<string, string> = {
  athlete: "193 100% 50%",
  coach: "37 91% 55%",
};

export function ThemeSync() {
  const { activeRole } = useRole();

  useEffect(() => {
    const accent = ROLE_ACCENTS[activeRole] || ROLE_ACCENTS.athlete;
    document.body.style.setProperty("--accent", accent);
  }, [activeRole]);

  return null;
}
