import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useThreads } from "@/hooks/useThreads";
import { ChatDrawer } from "./ChatDrawer";

export const FloatingChatButton = () => {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCoach, setIsCoach] = useState(false);
  const [open, setOpen] = useState(false);
  const { totalUnread } = useThreads();

  useEffect(() => {
    let mounted = true;

    const loadRoles = async (userId: string) => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (mounted) {
        setIsCoach(!!data?.some((r: any) => r.role === "coach" || r.role === "admin"));
      }
    };

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setIsLoggedIn(!!session);
      if (session) await loadRoles(session.user.id);
    };
    void init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return;
      setIsLoggedIn(!!session);
      if (session) void loadRoles(session.user.id);
      else setIsCoach(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const hidden =
    !isLoggedIn ||
    location.pathname === "/messages" ||
    location.pathname === "/auth" ||
    location.pathname === "/reset-password";

  if (hidden) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center sm:bottom-8 sm:right-8 cursor-pointer animate-slide-up"
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>
      <ChatDrawer open={open} onOpenChange={setOpen} isCoach={isCoach} />
    </>
  );
};
