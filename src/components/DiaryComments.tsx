import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { MessageSquare, Send, Trash2, Loader2, Users, Lock } from "lucide-react";

interface DiaryComment {
  id: string;
  diary_entry_id: string;
  coach_id: string;
  content: string;
  created_at: string;
  is_shared: boolean;
  coach_name?: string;
}

interface DiaryCommentsProps {
  entryId: string;
  /** If true, show comment input (coach mode) */
  canComment?: boolean;
}

export function DiaryComments({ entryId, canComment = false }: DiaryCommentsProps) {
  const [comments, setComments] = useState<DiaryComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [shareNew, setShareNew] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    loadComments();
  }, [entryId]);

  const loadComments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    const { data, error } = await supabase
      .from("diary_comments" as any)
      .select("*")
      .eq("diary_entry_id", entryId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      const coachIds = [...new Set((data as any[]).map((c: any) => c.coach_id))];
      let coachNames: Record<string, string> = {};
      if (coachIds.length > 0) {
        const { data: profiles } = await supabase
          .from("club_directory" as any)
          .select("user_id, display_name")
          .in("user_id", coachIds);
        if (profiles) {
          coachNames = Object.fromEntries(profiles.map((p: any) => [p.user_id, p.display_name]));
        }
      }

      const mappedComments = (data as any[]).map((c: any) => ({
        ...c,
        is_shared: c.is_shared ?? true,
        coach_name: coachNames[c.coach_id] || t("coach"),
      }));
      setComments(mappedComments);

      if (!canComment && user) {
        const unreadIds = (data as any[]).filter((c: any) => !c.is_read).map((c: any) => c.id);
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

    const { error } = await supabase.from("diary_comments" as any).insert({
      diary_entry_id: entryId,
      coach_id: user.id,
      content: newComment.trim().slice(0, 2000),
      is_shared: shareNew,
    } as any);

    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    } else {
      try {
        const { data: entry } = await supabase.from("diary_entries").select("user_id").eq("id", entryId).maybeSingle();
        if (entry?.user_id && entry.user_id !== user.id) {
          void supabase.functions.invoke("send-push", {
            body: { user_ids: [entry.user_id], title: "💬 New coach comment", body: newComment.trim().slice(0, 100), url: "/diary", category: "diary" },
          });
        }
      } catch {}
      setNewComment("");
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

  if (comments.length === 0 && !canComment) return null;

  return (
    <div className="space-y-2">
      {comments.length > 0 && (
        <div className="space-y-1.5">
          {comments.map((comment) => {
            const isOwner = currentUserId === comment.coach_id;
            return (
              <div key={comment.id} className="flex items-start gap-2 rounded-md bg-accent/50 px-2.5 py-2">
                <MessageSquare className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold text-primary">{comment.coach_name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString(undefined, {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                    {/* Shared badge — clickable for owner, static for others (only visible to coaches) */}
                    {canComment && (
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
                  <p className="text-xs text-foreground leading-relaxed">{comment.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {canComment && (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t("coachCommentPlaceholder") || "Write a comment..."}
              rows={1}
              maxLength={2000}
              className="resize-none text-xs min-h-[36px] py-2"
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSubmit}
              disabled={submitting || !newComment.trim()}
              className="shrink-0 h-9 w-9"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer select-none">
            <Switch checked={shareNew} onCheckedChange={setShareNew} className="scale-75 origin-left" />
            <span className="flex items-center gap-1">
              {shareNew ? <Users className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {shareNew ? t("shareWithClubCoaches") : t("onlyVisibleToYouAndAthlete")}
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
