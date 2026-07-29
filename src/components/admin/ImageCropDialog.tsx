import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Crosshair, Loader2, ZoomIn } from "lucide-react";

export const CROP_OUTPUT_PX = 800;

const RATIOS = [
  { key: "1:1", label: "1:1", value: 1 },
  { key: "4:3", label: "4:3", value: 4 / 3 },
  { key: "16:9", label: "16:9", value: 16 / 9 },
] as const;

interface Props {
  open: boolean;
  /** File or image URL to crop. */
  source: File | string | null;
  onCancel: () => void;
  onCropped: (blob: Blob) => void | Promise<void>;
}

/**
 * Simple pan + zoom cropper. Exports WebP at max CROP_OUTPUT_PX on the long edge
 * so the landing page stays light.
 */
export function ImageCropDialog({ open, source, onCancel, onCropped }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [ratio, setRatio] = useState<number>(1);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    if (!open || !source) return;
    let url: string | null = null;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      setImg(image);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    if (typeof source === "string") image.src = source;
    else {
      url = URL.createObjectURL(source);
      image.src = url;
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [open, source]);

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setOffset({
      x: drag.current.ox + (e.clientX - drag.current.x),
      y: drag.current.oy + (e.clientY - drag.current.y),
    });
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const save = useCallback(async () => {
    const frame = frameRef.current;
    if (!img || !frame) return;
    setSaving(true);
    try {
      const fw = frame.clientWidth;
      const fh = frame.clientHeight;

      // Displayed image geometry (object-fit: cover + zoom + offset), in frame px.
      const base = Math.max(fw / img.width, fh / img.height);
      const scale = base * zoom;
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = (fw - dw) / 2 + offset.x;
      const dy = (fh - dh) / 2 + offset.y;

      // Source rect inside the original image that the frame shows.
      const sx = (0 - dx) / scale;
      const sy = (0 - dy) / scale;
      const sw = fw / scale;
      const sh = fh / scale;

      const outW = ratio >= 1 ? CROP_OUTPUT_PX : Math.round(CROP_OUTPUT_PX * ratio);
      const outH = ratio >= 1 ? Math.round(CROP_OUTPUT_PX / ratio) : CROP_OUTPUT_PX;

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas ikke tilgængelig");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.8));
      if (!blob) throw new Error("Kunne ikke gemme billedet");
      await onCropped(blob);
    } finally {
      setSaving(false);
    }
  }, [img, zoom, offset, ratio, onCropped]);

  const frameStyle: React.CSSProperties = {
    aspectRatio: `${ratio}`,
    touchAction: "none",
  };

  const base = img ? Math.max(1, 1) : 1;
  void base;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Beskær billede</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          {RATIOS.map((r) => (
            <Button
              key={r.key}
              type="button"
              size="sm"
              variant={ratio === r.value ? "default" : "outline"}
              onClick={() => {
                setRatio(r.value);
                reset();
              }}
            >
              {r.label}
            </Button>
          ))}
          <Button type="button" size="sm" variant="ghost" onClick={reset} className="ml-auto">
            <Crosshair className="mr-2 h-4 w-4" /> Centrér
          </Button>
        </div>

        <div
          ref={frameRef}
          style={frameStyle}
          className="relative w-full cursor-grab overflow-hidden rounded-xl border border-border bg-muted active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {img && (
            <img
              src={img.src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              }}
            />
          )}
          <div className="pointer-events-none absolute inset-0 border border-white/20" />
        </div>

        <div className="flex items-center gap-3">
          <ZoomIn className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.01}
            onValueChange={([v]) => setZoom(v)}
            className="flex-1"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Træk i billedet for at flytte motivet. Gemmes som WebP i maks. {CROP_OUTPUT_PX} px.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Annullér
          </Button>
          <Button onClick={save} disabled={!img || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gem billede
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
