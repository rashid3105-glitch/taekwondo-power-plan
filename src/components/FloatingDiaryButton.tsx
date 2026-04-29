import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { NotebookPen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const FloatingDiaryButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const mountedRef = useRef(true);

  const loadUnreadCount = useCallback(async (userId: string) => {
    const { data: diaryEntries } = await supabase
      .from("diary_entries")
      .select("id")
      .eq("user_id", userId);

    const entryIds = (diaryEntries || []).map((entry: any) => entry.id);
    if (!entryIds.length) {
      if (mountedRef.current) {
        setUnreadCount((prev) => (prev === 0 ? prev : 0));
      }
      return;
    }

    const { count } = await supabase
      .from("diary_comments" as any)
      .select("id", { count: "exact", head: true })
      .eq("is_read", false)
      .in("diary_entry_id", entryIds);

    if (mountedRef.current) {
      const nextCount = count || 0;
      setUnreadCount((prev) => (prev === nextCount ? prev : nextCount));
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mountedRef.current) return;

      const loggedIn = !!session;
      setIsLoggedIn((prev) => (prev === loggedIn ? prev : loggedIn));
      if (session) {
        await loadUnreadCount(session.user.id);
      } else {
        setUnreadCount((prev) => (prev === 0 ? prev : 0));
      }
    };

    void checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const loggedIn = !!session;
      if (mountedRef.current) {
        setIsLoggedIn((prev) => (prev === loggedIn ? prev : loggedIn));
      }
      if (session) {
        void loadUnreadCount(session.user.id);
      } else if (mountedRef.current) {
        setUnreadCount((prev) => (prev === 0 ? prev : 0));
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [loadUnreadCount]);

  // Refresh count periodically
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = window.setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await loadUnreadCount(session.user.id);
      }
    }, 30000);
    return () => window.clearInterval(interval);
  }, [isLoggedIn, loadUnreadCount]);

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
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
};
