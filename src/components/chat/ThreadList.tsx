import { useState, useEffect } from "react";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AvatarImg } from "@/components/AvatarImg";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { ChatThread } from "@/lib/chatApi";

interface Props {
  threads: ChatThread[];
  selectedId?: string | null;
  onSelect: (t: ChatThread) => void;
  loading?: boolean;
}

export function ThreadList({ threads, selectedId, onSelect, loading }: Props) {
  const [meId, setMeId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setMeId(user?.id ?? null));
  }, []);

  const filtered = threads.filter((t) => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    const title = t.kind === "group"
      ? t.title || ""
      : t.members.find((m) => m.user_id !== meId)?.display_name || "";
    return title.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Søg…"
            className="pl-8 h-9"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading && threads.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-6">Indlæser…</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-12 px-4">
            Ingen samtaler endnu. Start en ved at vælge en kontakt.
          </div>
        )}
        {filtered.map((t) => {
          const other = t.members.find((m) => m.user_id !== meId);
          const title = t.kind === "group" ? (t.title || "Gruppe") : (other?.display_name || "Samtale");
          const preview = t.last_message?.body
            ? t.last_message.body
            : t.last_message?.attachment_path
              ? "📎 Vedhæftning"
              : "Ingen beskeder";
          const unread = t.unread_count ?? 0;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 border-b border-border text-left hover:bg-muted/50 transition",
                selectedId === t.id && "bg-muted",
              )}
            >
              {t.kind === "group" ? (
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
              ) : (
                <AvatarImg
                  avatarUrl={other?.avatar_url}
                  className="h-10 w-10 rounded-full object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm truncate flex-1", unread > 0 && "font-semibold")}>
                    {title}
                  </span>
                  {unread > 0 && (
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                      {unread}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">{preview}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
