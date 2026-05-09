import { supabase } from "@/integrations/supabase/client";

export const MAX_ATTACHMENT_BYTES = 1_048_576; // 1 MB

export interface ChatThread {
  id: string;
  kind: "direct" | "group";
  title: string | null;
  created_by: string;
  last_message_at: string;
  members: Array<{
    user_id: string;
    role: "owner" | "member";
    last_read_at: string;
    display_name: string;
    avatar_url: string | null;
  }>;
  last_message?: {
    id: string;
    body: string;
    sender_id: string;
    created_at: string;
    attachment_path: string | null;
  } | null;
  unread_count?: number;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  attachment_path: string | null;
  attachment_type: string | null;
  attachment_size_bytes: number | null;
  created_at: string;
  deleted_at: string | null;
  edited_at: string | null;
}

export async function editMessage(id: string, newBody: string) {
  const { error } = await supabase.rpc("edit_chat_message", { _id: id, _body: newBody });
  if (error) throw error;
}

export async function startDirectThread(otherUserId: string): Promise<string> {
  const { data, error } = await supabase.rpc("start_direct_thread", {
    _other_user: otherUserId,
  });
  if (error) throw error;
  return data as unknown as string;
}

export async function createGroupThread(title: string, memberIds: string[]): Promise<string> {
  const { data, error } = await supabase.rpc("create_group_thread", {
    _title: title,
    _member_ids: memberIds,
  });
  if (error) throw error;
  return data as unknown as string;
}

export async function markThreadRead(threadId: string) {
  const { error } = await supabase.rpc("mark_chat_thread_read", { _thread_id: threadId });
  if (error) throw error;
}

export async function getUnreadCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc("get_unread_chat_counts");
  if (error) throw error;
  const out: Record<string, number> = {};
  (data ?? []).forEach((r: any) => {
    out[r.thread_id] = Number(r.unread_count) || 0;
  });
  return out;
}

export async function listThreads(): Promise<ChatThread[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships, error: e1 } = await supabase
    .from("chat_thread_members")
    .select("thread_id")
    .eq("user_id", user.id);
  if (e1) throw e1;
  const threadIds = (memberships ?? []).map((m) => m.thread_id);
  if (threadIds.length === 0) return [];

  const [threadsRes, membersRes, lastMsgRes, unread] = await Promise.all([
    supabase.from("chat_threads").select("*").in("id", threadIds),
    supabase.from("chat_thread_members").select("*").in("thread_id", threadIds),
    supabase
      .from("chat_messages")
      .select("id, thread_id, body, sender_id, created_at, attachment_path")
      .in("thread_id", threadIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    getUnreadCounts(),
  ]);

  if (threadsRes.error) throw threadsRes.error;
  if (membersRes.error) throw membersRes.error;

  // Resolve member display names from profiles
  const userIds = Array.from(new Set((membersRes.data ?? []).map((m) => m.user_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, display_name, avatar_url")
    .in("user_id", userIds);
  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

  const lastMsgByThread = new Map<string, any>();
  (lastMsgRes.data ?? []).forEach((m: any) => {
    if (!lastMsgByThread.has(m.thread_id)) lastMsgByThread.set(m.thread_id, m);
  });

  return (threadsRes.data ?? [])
    .map((t: any) => ({
      ...t,
      members: (membersRes.data ?? [])
        .filter((m: any) => m.thread_id === t.id)
        .map((m: any) => ({
          user_id: m.user_id,
          role: m.role,
          last_read_at: m.last_read_at,
          display_name: profileMap.get(m.user_id)?.display_name ?? "Unknown",
          avatar_url: profileMap.get(m.user_id)?.avatar_url ?? null,
        })),
      last_message: lastMsgByThread.get(t.id) ?? null,
      unread_count: unread[t.id] ?? 0,
    }))
    .sort(
      (a: ChatThread, b: ChatThread) =>
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime(),
    );
}

export async function listMessages(threadId: string, limit = 100): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("thread_id", threadId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as ChatMessage[]).reverse();
}

export async function sendMessage(params: {
  threadId: string;
  body: string;
  file?: File | null;
}): Promise<ChatMessage> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not_authenticated");

  let attachment_path: string | null = null;
  let attachment_type: string | null = null;
  let attachment_size_bytes: number | null = null;

  if (params.file) {
    if (params.file.size > MAX_ATTACHMENT_BYTES) {
      throw new Error("attachment_too_large");
    }
    const ext = params.file.name.split(".").pop() || "bin";
    const path = `${params.threadId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("chat-attachments")
      .upload(path, params.file, {
        cacheControl: "3600",
        contentType: params.file.type,
        upsert: false,
      });
    if (upErr) throw upErr;
    attachment_path = path;
    attachment_type = params.file.type;
    attachment_size_bytes = params.file.size;
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      thread_id: params.threadId,
      sender_id: user.id,
      body: params.body.trim(),
      attachment_path,
      attachment_type,
      attachment_size_bytes,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ChatMessage;
}

export async function softDeleteMessage(id: string) {
  const { error } = await supabase
    .from("chat_messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function getChattableContacts(): Promise<
  Array<{ user_id: string; display_name: string; avatar_url: string | null; role: "coach" | "athlete" }>
> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // People I coach
  const { data: athletes } = await supabase
    .from("coach_athletes")
    .select("athlete_id")
    .eq("coach_id", user.id);
  const athleteIds = (athletes ?? []).map((a) => a.athlete_id);

  // People who coach me
  const { data: coaches } = await supabase
    .from("coach_athletes")
    .select("coach_id")
    .eq("athlete_id", user.id);
  const coachIds = (coaches ?? []).map((c) => c.coach_id);

  // People in my club
  const { data: me } = await supabase
    .from("profiles")
    .select("club_id")
    .eq("user_id", user.id)
    .maybeSingle();
  let clubMateIds: string[] = [];
  if (me?.club_id) {
    const { data: mates } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("club_id", me.club_id)
      .neq("user_id", user.id);
    clubMateIds = (mates ?? []).map((m) => m.user_id);
  }

  const ids = Array.from(new Set([...athleteIds, ...coachIds, ...clubMateIds]));
  if (ids.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, display_name, avatar_url")
    .in("user_id", ids);

  const coachIdSet = new Set(coachIds);
  return (profiles ?? [])
    .map((p) => ({
      user_id: p.user_id,
      display_name: p.display_name || "Unknown",
      avatar_url: p.avatar_url,
      role: coachIdSet.has(p.user_id) ? ("coach" as const) : ("athlete" as const),
    }))
    .sort((a, b) => a.display_name.localeCompare(b.display_name));
}
