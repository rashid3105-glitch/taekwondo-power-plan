// IndexedDB store for offline-first physical test results.
// `test_results` is the cache, `outbox` queues inserts for sync.

const DB_NAME = "sportstalent_physical_tests";
const DB_VERSION = 1;

export interface CachedTestResult {
  local_id: string;
  server_id?: string;
  user_id: string;
  test_name: string;
  category: string;
  value: number;
  unit: string;
  test_type: string;
  tested_by: string | null;
  notes: string;
  test_date: string;
  pending: boolean;
  created_at: number;
}

export interface TestIntent {
  key: string;
  user_id: string;
  test_name: string;
  category: string;
  value: number;
  unit: string;
  test_type: string;
  tested_by: string | null;
  notes: string;
  test_date: string;
  // Active club at queue time so the row is stamped on INSERT.
  club_id?: string | null;
  queued_at: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("test_results")) {
          db.createObjectStore("test_results", { keyPath: "local_id" });
        }
        if (!db.objectStoreNames.contains("outbox")) {
          db.createObjectStore("outbox", { keyPath: "key" });
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

function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(storeName, mode);
        const req = fn(t.objectStore(storeName));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

// ---------- Cached results ----------

export async function listCachedResults(userId: string): Promise<CachedTestResult[]> {
  try {
    const all = await tx<CachedTestResult[]>("test_results", "readonly", (s) => s.getAll());
    return all
      .filter((r) => r.user_id === userId)
      .sort((a, b) => (a.test_date < b.test_date ? 1 : -1));
  } catch {
    return [];
  }
}

export async function putCachedResult(result: CachedTestResult): Promise<void> {
  try {
    await tx("test_results", "readwrite", (s) => s.put(result));
  } catch {
    /* ignore */
  }
}

export async function deleteCachedResult(localId: string): Promise<void> {
  try {
    await tx("test_results", "readwrite", (s) => s.delete(localId));
  } catch {
    /* ignore */
  }
}

export async function replaceCachedResults(
  userId: string,
  results: CachedTestResult[],
): Promise<void> {
  try {
    const all = await tx<CachedTestResult[]>("test_results", "readonly", (s) => s.getAll());
    const toRemove = all.filter((r) => r.user_id === userId && !r.pending);
    for (const r of toRemove) await deleteCachedResult(r.local_id);
    for (const r of results) await putCachedResult(r);
  } catch {
    /* ignore */
  }
}

// ---------- Outbox ----------

export async function queueTestIntent(intent: TestIntent): Promise<void> {
  try {
    await tx("outbox", "readwrite", (s) => s.put(intent));
  } catch {
    /* ignore */
  }
}

export async function listTestOutbox(): Promise<TestIntent[]> {
  try {
    return await tx<TestIntent[]>("outbox", "readonly", (s) => s.getAll());
  } catch {
    return [];
  }
}

export async function removeTestIntent(key: string): Promise<void> {
  try {
    await tx("outbox", "readwrite", (s) => s.delete(key));
  } catch {
    /* ignore */
  }
}
