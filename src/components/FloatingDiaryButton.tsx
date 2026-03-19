import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { NotebookPen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const FloatingDiaryButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Hide on diary page, auth pages, or when not logged in
  if (!isLoggedIn || location.pathname === "/diary" || location.pathname === "/auth" || location.pathname === "/reset-password") {
    return null;
  }

  return (
    <button
      onClick={() => navigate("/diary")}
      className="fixed bottom-24 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center sm:bottom-8 sm:right-8 cursor-pointer animate-slide-up animate-pulse-glow"
      aria-label="Open Diary"
    >
      <NotebookPen className="h-6 w-6" />
    </button>
  );
};
