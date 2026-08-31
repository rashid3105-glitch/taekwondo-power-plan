import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Users, UserPlus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AvatarImg } from "@/components/AvatarImg";
import { useMessages } from "@/hooks/useMessages";
import { useAvatarUrl } from "@/hooks/useAvatarUrl";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import { AddMembersDialog } from "./AddMembersDialog";
import { supabase } from "@/integrations/supabase/client";
import { editMessage, softDeleteMessage, markThreadRead, addReaction, removeReaction, removeThreadMember, type ChatThread } from "@/lib/chatApi";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";

function isSameDay(a: string, b: string) {
  const da = new Date(a), db = new Date(b);
  return da.toDateString() === db.toDateString();
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "I dag";
  if (d.toDateString() === yesterday.toDateString()) return "I går";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "long" });
}

interface Props {

  thread: ChatThread;
  onBack?: () => void;
  onExit?: () => void;
  variant?: "pane" | "floating";
}

export function Conversation({ thread, onBack, onExit, variant = "pane" }: Props) {
  const { t } = useLanguage();
  const { messages, loading, refresh, setMessages } = useMessages(thread.id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [partnerReadAt, setPartnerReadAt] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, { emoji: string; count: number; byMe: boolean }[]>>({});
  const [membersOpen, setMembersOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const partnerAvatarUrl = useAvatarUrl((thread as any)?.partner?.avatar_url);

  // Defensive: some threads (RLS edge cases, older rows) may not carry a
  // members array. Deriving a safe local avoids crashing the whole view
  // (and white-screening the native app) if that happens.
  const members = Array.isArray(thread?.members) ? thread.members : [];

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setMeId(user?.id ?? null);
      if (user && thread.kind === "group") {
        supabase
          .from("chat_threads")
          .select("created_by")
          .eq("id", thread.id)
          .maybeSingle()
          .then(({ data }) => {
            setIsCreator((data as any)?.created_by === user.id);
          });
      }
    });
  }, [thread.id, thread.kind]);

  useEffect(() => {
    if (thread.kind !== "direct" || !meId) return;
    const partner = members.find((m) => m.user_id !== meId);
    setPartnerReadAt((partner as any)?.last_read_at ?? null);
  }, [thread, meId, members]);

  const loadReactions = async () => {
    if (!messages.length) return;
    const ids = messages.map((m) => m.id);
    const { data } = await supabase
      .from("chat_reactions")
      .select("message_id, emoji, user_id")
      .in("message_id", ids);
    if (!data) return;
    const { data: { user } } = await supabase.auth.getUser();
    const map: Record<string, Record<string, { emoji: string; count: number; byMe: boolean }>> = {};
    for (const r of data as any[]) {
      if (!map[r.message_id]) map[r.message_id] = {};
      if (!map[r.message_id][r.emoji]) map[r.message_id][r.emoji] = { emoji: r.emoji, count: 0, byMe: false };
      map[r.message_id][r.emoji].count++;
      if (r.user_id === user?.id) map[r.message_id][r.emoji].byMe = true;
    }
    setReactions(Object.fromEntries(Object.entries(map).map(([k, v]) => [k, Object.values(v)])));
  };

  useEffect(() => {
    // Scroll to bottom on new messages
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
    if (meId && messages.length > 0) {
      markThreadRead(thread.id).catch(() => {});
    }
    loadReactions();
  }, [messages.length]);

  const otherMembers = members.filter((m) => m.user_id !== meId);
  const headerTitle =
    thread.kind === "group"
      ? thread.title || "Gruppe"
      : otherMembers[0]?.display_name || "Samtale";
  const headerAvatar = thread.kind === "direct" ? otherMembers[0]?.avatar_url : null;

  const memberMap = new Map(members.map((m) => [m.user_id, m]));

return (
    <div className={cn("relative flex flex-col h-full bg-background min-h-0 pointer-events-auto touch-manipulation", variant === "floating" && "bg-card")}>
      {/* Compact header */}
      <div
        className={cn(
          "sticky top-0 z-10 flex items-center gap-2.5 border-b border-border/60 bg-card px-2.5 py-2",
          variant === "floating" && "px-3 py-2.5"
        )}
      >
        {onBack && (
          <button
            onClick={onBack}
            aria-label={t("back")}
            title={t("back")}
            className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        {thread.kind === "group" ? (
          <div className="h-9 w-9 rounded-full bg-muted border border-gold/50 flex items-center justify-center shrink-0">
            <Users className="h-4 w-4 text-gold" />
          </div>
        ) : (
          <AvatarImg avatarUrl={headerAvatar} className="h-9 w-9 rounded-full object-cover border-2 border-gold shrink-0" />
        )}
        <div
          className={cn("flex-1 min-w-0", thread.kind === "group" && "cursor-pointer")}
          onClick={() => thread.kind === "group" && setMembersOpen(true)}
        >
          <div className="text-sm font-semibold tracking-tight truncate">{headerTitle}</div>
          {thread.kind === "group" && (
            <div className="text-[10px] font-medium text-gold truncate">
              {members.length} medlemmer
            </div>
          )}
        </div>
        {thread.kind === "group" && (
          <button
            onClick={() => setAddOpen(true)}
            aria-label="Tilføj personer"
            title="Tilføj personer"
            className="p-2 text-muted-foreground hover:text-gold transition-colors shrink-0"
          >
            <UserPlus className="h-4 w-4" />
          </button>
        )}
        {onExit && (
          <button
            onClick={onExit}
            aria-label="Luk chat"
            title="Luk chat"
            className="shrink-0 flex items-center gap-1 rounded-lg border border-gold/40 px-2.5 py-1.5 text-gold hover:bg-gold/10 transition-colors"
          >
            <span className="text-[11px] font-bold uppercase tracking-tight">Luk</span>
            <X className="h-3 w-3" />
          </button>
        )}
      </div>


      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3"
        style={{ WebkitOverflowScrolling: "touch" }}
      >

          {loading && messages.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-6">Indlæser…</div>
          )}
          {!loading && messages.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-12">
              Ingen beskeder endnu. Sig hej 👋
            </div>
          )}
          {(() => {
            const ownFlags = messages.map((m) => m.sender_id === meId);
            const lastOwnIdx = ownFlags.lastIndexOf(true);
            return messages.map((m, i) => {
              const prev = messages[i - 1];
              const senderChanged = !prev || prev.sender_id !== m.sender_id;
              const dayChanged = !prev || !isSameDay(prev.created_at, m.created_at);
              const showRead =
                thread.kind === "direct" &&
                i === lastOwnIdx &&
                partnerReadAt &&
                partnerReadAt >= m.created_at;
              const partner = members.find((p) => p.user_id !== meId);
              return (
                <div key={m.id}>
{dayChanged && (
                    <div className="flex justify-center py-2.5">
                      <span className="px-3 py-1 rounded-full bg-card border border-border/60 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                        {dayLabel(m.created_at)}
                      </span>
                    </div>
                  )}

                  <MessageBubble
                    message={m}
                    isOwn={m.sender_id === meId}
                    senderName={memberMap.get(m.sender_id)?.display_name}
                    senderAvatar={memberMap.get(m.sender_id)?.avatar_url ?? null}
                    showSender={thread.kind === "group" && senderChanged}
                    reactions={reactions[m.id] ?? []}
                    onReact={async (emoji) => {
                      const existing = reactions[m.id]?.find((r) => r.emoji === emoji && r.byMe);
                      try {
                        if (existing) await removeReaction(m.id, emoji);
                        else await addReaction(m.id, emoji);
                        await loadReactions();
                      } catch (e: any) {
                        toast.error(e?.message ?? "Kunne ikke reagere");
                      }
                    }}
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
{showRead && (
                    <div className="flex justify-end pr-1 -mt-1 mb-1">
                      <div className="flex items-center gap-1">
                        {partnerAvatarUrl ? (
                          <img
                            src={partnerAvatarUrl}
                            className="h-4 w-4 rounded-full object-cover ring-1 ring-gold/40"
                            alt=""
                          />
                        ) : (
                          <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                            {((partner as any)?.display_name || "?").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span className="text-[10px] text-gold font-medium flex items-center gap-0.5">
                          Set
                          <Check className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            });
          })()}
      </div>


      <MessageComposer
        threadId={thread.id}
        onSent={(m) =>
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]))
        }
      />

      <AddMembersDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        threadId={thread.id}
        existingMemberIds={members.map((m) => m.user_id)}
        onAdded={refresh}
      />

      {thread.kind === "group" && membersOpen && (
        <div className="absolute inset-0 z-20 flex flex-col bg-background">
          <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-2">
            <Button variant="ghost" size="icon" onClick={() => setMembersOpen(false)} aria-label={t("iconHintClose")} title={t("iconHintClose")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Gruppemedlemmer</div>
              <div className="text-[11px] text-muted-foreground">{members.length} personer</div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3 space-y-1">
              {members.map((member) => {
                const isSelf = member.user_id === meId;
                const canRemove = isCreator || isSelf;
                const removeLabel = isSelf ? "Forlad gruppe" : "Fjern fra gruppe";
                return (
                  <div
                    key={member.user_id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <AvatarImg
                      avatarUrl={(member as any).avatar_url ?? null}
                      className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {(member as any).display_name || "Ukendt"}
                        {isSelf && <span className="ml-1.5 text-[10px] text-muted-foreground">(dig)</span>}
                      </div>
                      {(member as any).is_parent && (
                        <div className="text-[10px] text-amber-600">Forælder</div>
                      )}
                    </div>
                    {canRemove && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "text-xs h-7 px-2 shrink-0",
                          isSelf ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                                 : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        )}
                        disabled={removingId === member.user_id}
                        onClick={async () => {
                          setRemovingId(member.user_id);
                          try {
                            await removeThreadMember(thread.id, member.user_id);
                            if (isSelf) {
                              setMembersOpen(false);
                              onBack?.();
                            } else {
                              await refresh();
                              toast.success(`${(member as any).display_name || "Personen"} er fjernet fra gruppen`);
                            }
                          } catch (e: any) {
                            toast.error(e?.message ?? "Kunne ikke fjerne");
                          } finally {
                            setRemovingId(null);
                          }
                        }}
                      >
                        {removingId === member.user_id ? "…" : removeLabel}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
