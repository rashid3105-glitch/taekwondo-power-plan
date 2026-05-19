import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { AvatarImg } from "@/components/AvatarImg";
import { getChattableContacts, createGroupThread } from "@/lib/chatApi";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (threadId: string) => void;
}

export function NewGroupDialog({ open, onOpenChange, onCreated }: Props) {
  const [contacts, setContacts] = useState<Awaited<ReturnType<typeof getChattableContacts>>>([]);
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setSelected(new Set());
      return;
    }
    setLoading(true);
    getChattableContacts()
      .then(setContacts)
      .finally(() => setLoading(false));
  }, [open]);

  const toggle = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const create = async () => {
    if (!title.trim() || selected.size === 0) {
      toast.error("Tilføj titel og mindst ét medlem");
      return;
    }
    setBusy(true);
    try {
      const id = await createGroupThread(title.trim(), Array.from(selected));
      onCreated(id);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Kunne ikke oprette gruppe");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ny gruppe</DialogTitle>
        </DialogHeader>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Gruppenavn (fx Talenttruppen)"
          maxLength={100}
        />
        <div className="text-xs text-muted-foreground">Vælg medlemmer:</div>
        {selected.size > 0 && contacts.filter((c) => c.is_parent && selected.has(c.user_id)).length > 0 && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
            <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠️</span>
            <span>Du er ved at tilføje en forælder til denne samtale. De vil kunne se al historik og skrive beskeder.</span>
          </div>
        )}
        <div className="max-h-[50vh] overflow-y-auto -mx-2 px-1">
          {loading && (
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground my-4" />
          )}
          {!loading && contacts.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-4">
              Ingen tilgængelige kontakter
            </div>
          )}
          {contacts.filter((c) => !c.is_parent).map((c) => (
            <label
              key={c.user_id}
              className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted cursor-pointer"
            >
              <Checkbox
                checked={selected.has(c.user_id)}
                onCheckedChange={() => toggle(c.user_id)}
              />
              <AvatarImg avatarUrl={c.avatar_url} className="h-8 w-8 rounded-full object-cover" />
              <span className="text-sm flex-1 truncate">{c.display_name}</span>
              {c.role === "coach" && (
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Træner</span>
              )}
            </label>
          ))}
          {contacts.filter((c) => c.is_parent).length > 0 && (
            <>
              <div className="px-2 pt-3 pb-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Forældre</span>
              </div>
              {contacts.filter((c) => c.is_parent).map((c) => (
                <label
                  key={c.user_id}
                  className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={selected.has(c.user_id)}
                    onCheckedChange={() => toggle(c.user_id)}
                  />
                  <AvatarImg avatarUrl={c.avatar_url} className="h-8 w-8 rounded-full object-cover" />
                  <span className="text-sm flex-1 truncate">{c.display_name}</span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Forælder</span>
                </label>
              ))}
            </>
          )}
        </div>
        <Button onClick={create} disabled={busy} className="w-full">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `Opret gruppe (${selected.size})`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
