// IndexedDB store for offline readiness check-ins.
// Only one check-in per user per day — outbox is keyed by checkin_date.

const DB_NAME = "readiness-offline";
const DB_VERSION = 1;

export interface ReadinessOutboxIntent {
  // checkin_date (YYYY-MM-DD) acts as the key — one row per day.
  key: string;
  user_id: string;
  sleep_hours: number;
  soreness: number;
  mood: number;
  motivation: number;
  is_sick: boolean;
  // Locally computed score so the UI shows immediate feedback while offline.
  score: number;
  recommendation: "green" | "amber" | "red";
  queued_at: number;
}

export interface CachedReadiness {
  user_id: string;
  checkin_date: string;
  score: number;
  recommendation: "green" | "amber" | "red";
  pending: boolean;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("checkins")) {
        // composite key: user_id|checkin_date
        db.createObjectStore("checkins", { keyPath: "key" });
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

export function makeCheckinKey(userId: string, date: string) {
  return `${userId}|${date}`;
}

// Locally compute the same score as the edge function so the UI works offline.
export function computeReadinessScore(d: {
  sleep_hours: number;
  soreness: number;
  mood: number;
  motivation: number;
  is_sick: boolean;
}): { score: number; recommendation: "green" | "amber" | "red" } {
  const sleepNorm = Math.min(1, d.sleep_hours / 8);
  let score = sleepNorm * 30 + (6 - d.soreness) * 7 + d.mood * 7 + d.motivation * 6;
  if (d.is_sick) score -= 40;
  score = Math.max(0, Math.min(100, Math.round(score)));
  let recommendation: "green" | "amber" | "red" = "green";
  if (score < 40 || d.is_sick) recommendation = "red";
  else if (score < 65) recommendation = "amber";
  return { score, recommendation };
}

export async function putCachedCheckin(
  userId: string,
  date: string,
  rec: Omit<CachedReadiness, "user_id" | "checkin_date">,
): Promise<void> {
  await tx("checkins", "readwrite", (s) =>
    s.put({ key: makeCheckinKey(userId, date), user_id: userId, checkin_date: date, ...rec }),
  );
}

export async function getCachedCheckin(
  userId: string,
  date: string,
): Promise<CachedReadiness | null> {
  const r = await tx<(CachedReadiness & { key: string }) | undefined>(
    "checkins",
    "readonly",
    (s) => s.get(makeCheckinKey(userId, date)),
  );
  return r || null;
}

export async function queueReadinessIntent(intent: ReadinessOutboxIntent): Promise<void> {
  await tx("outbox", "readwrite", (s) => s.put(intent));
}

export async function listReadinessOutbox(): Promise<ReadinessOutboxIntent[]> {
  return tx<ReadinessOutboxIntent[]>("outbox", "readonly", (s) => s.getAll());
}

export async function removeReadinessIntent(key: string): Promise<void> {
  await tx("outbox", "readwrite", (s) => s.delete(key));
}
