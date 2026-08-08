import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

export interface DrillRecord {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  category: string;
  club_id: string;
  sort_order: number;
  is_active: boolean;
  source: "youtube" | "upload";
  storage_path: string | null;
  file_size_bytes: number | null;
}

const UPLOAD_LIMIT = 5;
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

const CATEGORY_LABEL_KEY: Record<string, TranslationKey> = {
  technique: "drillCatTechnique" as TranslationKey,
  combinations: "drillCatCombinations" as TranslationKey,
  footwork: "drillCatFootwork" as TranslationKey,
  sparring: "drillCatSparring" as TranslationKey,
  conditioning: "drillCatConditioning" as TranslationKey,
  other: "drillCatOther" as TranslationKey,
  taegeuk: "drillCatTaegeuk" as TranslationKey,
  poomse: "drillCatPoomse" as TranslationKey,
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clubId: string;
  drill: DrillRecord | null;
  categories: string[];
  uploadCount: number;
  onSaved: () => void;
}

export function DrillFormDialog({ open, onOpenChange, clubId, drill, categories, uploadCount, onSaved }: Props) {
  const { t } = useLanguage();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(categories[0] || "technique");
  const [source, setSource] = useState<"youtube" | "upload">("youtube");
  const [videoUrl, setVideoUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(drill?.title || "");
    setDescription(drill?.description || "");
    setCategory(drill?.category || categories[0] || "technique");
    setSource(drill?.source || "youtube");
    setVideoUrl(drill?.source === "upload" ? "" : (drill?.video_url || ""));
    setFile(null);
    setIsActive(drill?.is_active ?? true);
  }, [open, drill, categories]);

  const quotaFull = uploadCount >= UPLOAD_LIMIT && !(drill?.source === "upload");

  const pickFile = (f: File | null) => {
    if (!f) { setFile(null); return; }
    if (!ALLOWED_TYPES.includes(f.type)) { toast.error(t("drillsFileType" as TranslationKey)); return; }
    if (f.size > MAX_BYTES) { toast.error(t("drillsFileTooLarge" as TranslationKey)); return; }
    setFile(f);
  };

  const save = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    if (source === "youtube" && !videoUrl.trim()) return;
    if (source === "upload" && !file && !drill?.storage_path) return;

    setSaving(true);
    try {
      let storagePath = drill?.storage_path || null;
      let fileSize = drill?.file_size_bytes || null;

      if (source === "upload" && file) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
        const path = `${clubId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("club-drills").upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (upErr) throw upErr;
        if (storagePath) await supabase.storage.from("club-drills").remove([storagePath]);
        storagePath = path;
        fileSize = file.size;
      }

      const payload: Record<string, unknown> = {
        club_id: clubId,
        title: trimmed,
        description: description.trim() || null,
        category,
        is_active: isActive,
        source,
        video_url: source === "youtube" ? videoUrl.trim() : null,
        storage_path: source === "upload" ? storagePath : null,
        file_size_bytes: source === "upload" ? fileSize : null,
      };

      if (drill) {
        const { error } = await (supabase as any).from("club_drills").update(payload).eq("id", drill.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("club_drills").insert(payload);
        if (error) throw error;
      }
      toast.success(t("drillsSavedToast" as TranslationKey));
      onSaved();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg.includes("quota") ? t("drillsQuotaFull" as TranslationKey) : msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{drill ? t("drillsEdit" as TranslationKey) : t("drillsNew" as TranslationKey)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("drillsTitleField" as TranslationKey)}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
          </div>

          <div className="space-y-1.5">
            <Label>{t("drillsCategoryField" as TranslationKey)}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{t(CATEGORY_LABEL_KEY[c] || ("drillCatOther" as TranslationKey))}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t("drillsDescField" as TranslationKey)}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={1000} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={source === "youtube" ? "default" : "outline"} onClick={() => setSource("youtube")}>
              {t("drillsSourceYoutube" as TranslationKey)}
            </Button>
            <Button
              type="button"
              variant={source === "upload" ? "default" : "outline"}
              disabled={quotaFull}
              onClick={() => setSource("upload")}
            >
              {t("drillsSourceUpload" as TranslationKey)}
            </Button>
          </div>

          {source === "youtube" ? (
            <div className="space-y-1.5">
              <Label>{t("drillsYoutubeUrl" as TranslationKey)}</Label>
              <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>{t("drillsUploadFile" as TranslationKey)}</Label>
              <Input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={(e) => pickFile(e.target.files?.[0] || null)} />
              <p className="text-[11px] text-muted-foreground">
                {t("drillsQuotaUsed" as TranslationKey).replace("{used}", String(uploadCount))}
              </p>
              {quotaFull && <p className="text-[11px] text-destructive">{t("drillsQuotaFull" as TranslationKey)}</p>}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label>{t("drillsActiveField" as TranslationKey)}</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button onClick={save} disabled={saving || !title.trim()}>
            {saving ? t("drillsUploading" as TranslationKey) : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
