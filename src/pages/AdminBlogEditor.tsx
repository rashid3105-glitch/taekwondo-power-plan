import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Upload, X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/blog/RichTextEditor";
import {
  createPost, updatePost, getPostById, uploadBlogImage, slugify, sanitizeHtml,
  type BlogLocale, type BlogPost,
} from "@/lib/blogApi";

export default function AdminBlogEditor() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isNew = !id;

  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [locale, setLocale] = useState<BlogLocale>("da");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [publishedAt, setPublishedAt] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [translationGroupId, setTranslationGroupId] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: isAdmin } = await (supabase.rpc as any)("is_admin", { _user_id: user.id });
      if (!isAdmin) { setAuthorized(false); return; }
      setAuthorized(true);
      if (id) await loadPost(id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadPost = async (postId: string) => {
    try {
      const p = await getPostById(postId);
      if (!p) { toast.error("Post not found"); navigate("/admin/blog"); return; }
      setLocale(p.locale);
      setTitle(p.title);
      setSlug(p.slug);
      setSlugTouched(true);
      setExcerpt(p.excerpt || "");
      setContent(p.content_html);
      setCoverUrl(p.cover_image_url);
      setStatus(p.status);
      setPublishedAt(p.published_at ? p.published_at.slice(0, 16) : "");
      setExpiresAt(p.expires_at ? p.expires_at.slice(0, 16) : "");
      setTranslationGroupId(p.translation_group_id);
    } catch (e: any) {
      toast.error(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    try {
      const url = await uploadBlogImage(file);
      setCoverUrl(url);
      toast.success("Cover uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploadingCover(false);
    }
  };

  const onSave = async () => {
    if (!title.trim()) { toast.error("Title required"); return; }
    if (!slug.trim()) { toast.error("Slug required"); return; }

    setSaving(true);
    try {
      const payload: Partial<BlogPost> = {
        locale,
        slug: slug.trim(),
        title: title.trim(),
        excerpt: excerpt.trim() || null,
        content_html: content,
        cover_image_url: coverUrl,
        status,
        published_at: status === "published"
          ? (publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString())
          : (publishedAt ? new Date(publishedAt).toISOString() : null),
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      };
      if (translationGroupId) payload.translation_group_id = translationGroupId;

      if (isNew) {
        const { data: { user } } = await supabase.auth.getUser();
        payload.author_id = user?.id;
        const created = await createPost(payload);
        toast.success("Post created");
        navigate(`/admin/blog/${created.id}/edit`, { replace: true });
      } else {
        await updatePost(id!, payload);
        toast.success("Saved");
      }
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (authorized === false) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Access denied</h1>
        <Button onClick={() => navigate("/dashboard")}>Back</Button>
      </div>
    );
  }

  if (loading) {
    return <div className="container py-12 text-center text-muted-foreground">Loading…</div>;
  }

  const goldBtn = "bg-amber-400 text-black hover:bg-amber-300 border-amber-400";
  const goldOutline = "bg-transparent text-amber-400 border border-amber-400 hover:bg-amber-400 hover:text-black";
  const inputDark = "mt-1 bg-black border-zinc-700 text-white placeholder:text-zinc-500";

  return (
    <div className="dark min-h-screen bg-black text-white">
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/blog")} className="text-white hover:bg-white/10 hover:text-amber-400">
            <ArrowLeft className="h-4 w-4 mr-1" /> All posts
          </Button>
          <Button onClick={onSave} disabled={saving} className={goldBtn}>
            <Save className="h-4 w-4 mr-1" /> {saving ? "Saving…" : "Save"}
          </Button>
        </div>

        <h1 className="text-2xl font-extrabold text-white">{isNew ? "New blog post" : "Edit post"}</h1>

        <Card className="p-5 space-y-5 bg-zinc-900 border-zinc-800 text-white">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-white">Language</Label>
              <div className="flex gap-2 mt-2">
                {(["da", "en"] as const).map((l) => (
                  <Button
                    key={l}
                    type="button"
                    size="sm"
                    className={locale === l ? goldBtn : goldOutline}
                    onClick={() => setLocale(l)}
                  >
                    {l.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-7">
              <Label htmlFor="status-switch" className="text-sm text-white">
                {status === "published" ? "Published" : "Draft"}
              </Label>
              <Switch
                id="status-switch"
                checked={status === "published"}
                onCheckedChange={(c) => setStatus(c ? "published" : "draft")}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="title" className="text-white">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder={locale === "da" ? "Min blog titel" : "My blog title"}
              className={inputDark}
            />
          </div>

          <div>
            <Label htmlFor="slug" className="text-white">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }}
              placeholder="my-blog-post"
              className={`${inputDark} font-mono text-sm`}
            />
            <p className="text-xs text-zinc-400 mt-1">URL: /blog/{slug || "your-slug"}</p>
          </div>

          <div>
            <Label htmlFor="excerpt" className="text-white">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder={locale === "da" ? "Kort beskrivelse (1-2 sætninger)" : "Short summary (1-2 sentences)"}
              rows={2}
              className={inputDark}
            />
          </div>

          <div>
            <Label className="text-white">Cover image</Label>

            {coverUrl ? (
              <div className="mt-2 relative inline-block">
                <img src={coverUrl} alt="" className="rounded-lg max-h-48 object-cover" />
                <button
                  onClick={() => setCoverUrl(null)}
                  className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                  aria-label="Remove cover"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="mt-2 flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-border bg-muted/30 p-6 hover:bg-muted/50 transition">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {uploadingCover ? "Uploading…" : "Click to upload cover image"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleCoverUpload(f);
                  }}
                />
              </label>
            )}
          </div>

          <div>
            <Label className="text-white">Content</Label>
            <div className="mt-2">
              <RichTextEditor value={content} onChange={setContent} onImageUpload={uploadBlogImage} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="published-at" className="text-white">Publish date (optional)</Label>
              <Input
                id="published-at"
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className={inputDark}
              />
              <p className="text-xs text-zinc-400 mt-1">Leave empty to publish immediately when status is set to Published.</p>
            </div>
            <div>
              <Label htmlFor="expires-at" className="text-white">Expires (optional)</Label>
              <Input
                id="expires-at"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className={inputDark}
              />
              <p className="text-xs text-zinc-400 mt-1">Post will be hidden after this date.</p>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={saving} size="lg" className={goldBtn}>
            <Save className="h-4 w-4 mr-1" /> {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
