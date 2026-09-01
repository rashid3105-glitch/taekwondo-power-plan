// Single source of truth for every upload ceiling in the app.
// Chat, food photos, drills and technique clips all read from here so the
// limit shown to the user is the limit actually enforced.

export const UPLOAD_LIMITS = {
  /** Photos — always compressed client-side before this ceiling applies. */
  image: 5 * 1024 * 1024,
  /** Short clips (drills, technique, match). */
  video: 30 * 1024 * 1024,
  /** Documents. */
  file: 5 * 1024 * 1024,
  /** Chat attachments are stricter: they sync offline and replay on reconnect. */
  chatImage: 1024 * 1024,
} as const;

export type UploadKind = keyof typeof UPLOAD_LIMITS;

export function limitFor(kind: UploadKind): number {
  return UPLOAD_LIMITS[kind];
}

/** Human label, e.g. "5 MB" / "800 KB". Use it in the UI *before* the picker opens. */
export function limitLabel(kind: UploadKind): string {
  const bytes = UPLOAD_LIMITS[kind];
  return bytes >= 1024 * 1024
    ? `${Math.round(bytes / 1024 / 1024)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}
