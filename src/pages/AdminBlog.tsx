import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Pencil, Trash2, Eye, EyeOff, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { listAllPostsAdmin, deletePost, type BlogPost } from "@/lib/blogApi";

export default function AdminBlog() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [pendingComments, setPendingComments] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: isAdmin } = await (supabase.rpc as any)("is_admin", { _user_id: user.id });
      if (!isAdmin) {
        setAuthorized(false);
        return;
      }
      setAuthorized(true);
      await load();
      const { count } = await (supabase.from as any)("blog_comments")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_approval");
      setPendingComments(count || 0);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listAllPostsAdmin();
      setPosts(data);
    } catch (e: any) {
      toast.error(e.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deletePost(id);
      toast.success("Post deleted");
      setPosts((p) => p.filter((x) => x.id !== id));
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  if (authorized === false) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Access denied</h1>
        <p className="text-muted-foreground mb-6">You must be an administrator to manage the blog.</p>
        <Button onClick={() => navigate("/dashboard")}>Back to dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/approval")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Admin
            </Button>
            <h1 className="text-2xl font-extrabold">Blog</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => navigate("/admin/blog/comments")}>
              <MessageSquare className="h-4 w-4 mr-1" /> Comments
              {pendingComments > 0 && (
                <Badge className="ml-2 bg-amber-500 hover:bg-amber-500 text-black">{pendingComments}</Badge>
              )}
            </Button>
            <Button onClick={() => navigate("/admin/blog/new")}>
              <Plus className="h-4 w-4 mr-1" /> New post
            </Button>
          </div>
        </div>


        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading…</div>
        ) : posts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No blog posts yet.</p>
            <Button onClick={() => navigate("/admin/blog/new")}>
              <Plus className="h-4 w-4 mr-1" /> Create your first post
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {posts.map((p) => {
              const expired = p.expires_at && new Date(p.expires_at) < new Date();
              return (
                <Card key={p.id} className="p-4 flex items-center gap-4">
                  {p.cover_image_url ? (
                    <img src={p.cover_image_url} alt="" className="h-14 w-20 object-cover rounded-md flex-shrink-0" />
                  ) : (
                    <div className="h-14 w-20 rounded-md bg-muted flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{p.title}</h3>
                      <Badge variant="outline" className="text-[10px] uppercase">{p.locale}</Badge>
                      {p.status === "published" ? (
                        <Badge className="text-[10px] bg-green-600 hover:bg-green-600"><Eye className="h-3 w-3 mr-1" />Live</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]"><EyeOff className="h-3 w-3 mr-1" />Draft</Badge>
                      )}
                      {expired && <Badge variant="destructive" className="text-[10px]">Expired</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      /{p.slug}
                      {p.published_at && ` · published ${new Date(p.published_at).toLocaleDateString()}`}
                      {p.expires_at && ` · expires ${new Date(p.expires_at).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/blog/${p.id}/edit`)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(p.id, p.title)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
