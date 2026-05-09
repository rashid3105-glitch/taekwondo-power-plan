import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { AvatarImg } from "@/components/AvatarImg";
import { getChattableContacts, startDirectThread } from "@/lib/chatApi";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStarted: (threadId: string) => void;
}

export function StartChatPicker({ open, onOpenChange, onStarted }: Props) {
  const [contacts, setContacts] = useState<Awaited<ReturnType<typeof getChattableContacts>>>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getChattableContacts()
      .then(setContacts)
      .catch((e) => toast.error(e?.message || "Fejl"))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = contacts.filter((c) =>
    c.display_name.toLowerCase().includes(filter.toLowerCase()),
  );

  const handlePick = async (userId: string) => {
    setBusyId(userId);
    try {
      const id = await startDirectThread(userId);
      onStarted(id);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Kunne ikke starte samtale");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ny samtale</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Søg kontakt…"
            className="pl-8"
          />
        </div>
        <div className="max-h-[60vh] overflow-y-auto -mx-6 px-2">
          {loading && (
            <div className="text-center py-6">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-6">
              Ingen kontakter fundet
            </div>
          )}
          {filtered.map((c) => (
            <button
              key={c.user_id}
              onClick={() => handlePick(c.user_id)}
              disabled={busyId === c.user_id}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-left disabled:opacity-50"
            >
              <AvatarImg avatarUrl={c.avatar_url} className="h-9 w-9 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{c.display_name}</div>
                <div className="text-[11px] text-muted-foreground capitalize">{c.role}</div>
              </div>
              {busyId === c.user_id && <Loader2 className="h-4 w-4 animate-spin" />}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
