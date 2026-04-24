// IndexedDB wrapper for offline workout logging.
// Stores: locally-known logs (by composite key) and an outbox of pending upserts.

const DB_NAME = "workout-log-offline";
const DB_VERSION = 1;

export interface LocalLogRecord {
  // composite key: planId|dayIndex|sessionIndex|exerciseIndex|loggedDate
  key: string;
  user_id: string;
  plan_id: string;
  day_index: number;
  session_index: number;
  exercise_index: number;
  logged_date: string;
  completed: boolean;
  actual_sets: number | null;
  actual_reps: string | null;
  notes: string | null;
  // server id once synced
  server_id?: string;
  // true if the record has unsynced changes
  dirty: boolean;
  updated_at: number;
}

export interface OutboxLogIntent {
  // Same composite key — collapses repeated edits to the same exercise/day.
  key: string;
  user_id: string;
  plan_id: string;
  day_index: number;
  session_index: number;
  exercise_index: number;
  logged_date: string;
  completed: boolean;
  actual_sets: number | null;
  actual_reps: string | null;
  notes: string | null;
  queued_at: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("logs")) {
        db.createObjectStore("logs", { keyPath: "key" });
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

export function makeLogKey(
  planId: string,
  dayIndex: number,
  sessionIndex: number,
  exerciseIndex: number,
  loggedDate: string,
): string {
  return `${planId}|${dayIndex}|${sessionIndex}|${exerciseIndex}|${loggedDate}`;
}

// ---------- Logs cache ----------

export async function putLocalLog(rec: LocalLogRecord): Promise<void> {
  await tx("logs", "readwrite", (s) => s.put(rec));
}

export async function getLocalLog(key: string): Promise<LocalLogRecord | null> {
  const r = await tx<LocalLogRecord | undefined>("logs", "readonly", (s) => s.get(key));
  return r || null;
}

export async function listLocalLogsForSession(
  planId: string,
  dayIndex: number,
  sessionIndex: number,
  loggedDate: string,
): Promise<LocalLogRecord[]> {
  const all = await tx<LocalLogRecord[]>("logs", "readonly", (s) => s.getAll());
  return all.filter(
    (r) =>
      r.plan_id === planId &&
      r.day_index === dayIndex &&
      r.session_index === sessionIndex &&
      r.logged_date === loggedDate,
  );
}

// ---------- Outbox ----------

export async function queueLogIntent(intent: OutboxLogIntent): Promise<void> {
  await tx("outbox", "readwrite", (s) => s.put(intent));
}

export async function listOutboxIntents(): Promise<OutboxLogIntent[]> {
  return tx<OutboxLogIntent[]>("outbox", "readonly", (s) => s.getAll());
}

export async function removeOutboxIntent(key: string): Promise<void> {
  await tx("outbox", "readwrite", (s) => s.delete(key));
}

export async function countOutboxIntents(): Promise<number> {
  const all = await listOutboxIntents();
  return all.length;
}
