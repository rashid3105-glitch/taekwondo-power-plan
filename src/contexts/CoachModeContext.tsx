import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";

interface CoachModeContextValue {
  isCoachMode: boolean;
  setCoachMode: (value: boolean) => void;
  isCoachRoute: boolean;
}

const CoachModeContext = createContext<CoachModeContextValue>({
  isCoachMode: false,
  setCoachMode: () => {},
  isCoachRoute: false,
});

export const CoachModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isCoachRoute = location.pathname.startsWith("/coach");

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

  const shouldBeDark = isCoachMode || isCoachRoute;

  useEffect(() => {
    if (shouldBeDark) {
      document.body.classList.add("coach-mode");
    } else {
      document.body.classList.remove("coach-mode");
    }
  }, [shouldBeDark]);

  return (
    <CoachModeContext.Provider value={{ isCoachMode, setCoachMode, isCoachRoute }}>
      {children}
    </CoachModeContext.Provider>
  );
};

export const useCoachMode = () => useContext(CoachModeContext);
