import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { AvatarCropDialog } from "@/components/AvatarCropDialog";

interface Props {
  athleteId: string;
  hasAvatar: boolean;
  onUploaded: (newAvatarUrl: string) => void;
}

const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"];

export function CoachAvatarUpload({ athleteId, hasAvatar, onUploaded }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const original = e.target.files?.[0];
    if (!original) return;
    let ext = (original.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXT.includes(ext) && !original.type.startsWith("image/")) {
      toast({ title: t("uploadFailed"), description: `Unsupported (.${ext})`, variant: "destructive" });
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (original.size > 15 * 1024 * 1024) {
      toast({ title: t("uploadFailed"), description: "Image too large (max 15 MB).", variant: "destructive" });
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    let blob: Blob = original;
    // Convert HEIC for browser preview
    if (ext === "heic" || ext === "heif" || original.type === "image/heic" || original.type === "image/heif") {
      try {
        const heic2any = (await import("heic2any")).default;
        const c = await heic2any({ blob: original, toType: "image/jpeg", quality: 0.9 });
        blob = Array.isArray(c) ? c[0] : c;
      } catch {
        toast({ title: t("uploadFailed"), description: "HEIC not supported. Use JPG/PNG.", variant: "destructive" });
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
    }
    setPreviewUrl(URL.createObjectURL(blob));
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleCancel = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleCropped = async (cropped: Blob) => {
    setUploading(true);
    try {
      const filePath = `${athleteId}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, cropped, { upsert: true, contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      const newUrl = filePath + "?t=" + Date.now();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: newUrl })
        .eq("user_id", athleteId);
      if (updateError) throw updateError;

      onUploaded(newUrl);
      toast({ title: t("photoUploaded") });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    } catch (err: any) {
      toast({ title: t("uploadFailed"), description: err?.message || "Unknown error", variant: "destructive" });
    } finally {
      setUploading(false);
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
      <AvatarCropDialog
        open={!!previewUrl}
        imageSrc={previewUrl}
        onCancel={handleCancel}
        onCropped={handleCropped}
      />
    </>
  );
}
