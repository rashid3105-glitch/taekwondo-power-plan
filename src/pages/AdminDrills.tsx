import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Pencil, Trash2, Globe2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

const CATEGORIES = ["kicks", "combinations", "footwork", "taegeuk", "poomse", "sparring", "conditioning"] as const;
type DrillCategory = (typeof CATEGORIES)[number];

const CATEGORY_LABEL_KEY: Record<DrillCategory, TranslationKey> = {
  kicks: "drillCatKicks",
  combinations: "drillCatCombinations",
  footwork: "drillCatFootwork",
  taegeuk: "drillCatTaegeuk",
  poomse: "drillCatPoomse",
  sparring: "drillCatSparring",
  conditioning: "drillCatConditioning",
};

interface Drill {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  category: DrillCategory;
  club_id: string | null;
  sort_order: number;
  is_active: boolean;
}

interface Club {
  id: string;
  name: string;
}

interface FormState {
  id?: string;
  title: string;
  description: string;
  video_url: string;
  category: DrillCategory;
  club_id: string; // "" = global
  sort_order: number;
  is_active: boolean;
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  video_url: "",
  category: "kicks",
  club_id: "",
  sort_order: 0,
  is_active: true,
};

export default function AdminDrills() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [drills, setDrills] = useState<Drill[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: isAdmin } = await (supabase.rpc as any)("is_admin", { _user_id: user.id });
      if (!isAdmin) { setAuthorized(false); return; }
      setAuthorized(true);
      await Promise.all([load(), loadClubs()]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("taekwondo_drills")
      .select("id,title,description,video_url,category,club_id,sort_order,is_active")
      .order("club_id", { ascending: true, nullsFirst: true })
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true });
    if (error) toast.error(error.message);
    else setDrills((data as Drill[]) || []);
    setLoading(false);
  };

  const loadClubs = async () => {
    const { data } = await supabase.from("clubs").select("id,name").order("name");
    setClubs((data as Club[]) || []);
  };

  const openNew = () => {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (d: Drill) => {
    setForm({
      id: d.id,
      title: d.title,
      description: d.description ?? "",
      video_url: d.video_url ?? "",
      category: d.category,
      club_id: d.club_id ?? "",
      sort_order: d.sort_order,
      is_active: d.is_active,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error("Title required"); return; }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      video_url: form.video_url.trim() || null,
      category: form.category,
      club_id: form.club_id || null,
      sort_order: form.sort_order,
      is_active: form.is_active,
    };
    try {
      if (form.id) {
        const { error } = await (supabase as any).from("taekwondo_drills").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await (supabase as any).from("taekwondo_drills").insert({ ...payload, created_by: user?.id });
        if (error) throw error;
      }
      toast.success("Saved");
      setDialogOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (d: Drill) => {
    if (!confirm(`Delete "${d.title}"?`)) return;
    const { error } = await (supabase as any).from("taekwondo_drills").delete().eq("id", d.id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); setDrills((prev) => prev.filter((x) => x.id !== d.id)); }
  };

  if (authorized === false) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Not authorized</div>;
  }
  if (authorized === null) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const clubName = (id: string | null) => id ? (clubs.find((c) => c.id === id)?.name ?? "—") : t("adminDrillScopeGlobal");

  const getYouTubeId = (url: string): string | null => {
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || null;
      if (u.hostname.includes("youtube.com")) {
        if (u.pathname === "/watch") return u.searchParams.get("v");
        const m = u.pathname.match(/^\/(embed|shorts|v)\/([^/?#]+)/);
        if (m) return m[2];
      }
    } catch { /* ignore */ }
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 pt-safe">
        <div className="container max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-base font-extrabold text-card-foreground flex-1">{t("adminDrillsTitle")}</span>
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" /> {t("adminDrillsNew")}
          </Button>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-6 space-y-3">
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : drills.length === 0 ? (
          <p className="text-muted-foreground text-sm">No drills yet.</p>
        ) : (
          drills.map((d) => {
            const ytId = d.video_url ? getYouTubeId(d.video_url) : null;
            return (
              <Card key={d.id} className="p-3 flex items-center gap-3">
                {ytId ? (
                  <div className="shrink-0 w-40 aspect-video rounded overflow-hidden bg-black">
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}`}
                      title={d.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : null}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {d.club_id === null && (
                      <Badge variant="secondary" className="gap-1">
                        <Globe2 className="h-3 w-3" /> {t("adminDrillScopeGlobal")}
                      </Badge>
                    )}
                    <span className="font-semibold text-card-foreground truncate">{d.title}</span>
                    {!d.is_active && <Badge variant="outline">Inactive</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
                    <span>{t(CATEGORY_LABEL_KEY[d.category])}</span>
                    <span>·</span>
                    <span>{clubName(d.club_id)}</span>
                    <span>·</span>
                    <span>#{d.sort_order}</span>
                    {d.video_url && !ytId && (<><span>·</span><a href={d.video_url} target="_blank" rel="noopener noreferrer" className="underline truncate max-w-[200px]">Video</a></>)}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(d)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </Card>
            );
          })
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? t("adminDrillsEdit") : t("adminDrillsNew")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label>Video URL (YouTube)</Label>
              <Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as DrillCategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{t(CATEGORY_LABEL_KEY[c])}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sort order</Label>
                <Input type="number" inputMode="numeric" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value || "0", 10) })} />
              </div>
            </div>
            <div>
              <Label>Club</Label>
              <Select value={form.club_id || "__global__"} onValueChange={(v) => setForm({ ...form, club_id: v === "__global__" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__global__">{t("adminDrillScopeGlobal")}</SelectItem>
                  {clubs.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Active</Label>
              <Switch id="is_active" checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
