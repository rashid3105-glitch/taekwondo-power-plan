import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useThreads } from "@/hooks/useThreads";
import { ThreadList } from "@/components/chat/ThreadList";
import { Conversation } from "@/components/chat/Conversation";
import { StartChatPicker } from "@/components/chat/StartChatPicker";
import { NewGroupDialog } from "@/components/chat/NewGroupDialog";
import { listThreads, type ChatThread } from "@/lib/chatApi";
import { PageMeta } from "@/components/PageMeta";
import { useIosKeyboard } from "@/hooks/useIosKeyboard";

export default function Messages() {
  const navigate = useNavigate();
  const { threads, loading, refresh } = useThreads();
  const [active, setActive] = useState<ChatThread | null>(null);
  const [isCoach, setIsCoach] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  useIosKeyboard();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth?redirect=/messages");
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      setIsCoach((roles ?? []).some((r: any) => r.role === "coach"));
    })();
  }, [navigate]);

  const onStarted = async (id: string) => {
    await refresh();
    const ts = await listThreads();
    const t = ts.find((x) => x.id === id);
    if (t) setActive(t);
  };

  // Keep active thread in sync with refreshed list (so unread/preview update)
  useEffect(() => {
    if (!active) return;
    const t = threads.find((x) => x.id === active.id);
    if (t && t !== active) setActive(t);
  }, [threads, active]);

  return (
    <div className="h-[100dvh] overflow-hidden bg-background flex flex-col">
      <PageMeta title="Beskeder" description="Chat med din coach og dit hold" noindex />
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 pt-safe">
        <div className="container max-w-5xl mx-auto px-3 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm sm:text-base font-extrabold">Beskeder</span>
          </div>
          <div className="flex items-center gap-1">
            {isCoach && (
              <Button variant="ghost" size="icon" onClick={() => setGroupOpen(true)} aria-label="Ny gruppe">
                <Users className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setPickerOpen(true)} aria-label="Ny samtale">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto flex-1 w-full min-h-0">
        <div className="grid md:grid-cols-[320px_1fr] h-full min-h-0 border-x border-border">
          {/* Mobile: show one pane at a time */}
          <div className={`${active ? "hidden md:block" : "block"} border-r border-border h-full min-h-0`}>
            <ThreadList
              threads={threads}
              loading={loading}
              selectedId={active?.id}
              onSelect={setActive}
            />
          </div>
          <div className={`${active ? "block" : "hidden md:block"} h-full min-h-0`}>
            {active ? (
              <Conversation
                thread={active}
                onBack={() => setActive(null)}
                onExit={() => navigate("/dashboard")}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-6 text-center">
                Vælg en samtale eller start en ny.
              </div>
            )}
          </div>
        </div>
      </main>

      <StartChatPicker open={pickerOpen} onOpenChange={setPickerOpen} onStarted={onStarted} />
      <NewGroupDialog open={groupOpen} onOpenChange={setGroupOpen} onCreated={onStarted} />
    </div>
  );
}
