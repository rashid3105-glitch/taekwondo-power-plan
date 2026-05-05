import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  athleteId: string;
  hasAvatar: boolean;
  onUploaded: (newAvatarUrl: string) => void;
}

const ALLOWED_EXT = ["jpg", "png", "webp", "gif"];

export function CoachAvatarUpload({ athleteId, hasAvatar, onUploaded }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const original = e.target.files?.[0];
    if (!original) return;
    setUploading(true);

    let file: File = original;
    let ext = (original.name.split(".").pop() || "").toLowerCase();
    if (ext === "jpeg" || ext === "jpe") ext = "jpg";

    const isHeic =
      ext === "heic" || ext === "heif" ||
      original.type === "image/heic" || original.type === "image/heif";

    if (isHeic) {
      try {
        const heic2any = (await import("heic2any")).default;
        const converted = await heic2any({ blob: original, toType: "image/jpeg", quality: 0.85 });
        const blob = Array.isArray(converted) ? converted[0] : converted;
        file = new File([blob], original.name.replace(/\.(heic|heif)$/i, ".jpg"), { type: "image/jpeg" });
        ext = "jpg";
      } catch {
        toast({ title: t("uploadFailed"), description: "HEIC not supported. Use JPG or PNG.", variant: "destructive" });
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
    } else if (!ext) {
      ext = original.type === "image/png" ? "png" : "jpg";
    }

    if (!ALLOWED_EXT.includes(ext)) {
      toast({ title: t("uploadFailed"), description: `Unsupported format (.${ext}).`, variant: "destructive" });
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: t("uploadFailed"), description: "Image too large (max 10 MB).", variant: "destructive" });
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    try {
      const filePath = `${athleteId}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, contentType: file.type || undefined });
      if (uploadError) throw uploadError;

      const newUrl = filePath + "?t=" + Date.now();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: newUrl })
        .eq("user_id", athleteId);
      if (updateError) throw updateError;

      onUploaded(newUrl);
      toast({ title: t("photoUploaded") });
    } catch (err: any) {
      toast({ title: t("uploadFailed"), description: err?.message || "Unknown error", variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
        className="hidden"
        onChange={onFile}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 gap-1.5"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
        <span className="text-xs">{hasAvatar ? t("changePhoto") : t("addPhoto")}</span>
      </Button>
    </>
  );
}
