import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Loader2,
  Lock,
  Search,
  BarChart3,
  Brain,
  Apple,
  ClipboardList,
  Video,
  Heart,
  NotebookPen,
  Pencil,
  Save,
  Users,
} from "lucide-react";

const REQUIRED_MODULES = [
  { key: "hub", label: "Hub", desc: "Always available" },
  { key: "plan", label: "Training plan", desc: "Always available" },
] as const;

const OPTIONAL_MODULES = [
  { key: "progress", icon: BarChart3, label: "Progress", desc: "Charts & stats" },
  { key: "mental", icon: Brain, label: "Mental", desc: "Assessment & PDF" },
  { key: "nutrition", icon: Apple, label: "Nutrition", desc: "Meal plans" },
  { key: "testing", icon: ClipboardList, label: "Testing", desc: "Physical tests" },
  { key: "video", icon: Video, label: "Video analysis", desc: "Match tagging" },
  { key: "rehab", icon: Heart, label: "Rehab", desc: "Injury plans" },
  { key: "diary", icon: NotebookPen, label: "Diary", desc: "Notes & mood" },
] as const;

type Club = { id: string; name: string };
type Athlete = { user_id: string; display_name: string; club_id: string | null };

function initials(name: string) {
  return (name || "?")
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AdminModuleAccess() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [clubs, setClubs] = useState<Club[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>("");
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"defaults" | "athlete">("defaults");

  // Defaults per club: clubId -> module -> enabled
  const [allDefaults, setAllDefaults] = useState<Record<string, Record<string, boolean>>>({});
  // Overrides per athlete: userId -> module -> enabled
  const [overridesByAthlete, setOverridesByAthlete] = useState<Record<string, Record<string, boolean>>>({});

  // Working state for editor
  const [defaultsDraft, setDefaultsDraft] = useState<Record<string, boolean>>({});
  const [athleteDraft, setAthleteDraft] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: adminCheck } = await supabase.rpc("is_admin", { _user_id: user.id });
      if (!adminCheck) { navigate("/dashboard"); return; }
      setIsAdmin(true);
      await loadAll();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async () => {
    const [clubsRes, profilesRes, defaultsRes, overridesRes] = await Promise.all([
      supabase.from("clubs" as any).select("id, name").order("name"),
      supabase.from("profiles").select("user_id, display_name, club_id").order("display_name"),
      supabase.from("club_module_defaults" as any).select("club_id, module, enabled"),
      supabase.from("athlete_module_overrides" as any).select("user_id, module, enabled"),
    ]);
    const cl = ((clubsRes.data as any) || []) as Club[];
    setClubs(cl);
    setAthletes(((profilesRes.data as any) || []) as Athlete[]);

    const d: Record<string, Record<string, boolean>> = {};
    for (const r of ((defaultsRes.data as any) || []) as { club_id: string; module: string; enabled: boolean }[]) {
      (d[r.club_id] ||= {})[r.module] = r.enabled;
    }
    setAllDefaults(d);

    const o: Record<string, Record<string, boolean>> = {};
    for (const r of ((overridesRes.data as any) || []) as { user_id: string; module: string; enabled: boolean }[]) {
      (o[r.user_id] ||= {})[r.module] = r.enabled;
    }
    setOverridesByAthlete(o);

    if (!selectedClubId && cl.length > 0) setSelectedClubId(cl[0].id);
  };

  // When club changes, reset draft
  useEffect(() => {
    if (!selectedClubId) return;
    const d = allDefaults[selectedClubId] || {};
    const draft: Record<string, boolean> = {};
    for (const m of OPTIONAL_MODULES) draft[m.key] = d[m.key] ?? true;
    setDefaultsDraft(draft);
    setSelectedAthleteId("");
    setMode("defaults");
  }, [selectedClubId, allDefaults]);

  // When athlete changes, reset athlete draft
  useEffect(() => {
    if (!selectedAthleteId) return;
    const clubDef = allDefaults[selectedClubId] || {};
    const ov = overridesByAthlete[selectedAthleteId] || {};
    const draft: Record<string, boolean> = {};
    for (const m of OPTIONAL_MODULES) {
      draft[m.key] = ov[m.key] ?? clubDef[m.key] ?? true;
    }
    setAthleteDraft(draft);
    setMode("athlete");
  }, [selectedAthleteId, selectedClubId, allDefaults, overridesByAthlete]);

  const clubAthletes = useMemo(() => {
    const list = athletes.filter((a) => a.club_id === selectedClubId);
    const q = search.trim().toLowerCase();
    return q ? list.filter((a) => (a.display_name || "").toLowerCase().includes(q)) : list;
  }, [athletes, selectedClubId, search]);

  const selectedClub = clubs.find((c) => c.id === selectedClubId);
  const selectedAthlete = athletes.find((a) => a.user_id === selectedAthleteId);
  const clubDefForSelected = allDefaults[selectedClubId] || {};

  function moduleCountForAthlete(a: Athlete) {
    const ov = overridesByAthlete[a.user_id] || {};
    const def = allDefaults[a.club_id || ""] || {};
    let enabled = REQUIRED_MODULES.length;
    for (const m of OPTIONAL_MODULES) {
      const v = ov[m.key] ?? def[m.key] ?? true;
      if (v) enabled++;
    }
    return { enabled, total: REQUIRED_MODULES.length + OPTIONAL_MODULES.length };
  }

  const saveDefaults = async () => {
    if (!selectedClubId) return;
    setSaving(true);
    try {
      const rows = OPTIONAL_MODULES.map((m) => ({
        club_id: selectedClubId,
        module: m.key,
        enabled: !!defaultsDraft[m.key],
      }));
      const { error } = await supabase
        .from("club_module_defaults" as any)
        .upsert(rows as any, { onConflict: "club_id,module" });
      if (error) throw error;
      toast({ title: "Club defaults saved" });
      await loadAll();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const saveAthlete = async () => {
    if (!selectedAthleteId) return;
    setSaving(true);
    try {
      const toUpsert: { user_id: string; module: string; enabled: boolean }[] = [];
      const toDelete: string[] = [];
      for (const m of OPTIONAL_MODULES) {
        const clubDefault = clubDefForSelected[m.key] ?? true;
        const value = !!athleteDraft[m.key];
        if (value !== clubDefault) {
          toUpsert.push({ user_id: selectedAthleteId, module: m.key, enabled: value });
        } else {
          toDelete.push(m.key);
        }
      }
      if (toUpsert.length > 0) {
        const { error } = await supabase
          .from("athlete_module_overrides" as any)
          .upsert(toUpsert as any, { onConflict: "user_id,module" });
        if (error) throw error;
      }
      if (toDelete.length > 0) {
        const { error } = await supabase
          .from("athlete_module_overrides" as any)
          .delete()
          .eq("user_id", selectedAthleteId)
          .in("module", toDelete);
        if (error) throw error;
      }
      toast({ title: "Athlete overrides saved" });
      await loadAll();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const enabledCountAthlete =
    REQUIRED_MODULES.length + OPTIONAL_MODULES.filter((m) => athleteDraft[m.key]).length;

  const hasUnsavedAthlete = useMemo(() => {
    const ov = overridesByAthlete[selectedAthleteId] || {};
    for (const m of OPTIONAL_MODULES) {
      const current = ov[m.key] ?? clubDefForSelected[m.key] ?? true;
      if (!!athleteDraft[m.key] !== current) return true;
    }
    return false;
  }, [athleteDraft, overridesByAthlete, selectedAthleteId, clubDefForSelected]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/approval")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-xl font-extrabold text-foreground">Module Access</h1>
        </div>

        <div className="grid gap-4 lg:grid-cols-[230px,1fr]">
          {/* Left panel */}
          <aside className="rounded-xl border border-border bg-card p-3 space-y-3 h-fit">
            <select
              value={selectedClubId}
              onChange={(e) => setSelectedClubId(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
            >
              {clubs.length === 0 && <option value="">No clubs</option>}
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => { setSelectedAthleteId(""); setMode("defaults"); }}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Set defaults for this club →
            </button>

            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {clubAthletes.length} athletes
            </div>

            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search athletes"
                className="pl-7 h-9 text-sm"
              />
            </div>

            <div className="space-y-1 max-h-[60vh] overflow-y-auto -mx-1 px-1">
              {clubAthletes.map((a) => {
                const { enabled, total } = moduleCountForAthlete(a);
                const active = a.user_id === selectedAthleteId;
                return (
                  <button
                    key={a.user_id}
                    type="button"
                    onClick={() => setSelectedAthleteId(a.user_id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-md text-left transition-colors border-l-2 ${
                      active
                        ? "bg-primary/10 border-l-primary"
                        : "border-l-transparent hover:bg-accent/40"
                    }`}
                  >
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold shrink-0">
                      {initials(a.display_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate">{a.display_name || "—"}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {enabled} / {total} modules
                      </div>
                    </div>
                  </button>
                );
              })}
              {clubAthletes.length === 0 && (
                <p className="text-xs text-muted-foreground p-2">No athletes in this club.</p>
              )}
            </div>
          </aside>

          {/* Right panel */}
          <main className="rounded-xl border border-border bg-card p-4 sm:p-6">
            {mode === "defaults" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h2 className="text-lg font-bold">
                    {selectedClub?.name || "—"} — Club defaults
                  </h2>
                  <Button size="sm" onClick={saveDefaults} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                    Save
                  </Button>
                </div>

                <div className="rounded-md bg-muted/40 border border-border p-3 text-xs text-muted-foreground">
                  These are the default modules for all athletes in this club.
                  Individual athletes can be overridden separately.
                </div>

                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                    Required modules
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {REQUIRED_MODULES.map((m) => (
                      <div
                        key={m.key}
                        className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-3 opacity-70"
                      >
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-semibold">{m.label}</div>
                          <div className="text-xs text-muted-foreground">{m.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                    Optional modules
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {OPTIONAL_MODULES.map((m) => {
                      const Icon = m.icon;
                      const checked = !!defaultsDraft[m.key];
                      return (
                        <label
                          key={m.key}
                          className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                            checked ? "border-primary/40 bg-primary/5" : "border-border"
                          }`}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) =>
                              setDefaultsDraft((d) => ({ ...d, [m.key]: !!v }))
                            }
                          />
                          <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="text-sm font-semibold">{m.label}</div>
                            <div className="text-xs text-muted-foreground">{m.desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </section>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold">{selectedAthlete?.display_name || "—"}</h2>
                    {selectedClub && <Badge variant="secondary">{selectedClub.name}</Badge>}
                    <span className="text-xs text-muted-foreground">
                      {enabledCountAthlete} / {REQUIRED_MODULES.length + OPTIONAL_MODULES.length} modules
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setAthleteDraft(Object.fromEntries(OPTIONAL_MODULES.map((m) => [m.key, true])))
                      }
                    >
                      Enable all
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setAthleteDraft(Object.fromEntries(OPTIONAL_MODULES.map((m) => [m.key, false])))
                      }
                    >
                      Disable all
                    </Button>
                    <Button size="sm" onClick={saveAthlete} disabled={saving || !hasUnsavedAthlete}>
                      {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                      Save changes
                    </Button>
                  </div>
                </div>

                <div className="rounded-md bg-muted/40 border border-border p-3 text-xs text-muted-foreground">
                  Club default for {selectedClub?.name}:{" "}
                  {OPTIONAL_MODULES.filter((m) => clubDefForSelected[m.key] ?? true)
                    .map((m) => m.label)
                    .join(", ") || "none"}
                  . Changes here override the club default for this athlete only.
                </div>

                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                    Required modules
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {REQUIRED_MODULES.map((m) => (
                      <div
                        key={m.key}
                        className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-3 opacity-70"
                      >
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-semibold">{m.label}</div>
                          <div className="text-xs text-muted-foreground">{m.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                    Optional modules
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {OPTIONAL_MODULES.map((m) => {
                      const Icon = m.icon;
                      const checked = !!athleteDraft[m.key];
                      const clubDefault = clubDefForSelected[m.key] ?? true;
                      const overridden = checked !== clubDefault;
                      return (
                        <label
                          key={m.key}
                          className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                            checked
                              ? "border-emerald-500/40 bg-emerald-500/5"
                              : "border-border bg-muted/20"
                          }`}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) =>
                              setAthleteDraft((d) => ({ ...d, [m.key]: !!v }))
                            }
                          />
                          <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold">{m.label}</span>
                              {overridden ? (
                                <Badge variant="outline" className="gap-1 text-[10px]">
                                  <Pencil className="h-2.5 w-2.5" /> Overridden
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px]">Club default</Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">{m.desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </section>

                {hasUnsavedAthlete && (
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 p-3 text-xs">
                    You have unsaved changes for this athlete.
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
