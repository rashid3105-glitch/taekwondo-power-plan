import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

/** Short, discrete two-tone chime via WebAudio (no asset needed). */
function playChime() {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [880, 1174].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.09;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.09, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.18);
    });
    setTimeout(() => ctx.close().catch(() => {}), 600);
  } catch { /* ignore */ }
}

function vibrate() {
  try {
    if ("vibrate" in navigator) navigator.vibrate?.([18, 40, 18]);
  } catch { /* ignore */ }
}

/**
 * Global in-app chat notifications: toast + optional sound/vibration when a
 * message arrives in one of my threads while the app is open.
 * Respects profiles.chat_toast_enabled / chat_sound_enabled.
 */
export function useChatNotifications() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("chat_toast_enabled, chat_sound_enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      const toastEnabled = (prof as any)?.chat_toast_enabled ?? true;
      const soundEnabled = (prof as any)?.chat_sound_enabled ?? true;
      if (!toastEnabled && !soundEnabled) return;

      const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      channel = supabase
        .channel(`chat-notify-${user.id}-${suffix}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chat_messages" },
          async (payload) => {
            const msg = payload.new as {
              id: string; thread_id: string; sender_id: string; body: string | null;
            };
            if (!msg || msg.sender_id === user.id) return;
            // Don't interrupt when the user is already in the chat UI.
            if (pathRef.current.startsWith("/messages")) return;

            if (soundEnabled) { playChime(); vibrate(); }
            if (!toastEnabled) return;

            let name = t("chatNewMessage" as any) as string;
            try {
              const { data: people } = await supabase.rpc("get_chat_members_display", {
                _ids: [msg.sender_id],
              });
              const found = (people as any[])?.[0]?.display_name;
              if (found) name = found;
            } catch { /* keep fallback */ }

            toast(name, {
              description: msg.body?.slice(0, 120) || "",
              action: {
                label: t("chatOpen" as any) as string,
                onClick: () => navigate(`/messages?thread=${msg.thread_id}`),
              },
            });
          },
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [navigate, t]);
}
