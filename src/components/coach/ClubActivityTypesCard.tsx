import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2, Tag, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

interface ClubActivityType {
  id: string;
  club_id: string;
  label: string;
  sort_order: number;
  is_active: boolean;
}

interface Props {
  clubId: string;
}

export function ClubActivityTypesCard({ clubId }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ClubActivityType[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("club_activity_types" as any)
      .select("id, club_id, label, sort_order, is_active")
      .eq("club_id", clubId)
      .order("sort_order", { ascending: true });
    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    }
    setItems(((data as unknown as ClubActivityType[]) || []));
    setLoading(false);
  };

  useEffect(() => {
    if (clubId) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  const add = async () => {
    const label = newLabel.trim();
    if (!label) return;
    setAdding(true);
    const nextOrder = items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("club_activity_types" as any).insert({
      club_id: clubId,
      label,
      sort_order: nextOrder,
      is_active: true,
      created_by: user?.id ?? null,
    } as any);
    setAdding(false);
    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
      return;
    }
    setNewLabel("");
    await load();
  };

  const rename = async (id: string, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const { error } = await supabase
      .from("club_activity_types" as any)
      .update({ label: trimmed } as any)
      .eq("id", id);
    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, label: trimmed } : i)));
  };

  const toggle = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("club_activity_types" as any)
      .update({ is_active: isActive } as any)
      .eq("id", id);
    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_active: isActive } : i)));
  };

  const remove = async (id: string) => {
    if (!confirm(t("activityTypeDeleteConfirm") || "Slet aktivitetstypen? Eksisterende logs beholder navnet.")) return;
    const { error } = await supabase.from("club_activity_types" as any).delete().eq("id", id);
    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-self" />
        <h3 className="text-sm font-bold text-card-foreground">
          {t("activityTypesTitle") || "Aktivitetstyper (egen træning)"}
        </h3>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("activityTypesDesc") ||
          "Disse typer kan atleterne vælge når de logger egen træning. Slå fra eller slet for at fjerne dem som fremtidigt valg — eksisterende logs ændres ikke."}
      </p>

      <ul className="space-y-1.5">
        {items.map((it) => (
          <li
            key={it.id}
            className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-2 py-1.5"
          >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Input
              defaultValue={it.label}
              onBlur={(e) => {
                if (e.target.value.trim() !== it.label) {
                  void rename(it.id, e.target.value);
                }
              }}
              className="h-9 flex-1"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <Switch
                checked={it.is_active}
                onCheckedChange={(v) => void toggle(it.id, v)}
                aria-label={t("active") || "Aktiv"}
              />
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 text-destructive"
              onClick={() => void remove(it.id)}
              aria-label={t("delete")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-xs text-muted-foreground py-2">
            {t("activityTypesEmpty") || "Ingen typer endnu — tilføj din første nedenfor."}
          </li>
        )}
      </ul>

      <div className="flex items-center gap-2 pt-1">
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder={t("activityTypeNewPlaceholder") || "Ny type (fx Løb)"}
          className="h-10 flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void add();
            }
          }}
        />
        <Button onClick={add} disabled={adding || !newLabel.trim()} size="sm">
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          <span className="hidden sm:inline ml-1">{t("add") || "Tilføj"}</span>
        </Button>
      </div>
    </div>
  );
}
