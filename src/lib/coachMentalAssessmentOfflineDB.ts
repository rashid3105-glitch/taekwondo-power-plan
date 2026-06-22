// IndexedDB store for offline coach mental reviews. Mirrors the athlete
// mental assessment store but is scoped to its own DB and the
// `coach_mental_assessments` table.

const DB_NAME = "coach-mental-assessment-offline";
const DB_VERSION = 1;

export interface CachedCoachAssessment {
  id: string;
  user_id: string;
  total_score: number;
  scores: Record<string, number>;
  answers: Record<string, number>;
  ai_advice: any | null;
  created_at: string;
  pending: boolean;
}

export interface CoachMentalAssessmentOutboxIntent {
  key: string;
  user_id: string;
  total_score: number;
  scores: Record<string, number>;
  answers: Record<string, number>;
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
      db.onversionchange = () => { db.close(); dbPromise = null; };
      (db as any).onclose = () => { dbPromise = null; };
      resolve(db);
    };
    req.onerror = () => { dbPromise = null; reject(req.error); };
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
      try { transaction = db.transaction(storeName, mode); }
      catch (e) { dbPromise = null; reject(e); return; }
      const store = transaction.objectStore(storeName);
      const req = fn(store);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  return openDB().then(run).catch((e: any) => {
    const closing = e && (e.name === "InvalidStateError" || String(e?.message || "").includes("closing"));
    if (closing) { dbPromise = null; return openDB().then(run); }
    throw e;
  });
}

export async function putCachedCoachAssessment(rec: CachedCoachAssessment): Promise<void> {
  await tx("assessments", "readwrite", (s) => s.put(rec));
}
export async function deleteCachedCoachAssessment(id: string): Promise<void> {
  await tx("assessments", "readwrite", (s) => s.delete(id));
}
export async function listCachedCoachAssessments(userId: string): Promise<CachedCoachAssessment[]> {
  const all = await tx<CachedCoachAssessment[]>("assessments", "readonly", (s) => s.getAll());
  return all.filter((a) => a.user_id === userId)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}
export async function replaceCachedCoachAssessments(userId: string, rows: CachedCoachAssessment[]): Promise<void> {
  const all = await tx<CachedCoachAssessment[]>("assessments", "readonly", (s) => s.getAll());
  const toRemove = all.filter((a) => a.user_id === userId && !a.pending);
  for (const r of toRemove) await deleteCachedCoachAssessment(r.id);
  for (const r of rows) await putCachedCoachAssessment(r);
}

export async function queueCoachMentalAssessment(intent: CoachMentalAssessmentOutboxIntent): Promise<void> {
  await tx("outbox", "readwrite", (s) => s.put(intent));
}
export async function listCoachMentalAssessmentOutbox(): Promise<CoachMentalAssessmentOutboxIntent[]> {
  return tx<CoachMentalAssessmentOutboxIntent[]>("outbox", "readonly", (s) => s.getAll());
}
export async function removeCoachMentalAssessmentIntent(key: string): Promise<void> {
  await tx("outbox", "readwrite", (s) => s.delete(key));
}
