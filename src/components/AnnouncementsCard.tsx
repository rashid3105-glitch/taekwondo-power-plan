import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, X } from "lucide-react";

interface Row {
  id: string;
  announcement: {
    id: string;
    title: string;
    body: string;
    created_at: string;
  } | null;
}

/**
 * Shows unread announcements sent by the platform administrator.
 */
export function AnnouncementsCard() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) return;

      const { data } = await supabase
        .from("admin_announcement_recipients" as any)
        .select("id, announcement:admin_announcements(id, title, body, created_at)")
        .eq("recipient_id", uid)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(10);

      if (active && data) setRows(data as unknown as Row[]);
    })();
    return () => { active = false; };
  }, []);

  const dismiss = async (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    await supabase.from("admin_announcement_recipients" as any).update({ is_read: true }).eq("id", id);
  };

  const visible = rows.filter((r) => r.announcement);
  if (visible.length === 0) return null;

  return (
    <section className="rounded-2xl border border-[#c9a84c]/30 bg-[#141414] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Megaphone className="h-4 w-4 text-[#c9a84c]" />
        <h3 className="text-sm font-semibold text-foreground">Beskeder</h3>
      </div>
      <ul className="space-y-2">
        {visible.map((r) => (
          <li key={r.id} className="flex items-start gap-3 rounded-xl bg-white/5 px-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{r.announcement!.title}</p>
              <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{r.announcement!.body}</p>
            </div>
            <button
              onClick={() => dismiss(r.id)}
              aria-label="Luk"
              title="Luk"
              className="shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default AnnouncementsCard;
