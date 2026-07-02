// Coach-side dialog for creating one competition for many managed athletes
// at once. Each selected athlete gets an independent row in `competitions`
// (so they can later edit, generate plans, or reflect independently).

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trophy, Search, Users, FileUp, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { AvatarImg } from "@/components/AvatarImg";
import { cn } from "@/lib/utils";

interface AthleteOption {
  user_id: string;
  display_name: string;
  weight_kg?: number | null;
  avatar_url?: string | null;
}

interface Props {
  athletes: AthleteOption[];
  onCreated?: () => void;
}

export function CoachBulkCreateCompetitionDialog({ athletes, onCreated }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Shared fields
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [priority, setPriority] = useState<"A" | "B" | "C">("A");
  const [location, setLocation] = useState("");
  const [invitationFile, setInvitationFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Selection + per-athlete weight overrides
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? athletes.filter((a) => (a.display_name || "").toLowerCase().includes(q))
      : athletes;
    return [...list].sort((a, b) =>
      (a.display_name || "").localeCompare(b.display_name || ""),
    );
  }, [athletes, search]);

  const allSelected = filtered.length > 0 && filtered.every((a) => selected.has(a.user_id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((a) => next.delete(a.user_id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((a) => next.add(a.user_id));
        return next;
      });
    }
  }

  function reset() {
    setName(""); setDate(""); setLocation(""); setPriority("A");
    setSelected(new Set()); setOverrides({}); setSearch("");
    setInvitationFile(null);
  }

  async function submit() {
    if (!name || !date) {
      toast({ title: t("competitionsNameDateRequired"), variant: "destructive" });
      return;
    }
    if (selected.size === 0) {
      toast({ title: t("bulkSelectAtLeastOne"), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const ids = Array.from(selected);
      // Build overrides — fall back to athlete profile weight if no manual override
      const weightOverrides: Record<string, number | null> = {};
      ids.forEach((id) => {
        const manual = overrides[id];
        if (manual !== undefined && manual !== "") {
          weightOverrides[id] = parseFloat(manual);
        } else {
          const a = athletes.find((x) => x.user_id === id);
          if (a?.weight_kg != null) weightOverrides[id] = Number(a.weight_kg);
        }
      });

      // Upload invitation PDF (if attached) to shared storage bucket
      let invitationUrl: string | null = null;
      if (invitationFile) {
        setUploading(true);
        const { data: authData } = await supabase.auth.getUser();
        const uid = authData.user?.id || "anon";
        const safeName = invitationFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${uid}/${Date.now()}-${safeName}`;
        const { error: upErr } = await supabase.storage
          .from("competition-invitations")
          .upload(path, invitationFile, {
            contentType: invitationFile.type || "application/pdf",
            upsert: false,
          });
        setUploading(false);
        if (upErr) throw new Error(upErr.message);
        const { data: pub } = supabase.storage
          .from("competition-invitations")
          .getPublicUrl(path);
        invitationUrl = pub.publicUrl;
      }

      const { data, error } = await supabase.functions.invoke(
        "create-athlete-competitions-bulk",
        {
          body: {
            athlete_ids: ids,
            name,
            event_date: date,
            priority,
            location: location || null,
            weight_overrides: weightOverrides,
            invitation_pdf_url: invitationUrl,
          },
        },
      );
      if (error || (data as any)?.error) {
        throw new Error((data as any)?.error || error?.message);
      }
      const created = (data as any)?.created?.length ?? 0;
      const failed = (data as any)?.failed?.length ?? 0;
      const total = created + failed;

      if (failed === 0) {
        toast({
          title: t("bulkCompetitionCreated"),
          description: t("bulkCreatedSummary").replace("{n}", String(created)).replace("{total}", String(total)),
        });
      } else {
        toast({
          title: t("bulkPartialFailure"),
          description: t("bulkCreatedSummary").replace("{n}", String(created)).replace("{total}", String(total)),
          variant: "destructive",
        });
      }
      reset();
      setOpen(false);
      onCreated?.();
    } catch (e: any) {
      toast({ title: t("error"), description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1" disabled={athletes.length === 0}>
          <Users className="h-3.5 w-3.5" />
          {t("bulkCompetitionButton")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" /> {t("bulkCompetitionTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Shared competition fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Label className="text-xs">{t("competitionsName")} *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nordic Open" maxLength={120} />
            </div>
            <div>
              <Label className="text-xs">{t("competitionsDate")} *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">{t("competitionsPriority")}</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">{t("competitionsPriorityA")}</SelectItem>
                  <SelectItem value="B">{t("competitionsPriorityB")}</SelectItem>
                  <SelectItem value="C">{t("competitionsPriorityC")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t("competitionsLocation")}</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={200} placeholder={t("competitionsLocationPlaceholder")} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">{t("competitionInvitationPdf")}</Label>
              {invitationFile ? (
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                  <FileUp className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm truncate flex-1">{invitationFile.name}</span>
                  <Button
                    type="button" size="icon" variant="ghost" className="h-7 w-7"
                    onClick={() => setInvitationFile(null)}
                    aria-label={t("remove")}
                    title={t("remove")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer rounded-md border border-dashed border-border px-3 py-2 hover:bg-muted/30">
                  <FileUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t("competitionInvitationPdfHint")}</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (f.size > 10 * 1024 * 1024) {
                        toast({ title: t("error"), description: "Max 10 MB", variant: "destructive" });
                        return;
                      }
                      setInvitationFile(f);
                    }}
                  />
                </label>
              )}
            </div>
          </div>


          {/* Athlete selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs">
                {t("selectAthletes")} ({selected.size}/{athletes.length})
              </Label>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs font-medium text-primary hover:underline"
              >
                {allSelected ? t("deselectAll") : t("selectAll")}
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchUsers")}
                className="pl-8 h-9"
              />
            </div>

            <div className="border border-border rounded-md max-h-64 overflow-y-auto divide-y divide-border">
              {filtered.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {t("noResults")}
                </div>
              )}
              {filtered.map((a) => {
                const isSel = selected.has(a.user_id);
                const placeholder = a.weight_kg != null ? String(a.weight_kg) : "—";
                return (
                  <div
                    key={a.user_id}
                    className={cn(
                      "flex items-center gap-2 p-2 transition-colors",
                      isSel && "bg-primary/5",
                    )}
                  >
                    <Checkbox
                      checked={isSel}
                      onCheckedChange={() => toggle(a.user_id)}
                      id={`bulk-${a.user_id}`}
                    />
                    <label
                      htmlFor={`bulk-${a.user_id}`}
                      className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                    >
                      <AvatarImg avatarUrl={a.avatar_url} />
                      <span className="text-sm font-medium text-foreground truncate">
                        {a.display_name || t("noName")}
                      </span>
                    </label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      disabled={!isSel}
                      value={overrides[a.user_id] ?? ""}
                      onChange={(e) =>
                        setOverrides((prev) => ({ ...prev, [a.user_id]: e.target.value }))
                      }
                      placeholder={placeholder}
                      className="h-8 w-20 text-xs"
                      title={t("weightOverride")}
                    />
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {t("weightOverrideHint")}
            </p>
          </div>

          <Button onClick={submit} disabled={submitting || selected.size === 0} className="w-full">
            {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
            {t("createForN").replace("{n}", String(selected.size))}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
