// IndexedDB store for offline mental assessments.
// Cache holds completed assessments (synced + locally-queued) and the outbox
// holds pending submissions waiting for an AI advice round-trip.

const DB_NAME = "mental-assessment-offline";
const DB_VERSION = 1;

export interface CachedAssessment {
  // Local id (uuid). Replaced with the server id once the row is inserted.
  id: string;
  user_id: string;
  total_score: number;
  scores: Record<string, number>;
  answers: Record<string, number>;
  ai_advice: any | null;
  created_at: string;
  // true when this row only exists locally and has not been synced yet.
  pending: boolean;
}

export interface MentalAssessmentOutboxIntent {
  // Same key as the local cached row id.
  key: string;
  user_id: string;
  total_score: number;
  scores: Record<string, number>;
  answers: Record<string, number>;
  // Snapshot of the active club at queue time so the row is stamped on INSERT.
  club_id?: string | null;
  // Snapshot of the profile/language used to request advice.
  profile: any;
  language: string;
  queued_at: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("assessments")) {
        db.createObjectStore("assessments", { keyPath: "id" });
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

// ---------- Cached assessments ----------

export async function putCachedAssessment(rec: CachedAssessment): Promise<void> {
  await tx("assessments", "readwrite", (s) => s.put(rec));
}

export async function deleteCachedAssessment(id: string): Promise<void> {
  await tx("assessments", "readwrite", (s) => s.delete(id));
}

export async function listCachedAssessments(userId: string): Promise<CachedAssessment[]> {
  const all = await tx<CachedAssessment[]>("assessments", "readonly", (s) => s.getAll());
  return all
    .filter((a) => a.user_id === userId)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export async function replaceCachedAssessments(
  userId: string,
  rows: CachedAssessment[],
): Promise<void> {
  const all = await tx<CachedAssessment[]>("assessments", "readonly", (s) => s.getAll());
  const toRemove = all.filter((a) => a.user_id === userId && !a.pending);
  for (const r of toRemove) await deleteCachedAssessment(r.id);
  for (const r of rows) await putCachedAssessment(r);
}

// ---------- Outbox ----------

export async function queueMentalAssessment(
  intent: MentalAssessmentOutboxIntent,
): Promise<void> {
  await tx("outbox", "readwrite", (s) => s.put(intent));
}

export async function listMentalAssessmentOutbox(): Promise<MentalAssessmentOutboxIntent[]> {
  return tx<MentalAssessmentOutboxIntent[]>("outbox", "readonly", (s) => s.getAll());
}

export async function removeMentalAssessmentIntent(key: string): Promise<void> {
  await tx("outbox", "readwrite", (s) => s.delete(key));
}
