import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ImagePlus, Loader2, Trash2, ArrowUp, ArrowDown, Crop } from "lucide-react";
import { ImageCropDialog, CROP_OUTPUT_PX } from "@/components/admin/ImageCropDialog";

const MAX_IMAGES = 5;

interface HeroImage {
  id: string;
  url: string;
  storage_path: string | null;
  alt: string | null;
  sort_order: number;
  active: boolean;
}

export default function AdminHeroImages() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<HeroImage[]>([]);
  const [cropSource, setCropSource] = useState<File | string | null>(null);
  const [cropTarget, setCropTarget] = useState<HeroImage | null>(null);


  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: adminCheck } = await supabase.rpc("is_admin", { _user_id: user.id });
      if (!adminCheck) { navigate("/dashboard"); return; }
      setReady(true);
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("landing_hero_images" as any)
      .select("id, url, storage_path, alt, sort_order, active")
      .order("sort_order");
    if (error) toast({ title: "Fejl", description: error.message, variant: "destructive" });
    else setImages((data as unknown as HeroImage[]) ?? []);
    setLoading(false);
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (images.length >= MAX_IMAGES) {
      toast({ title: "Maks. 5 billeder", description: "Slet et billede før du tilføjer et nyt.", variant: "destructive" });
      return;
    }
    setCropTarget(null);
    setCropSource(file);
  };

  const uploadBlob = async (blob: Blob) => {
    const path = `${crypto.randomUUID()}.webp`;
    const { error: upErr } = await supabase.storage
      .from("landing-hero")
      .upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
    if (upErr) throw upErr;
    const { data: pub } = supabase.storage.from("landing-hero").getPublicUrl(path);
    return { path, url: pub.publicUrl };
  };

  const onCropped = async (blob: Blob) => {
    setUploading(true);
    try {
      const { path, url } = await uploadBlob(blob);
      if (cropTarget) {
        const { error } = await supabase
          .from("landing_hero_images" as any)
          .update({ url, storage_path: path } as any)
          .eq("id", cropTarget.id);
        if (error) throw error;
        if (cropTarget.storage_path) {
          await supabase.storage.from("landing-hero").remove([cropTarget.storage_path]);
        }
        toast({ title: "Billede beskåret" });
      } else {
        const name = typeof cropSource === "object" && cropSource
          ? (cropSource as File).name.replace(/\.[^.]+$/, "")
          : "";
        const { error } = await supabase.from("landing_hero_images" as any).insert({
          url,
          storage_path: path,
          alt: name,
          sort_order: images.length,
          active: true,
        } as any);
        if (error) throw error;
        toast({ title: "Billede uploadet" });
      }
      setCropSource(null);
      setCropTarget(null);
      await load();
    } catch (err: any) {
      toast({ title: "Upload fejlede", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };


  const patch = async (id: string, values: Partial<HeroImage>) => {
    setImages((list) => list.map((i) => (i.id === id ? { ...i, ...values } : i)));
    const { error } = await supabase.from("landing_hero_images" as any).update(values as any).eq("id", id);
    if (error) toast({ title: "Fejl", description: error.message, variant: "destructive" });
  };

  const move = async (id: string, dir: -1 | 1) => {
    const idx = images.findIndex((i) => i.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= images.length) return;
    const next = [...images];
    [next[idx], next[target]] = [next[target], next[idx]];
    setImages(next.map((i, n) => ({ ...i, sort_order: n })));
    await Promise.all(
      next.map((img, n) =>
        supabase.from("landing_hero_images" as any).update({ sort_order: n } as any).eq("id", img.id)
      )
    );
  };

  const remove = async (img: HeroImage) => {
    if (!confirm("Slet dette billede?")) return;
    if (img.storage_path) await supabase.storage.from("landing-hero").remove([img.storage_path]);
    const { error } = await supabase.from("landing_hero_images" as any).delete().eq("id", img.id);
    if (error) toast({ title: "Fejl", description: error.message, variant: "destructive" });
    else { toast({ title: "Billede slettet" }); await load(); }
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 -ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Tilbage
        </Button>

        <h1 className="text-2xl font-black tracking-tight text-foreground">Forsidebilleder</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Op til {MAX_IMAGES} billeder i hero-feltet på forsiden. Vises som slideshow når der er flere end ét.
          Billeder konverteres automatisk til WebP og skaleres til maks. {MAX_EDGE}px, så siden forbliver hurtig.
          Brug gerne kvadratiske motiver (1:1).
        </p>

        <div className="mt-5 flex items-center gap-3">
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPick} />
          <Button onClick={() => fileRef.current?.click()} disabled={uploading || images.length >= MAX_IMAGES}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
            Tilføj billede
          </Button>
          <span className="text-xs text-muted-foreground">{images.length} / {MAX_IMAGES}</span>
        </div>

        {loading ? (
          <div className="mt-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : images.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">
            Ingen billeder endnu — forsiden viser standardbilledet.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {images.map((img, i) => (
              <li key={img.id} className="flex gap-4 rounded-xl border border-border bg-card p-3">
                <img src={img.url} alt={img.alt ?? ""} className="h-24 w-24 flex-shrink-0 rounded-lg object-cover" />
                <div className="flex-1 space-y-2">
                  <Input
                    value={img.alt ?? ""}
                    placeholder="Alt-tekst (SEO / tilgængelighed)"
                    onChange={(e) => setImages((l) => l.map((x) => (x.id === img.id ? { ...x, alt: e.target.value } : x)))}
                    onBlur={(e) => patch(img.id, { alt: e.target.value })}
                  />
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Switch checked={img.active} onCheckedChange={(v) => patch(img.id, { active: v })} />
                      Vist på forsiden
                    </label>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={i === 0} onClick={() => move(img.id, -1)}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={i === images.length - 1} onClick={() => move(img.id, 1)}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(img)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
