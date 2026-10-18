import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Camera, RotateCcw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { ImageCropDialog } from "@/components/admin/ImageCropDialog";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";

// Shared cache of slot -> override url, loaded once per page session.
type Row = { slot: string; url: string; storage_path: string | null };
let cache: Promise<Record<string, Row>> | null = null;
const listeners = new Set<() => void>();
const loadSlots = () => {
  if (!cache) {
    cache = (async () => {
      const { data } = await supabase.from("site_image_slots").select("slot, url, storage_path");
      return Object.fromEntries((data ?? []).map((r) => [r.slot, r as Row]));
    })();
  }
  return cache;
};
const refresh = () => { cache = null; listeners.forEach((l) => l()); };

const L: Record<string, { change: string; reset: string; confirm: string; saved: string; failed: string }> = {
  da: { change: "Skift billede", reset: "Nulstil", confirm: "Gå tilbage til standardbilledet?", saved: "Billede opdateret", failed: "Upload fejlede" },
  en: { change: "Change image", reset: "Reset", confirm: "Revert to the default image?", saved: "Image updated", failed: "Upload failed" },
  sv: { change: "Byt bild", reset: "Återställ", confirm: "Återgå till standardbilden?", saved: "Bild uppdaterad", failed: "Uppladdning misslyckades" },
  de: { change: "Bild ändern", reset: "Zurücksetzen", confirm: "Zum Standardbild zurückkehren?", saved: "Bild aktualisiert", failed: "Upload fehlgeschlagen" },
  ar: { change: "تغيير الصورة", reset: "إعادة تعيين", confirm: "العودة إلى الصورة الافتراضية؟", saved: "تم تحديث الصورة", failed: "فشل الرفع" },
  no: { change: "Bytt bilde", reset: "Tilbakestill", confirm: "Gå tilbake til standardbildet?", saved: "Bilde oppdatert", failed: "Opplasting feilet" },
  es: { change: "Cambiar imagen", reset: "Restablecer", confirm: "¿Volver a la imagen predeterminada?", saved: "Imagen actualizada", failed: "Error al subir" },
};

interface Props {
  slot: string;
  fallback?: string;
  alt?: string;
  style?: CSSProperties;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  /** Rendered when there is neither an override nor a fallback. */
  placeholder?: React.ReactNode;
}

export function EditableImage({ slot, fallback, alt = "", style, width, height, loading, placeholder }: Props) {
  const { isAdmin } = useIsAdmin();
  const { locale } = useLanguage();
  const t = L[locale] ?? L.en;
  const [row, setRow] = useState<Row | null>(null);
  const [source, setSource] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    const run = () => loadSlots().then((m) => alive && setRow(m[slot] ?? null));
    run();
    listeners.add(run);
    return () => { alive = false; listeners.delete(run); };
  }, [slot]);

  const onCropped = async (blob: Blob) => {
    setBusy(true);
    try {
      const path = `slots/${slot}-${crypto.randomUUID()}.webp`;
      const { error: upErr } = await supabase.storage.from("landing-hero").upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
      if (upErr) throw upErr;
      const url = supabase.storage.from("landing-hero").getPublicUrl(path).data.publicUrl;
      const { error } = await supabase.from("site_image_slots").upsert({ slot, url, storage_path: path, updated_at: new Date().toISOString() });
      if (error) throw error;
      if (row?.storage_path) await supabase.storage.from("landing-hero").remove([row.storage_path]);
      setSource(null);
      toast.success(t.saved);
      refresh();
    } catch (e: any) {
      toast.error(t.failed, { description: e.message });
    } finally {
      setBusy(false);
    }
  };

  const onReset = async () => {
    if (!row || !confirm(t.confirm)) return;
    setBusy(true);
    await supabase.from("site_image_slots").delete().eq("slot", slot);
    if (row.storage_path) await supabase.storage.from("landing-hero").remove([row.storage_path]);
    setBusy(false);
    refresh();
  };

  const src = row?.url ?? fallback;
  const btn: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 999, border: "none", background: "rgba(15,23,42,0.82)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" };

  return (
    <div style={{ position: "relative" }}>
      {src ? <img src={src} alt={alt} width={width} height={height} loading={loading} style={style} /> : placeholder}
      {isAdmin && (
        <div style={{ position: "absolute", top: 10, insetInlineEnd: 10, display: "flex", gap: 6, zIndex: 2 }}>
          <button type="button" style={btn} onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}{t.change}
          </button>
          {row && (
            <button type="button" style={btn} onClick={onReset} disabled={busy} title={t.reset}><RotateCcw size={14} /></button>
          )}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) setSource(f); }} />
        </div>
      )}
      <ImageCropDialog open={!!source} source={source} onCancel={() => setSource(null)} onCropped={onCropped} />
    </div>
  );
}
