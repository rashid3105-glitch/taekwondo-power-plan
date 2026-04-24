// Sync engine: flushes outbox uploads, pending tag inserts, and pending tag deletes
// when the browser is online. Idempotent — safe to call multiple times.

import { supabase } from "@/integrations/supabase/client";
import {
  listOutboxUploads,
  updateOutboxUpload,
  removeOutboxUpload,
  listPendingTagInserts,
  removePendingTagInsert,
  listPendingTagDeletes,
  removePendingTagDelete,
  type OutboxUpload,
} from "./matchOfflineDB";

export interface SyncResult {
  uploaded: number;
  uploadFailed: number;
  tagsInserted: number;
  tagsDeleted: number;
  errors: string[];
}

let syncing = false;

export async function syncMatchOffline(): Promise<SyncResult> {
  const result: SyncResult = { uploaded: 0, uploadFailed: 0, tagsInserted: 0, tagsDeleted: 0, errors: [] };
  if (syncing || !navigator.onLine) return result;
  syncing = true;
  try {
    // 1. Flush outbox uploads first so any pending tags can be re-mapped.
    const outbox = await listOutboxUploads();
    const tempToServerId = new Map<string, string>();
    for (const u of outbox) {
      try {
        await updateOutboxUpload({ ...u, status: "uploading", error: undefined });
        const serverId = await uploadOutboxItem(u);
        tempToServerId.set(u.id, serverId);
        await removeOutboxUpload(u.id);
        result.uploaded += 1;
      } catch (e: any) {
        await updateOutboxUpload({ ...u, status: "failed", error: e?.message || "Upload failed" });
        result.uploadFailed += 1;
        result.errors.push(`Upload "${u.title}": ${e?.message || e}`);
      }
    }

    // 2. Flush pending tag inserts (rewriting any temp video_id to the new server id).
    const pendingTags = await listPendingTagInserts();
    for (const t of pendingTags) {
      try {
        let videoId = t.video_id;
        if (t.video_temp_id && tempToServerId.has(t.video_temp_id)) {
          videoId = tempToServerId.get(t.video_temp_id)!;
        } else if (t.video_temp_id) {
          // Upload not yet flushed — leave for next round.
          continue;
        }
        const { error } = await supabase.from("match_tags").insert({
          video_id: videoId,
          timestamp_seconds: t.timestamp_seconds,
          technique: t.technique,
          side: t.side,
          outcome: t.outcome,
          notes: t.notes,
          created_by: t.created_by,
        });
        if (error) throw error;
        await removePendingTagInsert(t.id);
        result.tagsInserted += 1;
      } catch (e: any) {
        result.errors.push(`Tag sync: ${e?.message || e}`);
      }
    }

    // 3. Flush pending tag deletes.
    const pendingDeletes = await listPendingTagDeletes();
    for (const d of pendingDeletes) {
      try {
        const { error } = await supabase.from("match_tags").delete().eq("id", d.tag_id);
        if (error) throw error;
        await removePendingTagDelete(d.id);
        result.tagsDeleted += 1;
      } catch (e: any) {
        result.errors.push(`Tag delete sync: ${e?.message || e}`);
      }
    }
  } finally {
    syncing = false;
  }
  return result;
}

async function uploadOutboxItem(u: OutboxUpload): Promise<string> {
  const safeName = u.file_name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${u.coach_id}/${Date.now()}-${safeName}`;
  const { error: upErr } = await supabase.storage.from("match_videos").upload(path, u.file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (upErr) throw upErr;

  const { data, error: insErr } = await supabase
    .from("match_videos")
    .insert({
      athlete_id: u.athlete_id,
      coach_id: u.coach_id,
      club_id: u.club_id,
      title: u.title,
      storage_path: path,
      duration_seconds: u.duration_seconds,
      discipline: u.discipline,
      opponent_name: u.opponent_name,
      event_name: u.event_name,
      match_date: u.match_date,
    })
    .select("id")
    .single();
  if (insErr) throw insErr;
  return (data as { id: string }).id;
}
