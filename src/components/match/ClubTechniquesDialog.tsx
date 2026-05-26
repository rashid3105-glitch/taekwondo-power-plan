import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Discipline } from "@/lib/tkdTechniques";

export interface ClubTechnique {
  id: string;
  name: string;
  category: string;
  discipline: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clubId: string;
  discipline: Discipline;
  onChanged: () => void;
}

const CATEGORIES = ["attack", "defense", "transition"] as const;
const DISCIPLINES = ["sparring", "poomsae", "both"] as const;

export function ClubTechniquesDialog({ open, onOpenChange, clubId, discipline, onChanged }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [items, setItems] = useState<ClubTechnique[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<string>("attack");
  const [newDiscipline, setNewDiscipline] = useState<string>(discipline);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("attack");
  const [editDiscipline, setEditDiscipline] = useState("both");

  useEffect(() => {
    if (open) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, clubId, discipline]);

  async function load() {
    setLoading(true);
    const { data } = await (supabase.from as any)("club_techniques")
      .select("id, name, category, discipline")
      .eq("club_id", clubId)
      .in("discipline", [discipline, "both"])
      .order("name");
    setItems((data ?? []) as ClubTechnique[]);
    setLoading(false);
  }

  async function add() {
    if (!newName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase.from as any)("club_techniques").insert({
      club_id: clubId,
      name: newName.trim(),
      category: newCategory,
      discipline: newDiscipline,
      created_by: user?.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setNewName("");
    setShowAdd(false);
    await load();
    onChanged();
  }

  function startEdit(it: ClubTechnique) {
    setEditId(it.id);
    setEditName(it.name);
    setEditCategory(it.category);
    setEditDiscipline(it.discipline);
  }

  async function saveEdit() {
    if (!editId || !editName.trim()) return;
    const { error } = await (supabase.from as any)("club_techniques")
      .update({ name: editName.trim(), category: editCategory, discipline: editDiscipline })
      .eq("id", editId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setEditId(null);
    await load();
    onChanged();
  }

  async function remove(id: string) {
    if (!confirm(t("matchDeleteTechniqueConfirm"))) return;
    const { error } = await (supabase.from as any)("club_techniques").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    await load();
    onChanged();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("matchManageTechniques")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {!showAdd ? (
            <Button size="sm" variant="outline" onClick={() => setShowAdd(true)} className="w-full">
              <Plus className="h-3.5 w-3.5 mr-1" /> {t("matchAddTechnique")}
            </Button>
          ) : (
            <div className="border rounded-lg p-3 space-y-2">
              <div>
                <Label className="text-xs">{t("matchTechniqueName")}</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="h-9" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">{t("matchTechCategory")}</Label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(`matchTechCat_${c}` as any)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{t("matchTechDiscipline")}</Label>
                  <Select value={newDiscipline} onValueChange={setNewDiscipline}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DISCIPLINES.map((d) => <SelectItem key={d} value={d}>{t(`matchTechDisc_${d}` as any)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={add} disabled={!newName.trim()}>{t("matchAddTechnique")}</Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowAdd(false); setNewName(""); }}>{t("cancel")}</Button>
              </div>
            </div>
          )}

          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin mx-auto my-4" />
          ) : items.length === 0 ? (
            <div className="text-xs text-muted-foreground italic text-center py-4">
              {t("matchNoCustomTechniques")}
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((it) => editId === it.id ? (
                <div key={it.id} className="border rounded-lg p-2 space-y-2">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-9" />
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={editCategory} onValueChange={setEditCategory}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(`matchTechCat_${c}` as any)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={editDiscipline} onValueChange={setEditDiscipline}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DISCIPLINES.map((d) => <SelectItem key={d} value={d}>{t(`matchTechDisc_${d}` as any)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit}><Check className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditId(null)}><X className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ) : (
                <div key={it.id} className="flex items-center gap-2 px-2 py-2 rounded border border-border">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{it.name}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {t(`matchTechCat_${it.category}` as any)} · {t(`matchTechDisc_${it.discipline}` as any)}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => startEdit(it)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => remove(it.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
