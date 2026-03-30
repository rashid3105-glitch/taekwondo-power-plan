import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { NotebookPen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const FloatingDiaryButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      if (session) loadUnreadCount(session.user.id);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      if (session) loadUnreadCount(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUnreadCount = async (userId: string) => {
    // Count unread comments on this user's diary entries
    const { count } = await supabase
      .from("diary_comments" as any)
      .select("id", { count: "exact", head: true })
      .eq("is_read", false)
      .in("diary_entry_id", 
        // Use a subquery approach: get user's diary entry IDs first
        await supabase
          .from("diary_entries")
          .select("id")
          .eq("user_id", userId)
          .then(({ data }) => (data || []).map((e: any) => e.id))
      );
    setUnreadCount(count || 0);
  };

  // Refresh count periodically
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) loadUnreadCount(session.user.id);
    }, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

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
