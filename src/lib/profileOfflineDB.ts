// IndexedDB cache for the user's profile row, enabling read-only offline display.

const DB_NAME = "sportstalent_profile_cache";
const DB_VERSION = 1;
const STORE = "profiles";

export interface CachedProfile {
  user_id: string;
  profile: any;
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

export async function getCachedProfile(userId: string): Promise<CachedProfile | null> {
  try {
    const r = await tx<CachedProfile | undefined>("readonly", (s) => s.get(userId));
    return r || null;
  } catch {
    return null;
  }
}

export async function setCachedProfile(userId: string, profile: any): Promise<void> {
  try {
    await tx("readwrite", (s) =>
      s.put({ user_id: userId, profile, saved_at: Date.now() } satisfies CachedProfile),
    );
  } catch {
    /* IDB unavailable — skip silently */
  }
}
