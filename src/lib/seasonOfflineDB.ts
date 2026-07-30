// Offline cache for the club season plan (plan + phases + day templates) and
// the per-week technique focus shown in the athlete season calendar.
//
// Read-only data: we snapshot it on every successful online load and serve the
// snapshot when the device has no connectivity.

const DB_NAME = "sportstalent-season";
const DB_VERSION = 1;
const STORE = "season_cache";

export interface CachedSeason {
  /** cache key: `${clubId}` for the plan bundle, `focus:${planId}` for focus data */
  key: string;
  payload: unknown;
  cached_at: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function put(key: string, payload: unknown): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ key, payload, cached_at: Date.now() } as CachedSeason);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* caching is best effort */
  }
}

async function get<T>(key: string): Promise<{ payload: T; cached_at: number } | null> {
  try {
    const db = await openDB();
    const row = await new Promise<CachedSeason | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result as CachedSeason | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (!row) return null;
    return { payload: row.payload as T, cached_at: row.cached_at };
  } catch {
    return null;
  }
}

/* ---------- Season plan bundle (plan + phases + day templates) ---------- */

export interface SeasonBundle {
  plan: any;
  phases: any[];
  template: any[];
}

export const cacheSeasonBundle = (clubId: string, bundle: SeasonBundle | null) =>
  put(`plan:${clubId}`, bundle);

export const readCachedSeasonBundle = (clubId: string) =>
  get<SeasonBundle | null>(`plan:${clubId}`);

/* ---------- Week technique focus + competitions for the calendar ---------- */

export interface SeasonFocusSnapshot {
  competitions: any[];
  overrides: any[];
  teamFocus: any[];
  athleteFocus: any[];
  techniques: any[];
}

export const cacheSeasonFocus = (planId: string, snapshot: SeasonFocusSnapshot) =>
  put(`focus:${planId}`, snapshot);

export const readCachedSeasonFocus = (planId: string) =>
  get<SeasonFocusSnapshot>(`focus:${planId}`);
