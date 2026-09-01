/**
 * Client-side image compression for chat/media attachments.
 *
 * Keeps uploads inside the shared attachment limit by progressively
 * downscaling and re-encoding images to JPEG in the browser.
 * Non-image files (e.g. video) are returned untouched.
 */

export const MAX_IMAGE_DIMENSION = 1600;

async function loadBitmap(file: File): Promise<{ width: number; height: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; cleanup: () => void }> {
  if (typeof createImageBitmap === "function") {
    const bmp = await createImageBitmap(file);
    return {
      width: bmp.width,
      height: bmp.height,
      draw: (ctx, w, h) => ctx.drawImage(bmp, 0, 0, w, h),
      cleanup: () => bmp.close?.(),
    };
  }
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new window.Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = url;
  });
  return {
    width: img.naturalWidth,
    height: img.naturalHeight,
    draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
    cleanup: () => URL.revokeObjectURL(url),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", quality));
}

/**
 * Compress an image so it fits within `maxBytes`.
 * Returns the original file when it is not an image, already small enough,
 * or when compression is not possible in this environment.
 */
export async function compressImageFile(file: File, maxBytes: number): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  if (file.size <= maxBytes) return file;

  try {
    const src = await loadBitmap(file);
    try {
      let maxDim = MAX_IMAGE_DIMENSION;
      for (let pass = 0; pass < 5; pass++) {
        const scale = Math.min(1, maxDim / Math.max(src.width, src.height));
        const w = Math.max(1, Math.round(src.width * scale));
        const h = Math.max(1, Math.round(src.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return file;
        src.draw(ctx, w, h);

        for (const quality of [0.82, 0.7, 0.58, 0.45]) {
          const blob = await canvasToBlob(canvas, quality);
          if (blob && blob.size <= maxBytes) {
            const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
            return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
          }
        }
        maxDim = Math.round(maxDim * 0.7);
      }
    } finally {
      src.cleanup();
    }
  } catch {
    /* fall through — return original and let the size check reject it */
  }
  return file;
}
