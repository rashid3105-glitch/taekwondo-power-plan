import { useCallback, useEffect, useRef, useState } from "react";
import { syncMatchOffline, type SyncResult } from "@/lib/matchSyncEngine";
import {
  listCachedVideos,
  listOutboxUploads,
  listPendingTagInserts,
  listPendingTagDeletes,
  type CachedVideoMeta,
  type OutboxUpload,
} from "@/lib/matchOfflineDB";

export interface OfflineState {
  online: boolean;
  cachedIds: Set<string>;
  cachedMetas: CachedVideoMeta[];
  outbox: OutboxUpload[];
  pendingTagCount: number;
  pendingDeleteCount: number;
  syncing: boolean;
  lastSync: SyncResult | null;
}

export function useMatchOffline(opts: { autoSync?: boolean } = {}) {
  const { autoSync = true } = opts;
  const [state, setState] = useState<OfflineState>({
    online: typeof navigator !== "undefined" ? navigator.onLine : true,
    cachedIds: new Set(),
    cachedMetas: [],
    outbox: [],
    pendingTagCount: 0,
    pendingDeleteCount: 0,
    syncing: false,
    lastSync: null,
  });
  const syncingRef = useRef(false);

  const refresh = useCallback(async () => {
    const [metas, outbox, tags, deletes] = await Promise.all([
      listCachedVideos(),
      listOutboxUploads(),
      listPendingTagInserts(),
      listPendingTagDeletes(),
    ]);
    setState((s) => ({
      ...s,
      cachedIds: new Set(metas.map((m) => m.id)),
      cachedMetas: metas,
      outbox,
      pendingTagCount: tags.length,
      pendingDeleteCount: deletes.length,
    }));
  }, []);

  const runSync = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return null;
    syncingRef.current = true;
    setState((s) => ({ ...s, syncing: true }));
    try {
      const res = await syncMatchOffline();
      await refresh();
      setState((s) => ({ ...s, syncing: false, lastSync: res }));
      return res;
    } finally {
      syncingRef.current = false;
      setState((s) => ({ ...s, syncing: false }));
    }
  }, [refresh]);

  useEffect(() => {
    void refresh();
    const onOnline = () => {
      setState((s) => ({ ...s, online: true }));
      if (autoSync) void runSync();
    };
    const onOffline = () => setState((s) => ({ ...s, online: false }));
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    if (autoSync && navigator.onLine) void runSync();
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [autoSync, runSync, refresh]);

  return { ...state, refresh, runSync };
}
