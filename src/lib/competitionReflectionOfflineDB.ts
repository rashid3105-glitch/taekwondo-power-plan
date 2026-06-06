// IndexedDB store for offline post-competition reflections.
// Cache holds completed reflections (synced + locally-queued) and the outbox
// holds pending submissions waiting for the AI plan round-trip.

const DB_NAME = "competition-reflection-offline";
const DB_VERSION = 1;

export interface CachedReflection {
  id: string; // local uuid replaced with server id once synced
  user_id: string;
  competition_id: string | null;
  competition_name: string | null;
  competition_date: string | null;
  result: string | null;
  ratings: Record<string, number>;
  reflections: Record<string, string>;
  ai_plan: any | null;
  next_competition_id: string | null;
  created_at: string;
  pending: boolean;
}

export interface ReflectionOutboxIntent {
  key: string;
  user_id: string;
  competition_id: string | null;
  competition_name: string | null;
  competition_date: string | null;
  result: string | null;
  ratings: Record<string, number>;
  reflections: Record<string, string>;
  next_competition_id: string | null;
  club_id?: string | null;
  // Snapshot for advice generation
  profile: any;
  language: string;
  recentBaselineScores: Record<string, number> | null;
  queued_at: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("reflections")) {
        db.createObjectStore("reflections", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("outbox")) {
        db.createObjectStore("outbox", { keyPath: "key" });
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      (db as any).onclose = () => {
        dbPromise = null;
      };
      resolve(db);
    };
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const run = (db: IDBDatabase) =>
    new Promise<T>((resolve, reject) => {
      let transaction: IDBTransaction;
      try {
        transaction = db.transaction(storeName, mode);
      } catch (e) {
        dbPromise = null;
        reject(e);
        return;
      }
      const store = transaction.objectStore(storeName);
      const req = fn(store);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  return openDB()
    .then(run)
    .catch((e: any) => {
      const closing =
        e && (e.name === "InvalidStateError" || String(e?.message || "").includes("closing"));
      if (closing) {
        dbPromise = null;
        return openDB().then(run);
      }
      throw e;
    });
}

export async function putCachedReflection(rec: CachedReflection): Promise<void> {
  await tx("reflections", "readwrite", (s) => s.put(rec));
}
export async function deleteCachedReflection(id: string): Promise<void> {
  await tx("reflections", "readwrite", (s) => s.delete(id));
}
export async function listCachedReflections(userId: string): Promise<CachedReflection[]> {
  const all = await tx<CachedReflection[]>("reflections", "readonly", (s) => s.getAll());
  return all
    .filter((r) => r.user_id === userId)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}
export async function replaceCachedReflections(
  userId: string,
  rows: CachedReflection[],
): Promise<void> {
  const all = await tx<CachedReflection[]>("reflections", "readonly", (s) => s.getAll());
  const toRemove = all.filter((r) => r.user_id === userId && !r.pending);
  for (const r of toRemove) await deleteCachedReflection(r.id);
  for (const r of rows) await putCachedReflection(r);
}

export async function queueReflection(intent: ReflectionOutboxIntent): Promise<void> {
  await tx("outbox", "readwrite", (s) => s.put(intent));
}
export async function listReflectionOutbox(): Promise<ReflectionOutboxIntent[]> {
  return tx<ReflectionOutboxIntent[]>("outbox", "readonly", (s) => s.getAll());
}
export async function removeReflectionIntent(key: string): Promise<void> {
  await tx("outbox", "readwrite", (s) => s.delete(key));
}
