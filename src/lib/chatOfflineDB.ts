// IndexedDB store for offline chat.
// Caches thread lists and per-thread messages for read-only offline access,
// and holds an outbox of messages composed while offline.

const DB_NAME = "chat-offline";
const DB_VERSION = 1;

const STORE_THREADS = "threads";   // key: "self" -> full thread list snapshot
const STORE_MESSAGES = "messages"; // key: thread_id -> message array snapshot
const STORE_OUTBOX = "outbox";     // key: local message id

export interface ChatOutboxIntent {
  /** Local uuid, also used as the optimistic message id. */
  key: string;
  thread_id: string;
  sender_id: string;
  body: string;
  queued_at: number;
}

interface Snapshot<T> {
  key: string;
  payload: T;
  cached_at: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_THREADS)) db.createObjectStore(STORE_THREADS, { keyPath: "key" });
      if (!db.objectStoreNames.contains(STORE_MESSAGES)) db.createObjectStore(STORE_MESSAGES, { keyPath: "key" });
      if (!db.objectStoreNames.contains(STORE_OUTBOX)) db.createObjectStore(STORE_OUTBOX, { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function put(store: string, value: unknown): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value as any);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function get<T>(store: string, key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function getAll<T>(store: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve((req.result ?? []) as T[]);
    req.onerror = () => reject(req.error);
  });
}

async function del(store: string, key: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ---------- Threads ---------- */

export async function cacheThreads(threads: unknown[]): Promise<void> {
  try {
    await put(STORE_THREADS, { key: "self", payload: threads, cached_at: Date.now() } as Snapshot<unknown[]>);
  } catch { /* storage unavailable */ }
}

export async function readCachedThreads<T = unknown>(): Promise<T[] | null> {
  try {
    const row = await get<Snapshot<T[]>>(STORE_THREADS, "self");
    return row?.payload ?? null;
  } catch { return null; }
}

/* ---------- Messages ---------- */

export async function cacheMessages(threadId: string, messages: unknown[]): Promise<void> {
  try {
    await put(STORE_MESSAGES, { key: threadId, payload: messages, cached_at: Date.now() } as Snapshot<unknown[]>);
  } catch { /* storage unavailable */ }
}

export async function readCachedMessages<T = unknown>(threadId: string): Promise<T[] | null> {
  try {
    const row = await get<Snapshot<T[]>>(STORE_MESSAGES, threadId);
    return row?.payload ?? null;
  } catch { return null; }
}

/* ---------- Outbox ---------- */

export async function queueChatIntent(intent: ChatOutboxIntent): Promise<void> {
  await put(STORE_OUTBOX, intent);
}

export async function listChatOutbox(): Promise<ChatOutboxIntent[]> {
  try {
    return (await getAll<ChatOutboxIntent>(STORE_OUTBOX)).sort((a, b) => a.queued_at - b.queued_at);
  } catch { return []; }
}

export async function listChatOutboxForThread(threadId: string): Promise<ChatOutboxIntent[]> {
  return (await listChatOutbox()).filter((i) => i.thread_id === threadId);
}

export async function removeChatIntent(key: string): Promise<void> {
  await del(STORE_OUTBOX, key);
}
