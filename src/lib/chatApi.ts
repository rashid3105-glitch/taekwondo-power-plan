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
    archived_at: string | null;
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

export async function addGroupMember(threadId: string, userId: string) {
  const { error } = await supabase.rpc("add_chat_group_member", {
    _thread: threadId,
    _user: userId,
  });
  if (error) throw error;
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
    .from("club_directory" as any)
    .select("user_id, display_name, avatar_url")
    .in("user_id", userIds);
  const profileMap = new Map(((profiles ?? []) as any[]).map((p: any) => [p.user_id, p]));

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
          archived_at: m.archived_at ?? null,
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

  // Fire-and-forget push notification via server-side wrapper.
  // The wrapper validates thread membership and translates per recipient locale.
  void supabase.functions.invoke("notify-chat-message", {
    body: {
      thread_id: params.threadId,
      preview: params.body.trim().slice(0, 120),
    },
  }).catch(() => { /* silent */ });

  return data as ChatMessage;
}

export async function softDeleteMessage(id: string) {
  const { error } = await supabase.rpc("delete_chat_message", { _id: id });
  if (error) throw error;
}

export async function getChattableContacts(): Promise<
  Array<{ user_id: string; display_name: string; avatar_url: string | null; role: "coach" | "athlete" | "parent"; is_parent: boolean }>
> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Resolve the active club from localStorage (set by ActiveClubContext).
  // Falling back to the user's primary profile.club_id keeps athletes uden klubvælger sigtet.
  let activeClubId: string | null = null;
  try {
    if (typeof window !== "undefined") {
      activeClubId = window.localStorage.getItem("activeClubId:" + user.id);
    }
  } catch { /* ignore */ }

  const { data: me } = await supabase
    .from("profiles")
    .select("club_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const effectiveClubId: string | null = activeClubId || (me?.club_id ?? null);

  // Club-mates strictly from the active club.
  let clubMateIds: string[] = [];
  let clubProfiles: Array<{ user_id: string; display_name: string | null; avatar_url: string | null }> = [];
  if (effectiveClubId) {
    const { data: cp } = await supabase
      .from("club_directory" as any)
      .select("user_id, display_name, avatar_url")
      .eq("club_id", effectiveClubId)
      .neq("user_id", user.id);
    clubProfiles = ((cp ?? []) as any[]) as typeof clubProfiles;
    clubMateIds = clubProfiles.map((p) => p.user_id);
  }

  // Coach links scoped to the active club, so atleter fra andre klubber ikke optræder som kontakter.
  let athleteIds: string[] = [];
  let coachIds: string[] = [];
  if (effectiveClubId) {
    const { data: athletes } = await supabase
      .from("coach_athletes")
      .select("athlete_id")
      .eq("coach_id", user.id)
      .eq("club_id", effectiveClubId);
    athleteIds = (athletes ?? []).map((a: any) => a.athlete_id);

    const { data: coaches } = await supabase
      .from("coach_athletes")
      .select("coach_id")
      .eq("athlete_id", user.id)
      .eq("club_id", effectiveClubId);
    coachIds = (coaches ?? []).map((c: any) => c.coach_id);
  }

  const ids = Array.from(new Set([...athleteIds, ...coachIds, ...clubMateIds]));

  const { data: linkedProfiles } = ids.length === 0
    ? { data: [] as Array<{ user_id: string; display_name: string | null; avatar_url: string | null }> }
    : await supabase
        .from("club_directory" as any)
        .select("user_id, display_name, avatar_url")
        .in("user_id", ids);

  const profileMap = new Map<string, { user_id: string; display_name: string | null; avatar_url: string | null }>();
  for (const p of [...((linkedProfiles ?? []) as any[]), ...clubProfiles]) {
    profileMap.set((p as any).user_id, p as any);
  }
  const profiles = Array.from(profileMap.values());


  // Also include parents linked to athletes I coach
  let parentIds: string[] = [];
  if (athleteIds.length > 0) {
    const { data: parentLinks } = await supabase
      .from("parent_athletes")
      .select("parent_user_id")
      .in("athlete_id", athleteIds);
    parentIds = (parentLinks ?? []).map((p: any) => p.parent_user_id);
  }
  // Also include parents linked to any athlete in my club (RLS allows coaches/admins)
  let clubParentIds: string[] = [];
  if (clubMateIds.length > 0) {
    const { data: clubParentLinks } = await supabase
      .from("parent_athletes")
      .select("parent_user_id")
      .in("athlete_id", clubMateIds);
    clubParentIds = (clubParentLinks ?? []).map((p: any) => p.parent_user_id);
  }
  // Also include my own parents (if I'm an athlete)
  const { data: myParentLinks } = await supabase
    .from("parent_athletes")
    .select("parent_user_id")
    .eq("athlete_id", user.id);
  const myParentIds = (myParentLinks ?? []).map((p: any) => p.parent_user_id);

  const allParentIds = Array.from(
    new Set([...parentIds, ...clubParentIds, ...myParentIds]),
  ).filter((id) => id !== user.id);

  let parentProfiles: Array<{ user_id: string; display_name: string | null; avatar_url: string | null }> = [];
  if (allParentIds.length > 0) {
    const { data: pp } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", allParentIds);
    parentProfiles = (pp ?? []) as typeof parentProfiles;
  }

  const coachIdSet = new Set(coachIds);

  const regularContacts = (profiles ?? []).map((p) => ({
    user_id: p.user_id,
    display_name: p.display_name || "Unknown",
    avatar_url: p.avatar_url,
    role: coachIdSet.has(p.user_id) ? ("coach" as const) : ("athlete" as const),
    is_parent: false,
  }));

  const parentContacts = parentProfiles
    .filter((p) => !ids.includes(p.user_id))
    .map((p) => ({
      user_id: p.user_id,
      display_name: `${p.display_name || "Unknown"} (P)`,
      avatar_url: p.avatar_url,
      role: "parent" as const,
      is_parent: true,
    }));

  return [...regularContacts, ...parentContacts].sort((a, b) =>
    a.display_name.localeCompare(b.display_name),
  );
}

export async function addReaction(messageId: string, emoji: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not_authenticated");
  const { error } = await supabase
    .from("chat_reactions")
    .upsert(
      { message_id: messageId, user_id: user.id, emoji },
      { onConflict: "message_id,user_id,emoji" },
    );
  if (error) throw error;
}

export async function removeReaction(messageId: string, emoji: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase
    .from("chat_reactions")
    .delete()
    .eq("message_id", messageId)
    .eq("user_id", user.id)
    .eq("emoji", emoji);
  if (error) throw error;
}

export async function archiveThread(threadId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not_authenticated");
  const { error } = await supabase
    .from("chat_thread_members")
    .update({ archived_at: new Date().toISOString() } as any)
    .eq("thread_id", threadId)
    .eq("user_id", user.id);
  if (error) throw error;
}

export async function unarchiveThread(threadId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not_authenticated");
  const { error } = await supabase
    .from("chat_thread_members")
    .update({ archived_at: null } as any)
    .eq("thread_id", threadId)
    .eq("user_id", user.id);
  if (error) throw error;
}

export async function removeThreadMember(threadId: string, userId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not_authenticated");
  const { data: thread } = await supabase
    .from("chat_threads")
    .select("created_by")
    .eq("id", threadId)
    .maybeSingle();
  const isCreator = (thread as any)?.created_by === user.id;
  const isSelf = userId === user.id;
  if (!isCreator && !isSelf) throw new Error("not_authorized");
  await supabase
    .from("chat_thread_members")
    .delete()
    .eq("thread_id", threadId)
    .eq("user_id", userId);
}
