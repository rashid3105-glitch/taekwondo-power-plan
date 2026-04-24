// IndexedDB wrapper for offline Match Analysis.
// Stores: cached video blobs, pending tag inserts/deletes, and outbox uploads.

const DB_NAME = "match-offline";
const DB_VERSION = 1;

export interface CachedVideoMeta {
  id: string;
  athlete_id: string;
  coach_id: string;
  title: string;
  notes: string;
  storage_path: string;
  duration_seconds: number | null;
  discipline: string;
  opponent_name: string | null;
  event_name: string | null;
  match_date: string | null;
  share_token: string | null;
  share_expires_at: string | null;
  created_at: string;
  cached_at: number;
  size_bytes: number;
}

export interface CachedVideoRecord extends CachedVideoMeta {
  blob: Blob;
}

export interface PendingTagInsert {
  id: string; // temp uuid
  video_id: string; // server id (only for already-synced videos) OR temp upload id
  video_temp_id?: string; // if video itself is in outbox
  timestamp_seconds: number;
  technique: string;
  side: string;
  outcome: string;
  notes: string;
  created_by: string;
  created_at: number;
}

export interface PendingTagDelete {
  id: string; // temp uuid
  tag_id: string; // server id
  video_id: string;
  created_at: number;
}

export interface OutboxUpload {
  id: string; // temp uuid (also used as temp video_id)
  athlete_id: string;
  coach_id: string;
  club_id: string | null;
  title: string;
  discipline: string;
  opponent_name: string | null;
  event_name: string | null;
  match_date: string | null;
  duration_seconds: number | null;
  file: Blob;
  file_name: string;
  created_at: number;
  status: "pending" | "uploading" | "failed";
  error?: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("videos")) {
        db.createObjectStore("videos", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("pending_tags")) {
        db.createObjectStore("pending_tags", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("pending_tag_deletes")) {
        db.createObjectStore("pending_tag_deletes", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("outbox")) {
        db.createObjectStore("outbox", { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(storeName: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | Promise<T>): Promise<T> {
  return openDB().then((db) =>
    new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const result = fn(store);
      if (result instanceof Promise) {
        result.then(resolve, reject);
        return;
      }
      result.onsuccess = () => resolve(result.result);
      result.onerror = () => reject(result.error);
    }),
  );
}

// ---------- Videos ----------

export async function cacheVideo(meta: CachedVideoMeta, blob: Blob): Promise<void> {
  const record: CachedVideoRecord = { ...meta, blob };
  await tx("videos", "readwrite", (s) => s.put(record));
}

export async function getCachedVideo(id: string): Promise<CachedVideoRecord | null> {
  const r = await tx<CachedVideoRecord | undefined>("videos", "readonly", (s) => s.get(id));
  return r || null;
}

export async function listCachedVideos(): Promise<CachedVideoMeta[]> {
  const all = await tx<CachedVideoRecord[]>("videos", "readonly", (s) => s.getAll());
  return all.map(({ blob: _b, ...meta }) => meta);
}

export async function removeCachedVideo(id: string): Promise<void> {
  await tx("videos", "readwrite", (s) => s.delete(id));
}

export async function isVideoCached(id: string): Promise<boolean> {
  const keys = await tx<IDBValidKey[]>("videos", "readonly", (s) => s.getAllKeys());
  return keys.includes(id);
}

// ---------- Pending tags (insert) ----------

export async function queueTagInsert(t: PendingTagInsert): Promise<void> {
  await tx("pending_tags", "readwrite", (s) => s.put(t));
}

export async function listPendingTagInserts(): Promise<PendingTagInsert[]> {
  return tx<PendingTagInsert[]>("pending_tags", "readonly", (s) => s.getAll());
}

export async function listPendingTagInsertsForVideo(videoId: string, videoTempId?: string): Promise<PendingTagInsert[]> {
  const all = await listPendingTagInserts();
  return all.filter((x) => x.video_id === videoId || (videoTempId && x.video_temp_id === videoTempId));
}

export async function removePendingTagInsert(id: string): Promise<void> {
  await tx("pending_tags", "readwrite", (s) => s.delete(id));
}

// ---------- Pending tag deletes ----------

export async function queueTagDelete(d: PendingTagDelete): Promise<void> {
  await tx("pending_tag_deletes", "readwrite", (s) => s.put(d));
}

export async function listPendingTagDeletes(): Promise<PendingTagDelete[]> {
  return tx<PendingTagDelete[]>("pending_tag_deletes", "readonly", (s) => s.getAll());
}

export async function removePendingTagDelete(id: string): Promise<void> {
  await tx("pending_tag_deletes", "readwrite", (s) => s.delete(id));
}

// ---------- Outbox (uploads) ----------

export async function queueOutboxUpload(u: OutboxUpload): Promise<void> {
  await tx("outbox", "readwrite", (s) => s.put(u));
}

export async function listOutboxUploads(): Promise<OutboxUpload[]> {
  return tx<OutboxUpload[]>("outbox", "readonly", (s) => s.getAll());
}

export async function updateOutboxUpload(u: OutboxUpload): Promise<void> {
  await tx("outbox", "readwrite", (s) => s.put(u));
}

export async function removeOutboxUpload(id: string): Promise<void> {
  await tx("outbox", "readwrite", (s) => s.delete(id));
}

// ---------- Quota ----------

export async function getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (!("storage" in navigator) || !navigator.storage.estimate) return null;
  const e = await navigator.storage.estimate();
  return { usage: e.usage || 0, quota: e.quota || 0 };
}

export function makeTempId(prefix = "tmp"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
