import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Users, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AvatarImg } from "@/components/AvatarImg";
import { useMessages } from "@/hooks/useMessages";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import { AddMembersDialog } from "./AddMembersDialog";
import { supabase } from "@/integrations/supabase/client";
import { editMessage, softDeleteMessage, type ChatThread } from "@/lib/chatApi";
import { toast } from "sonner";

interface Props {
  thread: ChatThread;
  onBack?: () => void;
  onExit?: () => void;
}

export function Conversation({ thread, onBack, onExit }: Props) {
  const { messages, loading, refresh } = useMessages(thread.id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setMeId(user?.id ?? null));
  }, []);

  useEffect(() => {
    // Scroll to bottom on new messages
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, [messages.length]);

  const otherMembers = thread.members.filter((m) => m.user_id !== meId);
  const headerTitle =
    thread.kind === "group"
      ? thread.title || "Gruppe"
      : otherMembers[0]?.display_name || "Samtale";
  const headerAvatar = thread.kind === "direct" ? otherMembers[0]?.avatar_url : null;

  const memberMap = new Map(thread.members.map((m) => [m.user_id, m]));

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        {thread.kind === "group" ? (
          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
        ) : (
          <AvatarImg avatarUrl={headerAvatar} className="h-9 w-9 rounded-full object-cover" />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{headerTitle}</div>
          {thread.kind === "group" && (
            <div className="text-[11px] text-muted-foreground truncate">
              {thread.members.length} medlemmer
            </div>
          )}
        </div>
        {thread.kind === "group" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAddOpen(true)}
            aria-label="Tilføj personer"
            title="Tilføj personer"
          >
            <UserPlus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="px-3 py-3 h-full overflow-y-auto">
          {loading && messages.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-6">Indlæser…</div>
          )}
          {!loading && messages.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-12">
              Ingen beskeder endnu. Sig hej 👋
            </div>
          )}
          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const senderChanged = !prev || prev.sender_id !== m.sender_id;
            return (
              <MessageBubble
                key={m.id}
                message={m}
                isOwn={m.sender_id === meId}
                senderName={memberMap.get(m.sender_id)?.display_name}
                senderAvatar={memberMap.get(m.sender_id)?.avatar_url ?? null}
                showSender={thread.kind === "group" && senderChanged}
                onDelete={async () => {
                  try {
                    await softDeleteMessage(m.id);
                    await refresh();
                  } catch (e: any) {
                    toast.error(e?.message ?? "Kunne ikke slette");
                  }
                }}
                onEdit={async (newBody) => {
                  try {
                    await editMessage(m.id, newBody);
                    await refresh();
                  } catch (e: any) {
                    toast.error(e?.message ?? "Kunne ikke redigere");
                  }
                }}
              />
            );
          })}
        </div>
      </ScrollArea>

      <MessageComposer threadId={thread.id} />

      <AddMembersDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        threadId={thread.id}
        existingMemberIds={thread.members.map((m) => m.user_id)}
        onAdded={refresh}
      />
    </div>
  );
}
