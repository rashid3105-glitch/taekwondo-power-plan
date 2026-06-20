import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface PendingComment {
  id: string;
  post_id: string;
  author_name: string;
  author_email: string;
  content: string;
  status: string;
  verified_at: string | null;
  created_at: string;
  blog_posts?: { title: string; slug: string; locale: string } | null;
}

export default function AdminBlogComments() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending_approval" | "approved" | "rejected" | "all">("pending_approval");
  const [comments, setComments] = useState<PendingComment[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: isAdmin } = await (supabase.rpc as any)("is_admin", { _user_id: user.id });
      if (!isAdmin) { setAuthorized(false); return; }
      setAuthorized(true);
      await load("pending_approval");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async (status: typeof filter) => {
    setLoading(true);
    setFilter(status);
    try {
      let query = (supabase.from as any)("blog_comments")
        .select("id, post_id, author_name, author_email, content, status, verified_at, created_at, blog_posts(title, slug, locale)")
        .order("created_at", { ascending: false });
      if (status !== "all") query = query.eq("status", status);
      const { data, error } = await query;
      if (error) throw error;
      setComments((data || []) as PendingComment[]);
    } catch (e: any) {
      toast.error(e.message || "Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id: string) => {
    const { error } = await (supabase.from as any)("blog_comments")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Comment approved");
    setComments((c) => c.filter((x) => x.id !== id));
  };

  const reject = async (id: string) => {
    const { error } = await (supabase.from as any)("blog_comments")
      .update({ status: "rejected" })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Comment rejected");
    setComments((c) => c.filter((x) => x.id !== id));
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this comment permanently?")) return;
    const { error } = await (supabase.from as any)("blog_comments").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    setComments((c) => c.filter((x) => x.id !== id));
  };

  if (authorized === false) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Access denied</h1>
        <Button onClick={() => navigate("/dashboard")}>Back</Button>
      </div>
    );
  }

  const filters: { key: typeof filter; label: string }[] = [
    { key: "pending_approval", label: "Pending approval" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/blog")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Admin blog
            </Button>
            <h1 className="text-2xl font-extrabold">Blog comments</h1>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? "default" : "outline"}
              onClick={() => load(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading…</div>
        ) : comments.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">No comments in this view.</Card>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <Card key={c.id} className="p-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                  <Badge variant="outline">{c.status}</Badge>
                  {c.blog_posts && (
                    <>
                      <span>·</span>
                      <span className="font-medium truncate max-w-[260px]">{c.blog_posts.title}</span>
                      <Badge variant="secondary" className="text-[10px] uppercase">{c.blog_posts.locale}</Badge>
                    </>
                  )}
                  <span>·</span>
                  <span>{new Date(c.created_at).toLocaleString()}</span>
                </div>

                <div>
                  <div className="font-semibold text-sm">{c.author_name}</div>
                  <div className="text-xs text-muted-foreground">{c.author_email}</div>
                </div>

                <p className="text-sm whitespace-pre-wrap">{c.content}</p>

                <div className="flex gap-2 flex-wrap">
                  {c.status !== "approved" && (
                    <Button size="sm" onClick={() => approve(c.id)}>
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                  )}
                  {c.status !== "rejected" && (
                    <Button size="sm" variant="outline" onClick={() => reject(c.id)}>
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove(c.id)}>
                    <Trash2 className="h-4 w-4 mr-1 text-destructive" /> Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
