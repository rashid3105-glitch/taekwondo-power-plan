// IndexedDB store for offline diary entries.
// Outbox holds pending create / update / delete intents.

const DB_NAME = "diary-offline";
const DB_VERSION = 2;

export type DiaryOp = "create" | "update" | "delete";
export type DiaryEntryType = "general" | "training" | "competition" | "recovery" | "mental" | "injury" | "running";

export interface DiaryOutboxIntent {
  // Local id (uuid). For "create" intents this is also used as a placeholder
  // entry id until the server returns the real one.
  key: string;
  op: DiaryOp;
  user_id: string;
  // Server id once known (set after a successful create or for update/delete of existing rows).
  server_id?: string;
  entry_date: string;
  content: string;
  mood: number;
  energy: number;
  tags: string[];
  entry_type: DiaryEntryType;
  entry_types?: string[] | null;
  run_distance_km?: number | null;
  run_duration_seconds?: number | null;
  run_pace_seconds_per_km?: number | null;
  run_calories?: number | null;
  queued_at: number;
}

export interface CachedDiaryEntry {
  id: string;
  user_id: string;
  entry_date: string;
  content: string;
  mood: number;
  energy: number;
  tags: string[];
  entry_type: DiaryEntryType;
  entry_types?: string[] | null;
  run_distance_km?: number | null;
  run_duration_seconds?: number | null;
  run_pace_seconds_per_km?: number | null;
  run_calories?: number | null;
  created_at: string;
  updated_at: string;
  // true when this row only exists locally and has not been pushed yet.
  pending: boolean;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("entries")) {
        db.createObjectStore("entries", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("outbox")) {
        db.createObjectStore("outbox", { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const req = fn(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

// ---------- Cached entries ----------

export async function putCachedEntry(rec: CachedDiaryEntry): Promise<void> {
  await tx("entries", "readwrite", (s) => s.put(rec));
}

export async function deleteCachedEntry(id: string): Promise<void> {
  await tx("entries", "readwrite", (s) => s.delete(id));
}

export async function listCachedEntries(userId: string): Promise<CachedDiaryEntry[]> {
  const all = await tx<CachedDiaryEntry[]>("entries", "readonly", (s) => s.getAll());
  return all
    .filter((e) => e.user_id === userId)
    .sort((a, b) => (a.entry_date < b.entry_date ? 1 : -1));
}

export async function replaceCachedEntries(
  userId: string,
  entries: CachedDiaryEntry[],
): Promise<void> {
  const all = await tx<CachedDiaryEntry[]>("entries", "readonly", (s) => s.getAll());
  const toRemove = all.filter((e) => e.user_id === userId && !e.pending);
  for (const r of toRemove) await deleteCachedEntry(r.id);
  for (const e of entries) await putCachedEntry(e);
}

// ---------- Outbox ----------

export async function queueDiaryIntent(intent: DiaryOutboxIntent): Promise<void> {
  await tx("outbox", "readwrite", (s) => s.put(intent));
}

export async function listDiaryOutbox(): Promise<DiaryOutboxIntent[]> {
  return tx<DiaryOutboxIntent[]>("outbox", "readonly", (s) => s.getAll());
}

export async function removeDiaryIntent(key: string): Promise<void> {
  await tx("outbox", "readwrite", (s) => s.delete(key));
}

export async function getDiaryIntent(key: string): Promise<DiaryOutboxIntent | null> {
  const r = await tx<DiaryOutboxIntent | undefined>("outbox", "readonly", (s) => s.get(key));
  return r || null;
}
