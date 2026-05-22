import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface CoachModeContextValue {
  isCoachMode: boolean;
  setCoachMode: (value: boolean) => void;
}

const CoachModeContext = createContext<CoachModeContextValue>({
  isCoachMode: false,
  setCoachMode: () => {},
});

export const CoachModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCoachMode, setIsCoachMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("tkd-coach-mode") === "coach";
  });

  const setCoachMode = useCallback((value: boolean) => {
    setIsCoachMode(value);
    try {
      localStorage.setItem("tkd-coach-mode", value ? "coach" : "athlete");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "tkd-coach-mode") {
        setIsCoachMode(e.newValue === "coach");
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (isCoachMode) {
      document.body.classList.add("coach-mode");
    } else {
      document.body.classList.remove("coach-mode");
    }
  }, [isCoachMode]);

  return (
    <CoachModeContext.Provider value={{ isCoachMode, setCoachMode }}>
      {children}
    </CoachModeContext.Provider>
  );
};

export const useCoachMode = () => useContext(CoachModeContext);
