// IndexedDB cache for the user's active training plan, so the athlete can
// still view today's session when offline.

const DB_NAME = "sportstalent_plan_cache";
const DB_VERSION = 1;
const STORE = "plans";

export interface CachedPlan {
  user_id: string;
  plan: any;
  saved_at: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "user_id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  });
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export async function getCachedPlan(userId: string): Promise<CachedPlan | null> {
  try {
    const r = await tx<CachedPlan | undefined>("readonly", (s) => s.get(userId));
    return r || null;
  } catch {
    return null;
  }
}

export async function setCachedPlan(userId: string, plan: any): Promise<void> {
  try {
    await tx("readwrite", (s) =>
      s.put({ user_id: userId, plan, saved_at: Date.now() } satisfies CachedPlan),
    );
  } catch {
    /* IDB unavailable — silently skip */
  }
}

export async function clearCachedPlan(userId: string): Promise<void> {
  try {
    await tx("readwrite", (s) => s.delete(userId));
  } catch {
    /* ignore */
  }
}
