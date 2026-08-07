import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { ChevronDown, ChevronRight, Loader2, Palette, Trash2, Upload } from "lucide-react";
import { ImageCropDialog } from "@/components/admin/ImageCropDialog";
import {
  COCKPIT_BG,
  DEFAULT_ACCENT,
  DEFAULT_BACKGROUND,
  DEFAULT_PRIMARY,
  deriveSurfaces,
  contrastRatio,
  isValidHex,
} from "@/lib/clubTheme";

interface Props {
  clubId: string;
  clubName: string;
  /** Whether the branding add-on is switched on for this club. */
  enabled: boolean;
}

/**
 * Admin editor for a club's logo and two theme colours.
 * Only rendered when the "branding" add-on is active for the club.
 */
export function ClubBrandingSection({ clubId, clubName, enabled }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primary, setPrimary] = useState(DEFAULT_PRIMARY);
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  const [background, setBackground] = useState(DEFAULT_BACKGROUND);
  const [cropSource, setCropSource] = useState<File | null>(null);

  useEffect(() => {
    if (!open || loaded) return;
    (async () => {
      const { data } = await supabase
        .from("clubs" as any)
        .select("logo_url, primary_color, accent_color, background_color")
        .eq("id", clubId)
        .maybeSingle();
      const c = data as any;
      setLogoUrl(c?.logo_url ?? null);
      setPrimary(c?.primary_color || DEFAULT_PRIMARY);
      setAccent(c?.accent_color || DEFAULT_ACCENT);
      setBackground(c?.background_color || DEFAULT_BACKGROUND);
      setLoaded(true);
    })();
  }, [open, loaded, clubId]);

  if (!enabled) return null;

  const primaryOk = isValidHex(primary);
  const accentOk = isValidHex(accent);
  const backgroundOk = isValidHex(background);
  const previewBg = backgroundOk ? background : COCKPIT_BG;
  const surfaces = deriveSurfaces(previewBg);
  const previewText = `hsl(${surfaces.foreground})`;
  const previewMuted = `hsl(${surfaces.mutedForeground})`;
  const contrast = primaryOk ? contrastRatio(primary, previewBg) : 0;
  const lowContrast = primaryOk && contrast < 3;

  const uploadLogo = async (blob: Blob) => {
    setUploading(true);
    try {
      const path = `${clubId}/logo-${Date.now()}.webp`;
      const { error } = await supabase.storage
        .from("club-logos")
        .upload(path, blob, { contentType: "image/webp", upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("club-logos").getPublicUrl(path);
      setLogoUrl(data.publicUrl);
      toast({ title: t("brandingLogoUploaded") });
    } catch (e: any) {
      toast({ title: t("error"), description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
      setCropSource(null);
    }
  };

  const save = async () => {
    if (!primaryOk || !accentOk || !backgroundOk) {
      toast({ title: t("brandingInvalidHex"), variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("clubs" as any)
        .update({
          logo_url: logoUrl,
          primary_color: primary,
          accent_color: accent,
          background_color: background,
        } as any)
        .eq("id", clubId);
      if (error) throw error;
      toast({ title: t("brandingSaved") });
    } catch (e: any) {
      toast({ title: t("error"), description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = () => {
    setPrimary(DEFAULT_PRIMARY);
    setAccent(DEFAULT_ACCENT);
    setBackground(DEFAULT_BACKGROUND);
  };

  return (
    <div className="border-t border-border pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-card-foreground">
          <Palette className="h-4 w-4 text-primary" />
          {t("brandingTitle")}
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-4">
          {!loaded ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <>
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 shrink-0 rounded-md border border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt={`${clubName} logo`} className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">{t("brandingNoLogo")}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-1" />
                      )}
                      {t("brandingUploadLogo")}
                    </Button>
                    {logoUrl && (
                      <Button size="sm" variant="ghost" onClick={() => setLogoUrl(null)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        {t("remove") || "Remove"}
                      </Button>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{t("brandingLogoHint")}</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    if (f.size > 2 * 1024 * 1024) {
                      toast({ title: t("brandingLogoTooLarge"), variant: "destructive" });
                      return;
                    }
                    setCropSource(f);
                  }}
                />
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { label: t("brandingPrimary"), value: primary, set: setPrimary, ok: primaryOk },
                  { label: t("brandingAccent"), value: accent, set: setAccent, ok: accentOk },
                  { label: t("brandingBackground"), value: background, set: setBackground, ok: backgroundOk },
                ].map((f) => (
                  <div key={f.label} className="space-y-1">
                    <div className="text-[11px] font-medium text-card-foreground">{f.label}</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={f.ok ? f.value : "#000000"}
                        onChange={(e) => f.set(e.target.value.toUpperCase())}
                        className="h-8 w-9 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0"
                        aria-label={f.label}
                      />
                      <Input
                        value={f.value}
                        onChange={(e) => f.set(e.target.value.toUpperCase())}
                        className={`h-8 text-xs ${f.ok ? "" : "border-destructive"}`}
                        spellCheck={false}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {(!primaryOk || !accentOk || !backgroundOk) && (
                <p className="text-[11px] text-destructive">{t("brandingInvalidHex")}</p>
              )}
              {lowContrast && <p className="text-[11px] text-destructive">{t("brandingLowContrast")}</p>}

              {/* Preview */}
              <p className="text-[10px] text-muted-foreground">{t("brandingBackgroundHint")}</p>

              <div className="rounded-md border border-border p-3 space-y-2" style={{ background: previewBg }}>
                <div className="flex items-center gap-2">
                  {logoUrl && <img src={logoUrl} alt="" className="h-6 w-6 object-contain" />}
                  <span className="text-xs font-semibold" style={{ color: previewText }}>{clubName}</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: primaryOk ? primary : "#555" }} />
                <div className="flex gap-2">
                  <span
                    className="rounded-md px-3 py-1 text-[11px] font-semibold"
                    style={{
                      background: primaryOk ? primary : "#555",
                      color: accentOk ? accent : "#fff",
                    }}
                  >
                    {t("brandingPreviewButton")}
                  </span>
                  <span
                    className="rounded-md border px-3 py-1 text-[11px] font-semibold"
                    style={{
                      borderColor: primaryOk ? primary : "#555",
                      color: primaryOk ? primary : "#999",
                    }}
                  >
                    {t("brandingPreviewOutline")}
                  </span>
                </div>
                <p className="text-[10px]" style={{ color: previewMuted }}>
                  {t("brandingContrast")}: {contrast.toFixed(1)}:1 {contrast >= 4.5 ? "AA" : contrast >= 3 ? "AA-large" : "!"}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={resetDefaults}>
                  {t("brandingReset")}
                </Button>
                <Button size="sm" onClick={save} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                  {t("save") || "Save"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <ImageCropDialog
        open={!!cropSource}
        source={cropSource}
        onCancel={() => setCropSource(null)}
        onCropped={uploadLogo}
      />
    </div>
  );
}
