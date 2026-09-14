import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { useActiveClub } from "@/contexts/ActiveClubContext";
import { MessageSquare, Send, Trash2, Loader2, Users, Lock, Smile } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiaryComment {
  id: string;
  diary_entry_id: string;
  coach_id: string;
  content: string;
  created_at: string;
  is_shared: boolean;
  author_role?: string;
  coach_name?: string;
}

interface DiaryCommentsProps {
  entryId: string;
  /** If true, show comment input (coach mode) */
  canComment?: boolean;
  /** Owner of the diary entry — lets the athlete reply in their own thread. */
  entryOwnerId?: string;
}

/** How many replies are visible before the thread is expanded. */
const COLLAPSED_COUNT = 2;

export function DiaryComments({ entryId, canComment = false, entryOwnerId }: DiaryCommentsProps) {
  const [comments, setComments] = useState<DiaryComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [shareNew, setShareNew] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { activeClubId, primaryClubId } = useActiveClub();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const EMOJIS = ["👍", "❤️", "🔥", "💪", "🥋", "🎯", "👏", "😄", "🙏", "✅", "😂", "🤩", "👌", "🚀"];

  // The athlete owning the entry may reply in their own thread.
  const isEntryOwner = !!entryOwnerId && currentUserId === entryOwnerId;
  const canReply = canComment || isEntryOwner;

  useEffect(() => {
    loadComments();
  }, [entryId]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    if (!showEmoji) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-emoji-picker]")) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showEmoji]);

  const loadComments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    const { data, error } = await supabase
      .from("diary_comments" as any)
      .select("*")
      .eq("diary_entry_id", entryId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      const authorIds = [...new Set((data as any[]).map((c: any) => c.coach_id))];
      let names: Record<string, string> = {};
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("club_directory" as any)
          .select("user_id, display_name")
          .in("user_id", authorIds);
        if (profiles) {
          names = Object.fromEntries(profiles.map((p: any) => [p.user_id, p.display_name]));
        }
      }

      const mappedComments = (data as any[]).map((c: any) => ({
        ...c,
        is_shared: c.is_shared ?? true,
        author_role: c.author_role ?? "coach",
        coach_name: names[c.coach_id] || (c.author_role === "athlete" ? "" : t("coach")),
      }));
      setComments(mappedComments);

      if (!canComment && user) {
        const unreadIds = (data as any[])
          .filter((c: any) => !c.is_read && c.coach_id !== user.id)
          .map((c: any) => c.id);
        if (unreadIds.length > 0) {
          await Promise.all(
            unreadIds.map((id: string) =>
              supabase.rpc("mark_comment_read", { _comment_id: id })
            )
          );
        }
      }
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }

    // Athlete replies in their own thread are always shared with the coaches
    // who can already see it; only coaches choose the sharing level.
    const asAthlete = !canComment && isEntryOwner;
    const clubId = activeClubId ?? primaryClubId ?? null;
    const { error } = await supabase.from("diary_comments" as any).insert({
      diary_entry_id: entryId,
      coach_id: user.id,
      content: newComment.trim().slice(0, 2000),
      is_shared: asAthlete ? true : shareNew,
      author_role: asAthlete ? "athlete" : "coach",
      ...(clubId ? { club_id: clubId } : {}),
    } as any);

    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    } else {
      // TODO(fcm): route coach→athlete diary-comment push through a dedicated
      // server-side wrapper. send-push is now service-role only; a direct
      // client call would be rejected. Tracked with the FCM native rollout.
      setNewComment("");
      setExpanded(true);
      await loadComments();
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase.from("diary_comments" as any).delete().eq("id", commentId);
    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  const handleToggleShared = async (comment: DiaryComment) => {
    const next = !comment.is_shared;
    setComments((prev) => prev.map((c) => (c.id === comment.id ? { ...c, is_shared: next } : c)));
    const { error } = await supabase
      .from("diary_comments" as any)
      .update({ is_shared: next } as any)
      .eq("id", comment.id);
    if (error) {
      // revert
      setComments((prev) => prev.map((c) => (c.id === comment.id ? { ...c, is_shared: !next } : c)));
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 py-1">
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (comments.length === 0 && !canReply) return null;

  const hiddenCount = Math.max(0, comments.length - COLLAPSED_COUNT);
  const visible = expanded || hiddenCount === 0 ? comments : comments.slice(-COLLAPSED_COUNT);
  const showAllLabel = (t("diaryThreadShowAll") || "Show all {n} replies").replace(
    "{n}",
    String(comments.length),
  );

  return (
    <div className="mt-3 rounded-xl border border-border/60 bg-muted/20 p-2.5 space-y-2">
      {comments.length > 0 && (
        <>
          <div className="flex items-center gap-1.5 px-0.5">
            <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              {t("diaryThreadReplies") || "Conversation"} · {comments.length}
            </span>
          </div>

          {hiddenCount > 0 && !expanded && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="w-full text-[11px] font-semibold text-primary hover:underline py-0.5"
            >
              {showAllLabel}
            </button>
          )}

          <div className="space-y-2">
            {visible.map((comment) => {
              const isOwner = currentUserId === comment.coach_id;
              const fromAthlete = comment.author_role === "athlete";
              const authorLabel = isOwner
                ? t("diaryThreadYou") || "You"
                : comment.coach_name || t("coach");
              return (
                <div
                  key={comment.id}
                  className={cn(
                    "rounded-lg border px-3 py-2.5",
                    fromAthlete
                      ? "border-border/50 bg-background/70 sm:ml-6"
                      : "border-primary/25 bg-accent/40 sm:mr-6",
                  )}
                >
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span
                      className={cn(
                        "text-xs font-semibold truncate",
                        fromAthlete ? "text-foreground" : "text-primary",
                      )}
                    >
                      {authorLabel}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString(undefined, {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="whitespace-pre-line break-words text-sm text-foreground leading-relaxed">
                    {comment.content}
                  </p>

                  {(canComment || isOwner) && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {/* Shared badge — only shown for coach notes */}
                      {canComment && !fromAthlete && (
                        isOwner ? (
                          <button
                            onClick={() => handleToggleShared(comment)}
                            className={`text-[9px] uppercase tracking-wide font-semibold rounded-full px-1.5 py-0.5 flex items-center gap-1 border transition-colors ${
                              comment.is_shared
                                ? "text-primary bg-primary/10 border-primary/30 hover:bg-primary/20"
                                : "text-muted-foreground bg-muted border-border hover:bg-accent"
                            }`}
                            title={comment.is_shared ? t("shareWithClubCoaches") : t("onlyVisibleToYouAndAthlete")}
                          >
                            {comment.is_shared ? <Users className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
                            {comment.is_shared ? t("sharedInClub") : t("onlyVisibleToYouAndAthlete")}
                          </button>
                        ) : (
                          <span className="text-[9px] uppercase tracking-wide font-semibold text-primary bg-primary/10 border border-primary/30 rounded-full px-1.5 py-0.5 flex items-center gap-1">
                            <Users className="h-2.5 w-2.5" /> {t("sharedInClub")}
                          </span>
                        )
                      )}
                      {isOwner && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="ml-auto text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {canReply && (
        <div className="space-y-1.5 relative">
          <div className="flex gap-2 items-end">
            <div className="relative flex-1">
              <Textarea
                ref={textareaRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={
                  canComment
                    ? t("coachCommentPlaceholder") || "Write a comment..."
                    : t("diaryThreadReplyPlaceholder") || "Write a reply..."
                }
                rows={1}
                maxLength={2000}
                className="resize-none text-base md:text-xs min-h-[40px] py-2 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 bottom-1 h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setShowEmoji((s) => !s)}
                aria-label={t("iconHintEmoji")} title={t("iconHintEmoji")}
              >
                <Smile className="h-4 w-4" />
              </Button>
              {showEmoji && (
                <div data-emoji-picker className="absolute bottom-full right-0 mb-2 z-20 flex flex-wrap gap-1 p-2 bg-card border border-border rounded-lg shadow-lg max-w-[260px]">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => {
                        setNewComment((b) => b + e);
                        setShowEmoji(false);
                        textareaRef.current?.focus();
                      }}
                      className="h-9 w-9 text-lg hover:bg-muted rounded flex items-center justify-center"
                      aria-label={`Emoji ${e}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSubmit}
              disabled={submitting || !newComment.trim()}
              className={cn("shrink-0 h-9 w-9", newComment.trim() && "text-primary")}
              aria-label={t("iconHintSend")} title={t("iconHintSend")}
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </Button>
          </div>
          {canComment && (
            <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer select-none">
              <Switch checked={shareNew} onCheckedChange={setShareNew} className="scale-75 origin-left" />
              <span className="flex items-center gap-1">
                {shareNew ? <Users className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {shareNew ? t("shareWithClubCoaches") : t("onlyVisibleToYouAndAthlete")}
              </span>
            </label>
          )}
        </div>
      )}
    </div>
  );
}
