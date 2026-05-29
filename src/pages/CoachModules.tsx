import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ATHLETE_MODULES } from "@/config/modules";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface AthleteOption { id: string; name: string; }
type Tab = "club" | "athlete";

export default function CoachModules() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("club");

  const [coachId, setCoachId] = useState<string | null>(null);
  const [clubId, setClubId] = useState<string | null>(null);
  const [bootLoading, setBootLoading] = useState(true);

  // Club defaults
  const [clubMap, setClubMap] = useState<Record<string, boolean>>({});
  const [clubLoading, setClubLoading] = useState(true);

  // Athletes + overrides
  const [athletes, setAthletes] = useState<AthleteOption[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<string>("");
  const [overrideMap, setOverrideMap] = useState<Record<string, boolean | undefined>>({});
  const [athleteLoading, setAthleteLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setBootLoading(false); setClubLoading(false); return; }
      setCoachId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("club_id")
        .eq("user_id", user.id)
        .maybeSingle();
      const cid = (profile as any)?.club_id ?? null;
      setClubId(cid);

      // Club defaults
      if (cid) {
        const { data: defaults } = await supabase
          .from("club_module_defaults" as any)
          .select("module, enabled")
          .eq("club_id", cid);
        const map: Record<string, boolean> = {};
        ((defaults as any) ?? []).forEach((r: any) => { map[r.module] = !!r.enabled; });
        setClubMap(map);
      }
      setClubLoading(false);

      // Athletes list (managed + club members)
      const { data: links } = await supabase
        .from("coach_athletes")
        .select("athlete_id")
        .eq("coach_id", user.id);
      const ids = new Set<string>(((links as any) ?? []).map((l: any) => l.athlete_id));
      if (cid) {
        const { data: clubMembers } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("club_id", cid)
          .neq("user_id", user.id);
        ((clubMembers as any) ?? []).forEach((m: any) => ids.add(m.user_id));
      }
      const idArr = Array.from(ids);
      if (idArr.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", idArr);
        const list = ((profs as any) ?? [])
          .map((p: any) => ({ id: p.user_id, name: p.display_name || "Atlet" }))
          .sort((a: AthleteOption, b: AthleteOption) => a.name.localeCompare(b.name));
        setAthletes(list);
        if (list.length > 0) setSelectedAthlete(list[0].id);
      }
      setBootLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedAthlete) return;
    setAthleteLoading(true);
    (async () => {
      const { data } = await supabase
        .from("athlete_module_overrides" as any)
        .select("module, enabled")
        .eq("user_id", selectedAthlete);
      const map: Record<string, boolean> = {};
      ((data as any) ?? []).forEach((r: any) => { map[r.module] = !!r.enabled; });
      setOverrideMap(map);
      setAthleteLoading(false);
    })();
  }, [selectedAthlete]);

  // ---------- mutations ----------
  const toggleClub = async (moduleKey: string, next: boolean) => {
    if (!clubId) return;
    const prev = clubMap[moduleKey];
    setClubMap((m) => ({ ...m, [moduleKey]: next }));
    const { error } = await supabase
      .from("club_module_defaults" as any)
      .upsert(
        { club_id: clubId, module: moduleKey, enabled: next },
        { onConflict: "club_id,module" }
      );
    if (error) {
      setClubMap((m) => ({ ...m, [moduleKey]: prev as boolean }));
      toast.error("Kunne ikke gemme klub-standard");
    }
  };

  const toggleOverride = async (moduleKey: string, next: boolean) => {
    if (!selectedAthlete) return;
    const prev = overrideMap[moduleKey];
    setOverrideMap((m) => ({ ...m, [moduleKey]: next }));
    const { error } = await supabase
      .from("athlete_module_overrides" as any)
      .upsert(
        { user_id: selectedAthlete, module: moduleKey, enabled: next },
        { onConflict: "user_id,module" }
      );
    if (error) {
      setOverrideMap((m) => ({ ...m, [moduleKey]: prev }));
      toast.error("Kunne ikke gemme overstyring");
    }
  };

  const resetOverride = async (moduleKey: string) => {
    if (!selectedAthlete) return;
    const prev = overrideMap[moduleKey];
    setOverrideMap((m) => { const c = { ...m }; delete c[moduleKey]; return c; });
    const { error } = await supabase
      .from("athlete_module_overrides" as any)
      .delete()
      .eq("user_id", selectedAthlete)
      .eq("module", moduleKey);
    if (error) {
      setOverrideMap((m) => ({ ...m, [moduleKey]: prev }));
      toast.error("Kunne ikke nulstille");
    }
  };

  const resolvedFor = (moduleKey: string): boolean => {
    if (overrideMap[moduleKey] !== undefined) return !!overrideMap[moduleKey];
    if (clubMap[moduleKey] !== undefined) return clubMap[moduleKey];
    return true;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Tilbage" className="p-1 -ml-1 text-white/70 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-heading">Administrer moduler</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/10">
          <button
            onClick={() => setTab("club")}
            disabled={!clubId}
            className={`flex-1 h-10 rounded-lg text-sm font-medium transition-colors ${
              tab === "club" ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            Hele klubben
          </button>
          <button
            onClick={() => setTab("athlete")}
            className={`flex-1 h-10 rounded-lg text-sm font-medium transition-colors ${
              tab === "athlete" ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
            }`}
          >
            Pr. atlet
          </button>
        </div>

        {bootLoading ? (
          <div className="space-y-3">
            {ATHLETE_MODULES.map((m) => (
              <div key={m.key} className="h-20 bg-white/10 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : tab === "club" ? (
          !clubId ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center text-white/60 text-sm">
              Du er ikke tilknyttet en klub endnu.
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {clubLoading ? ATHLETE_MODULES.map((m) => (
                <div key={m.key} className="h-20 bg-white/10 animate-pulse rounded-xl" />
              )) : ATHLETE_MODULES.map((m) => {
                const Icon = m.icon;
                const on = clubMap[m.key] ?? true;
                return (
                  <div
                    key={m.key}
                    className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: on ? "var(--accent-hex, #ef4444)20" : "rgba(255,255,255,0.05)" }}
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{ color: on ? "var(--accent-hex, #ef4444)" : "rgba(255,255,255,0.4)" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[14px] font-semibold ${on ? "text-white" : "text-white/50"}`}>{m.label}</p>
                      <p className="text-[12px] text-white/50 mt-0.5">{m.desc}</p>
                    </div>
                    <Switch
                      checked={on}
                      onCheckedChange={(v) => toggleClub(m.key, v)}
                      style={on ? { backgroundColor: "var(--accent-hex, #ef4444)" } : undefined}
                    />
                  </div>
                );
              })}
              <p className="text-[11px] text-white/40 px-1">
                Klub-standarder gælder for alle atleter, medmindre du overstyrer pr. atlet.
              </p>
            </div>
          )
        ) : (
          // ATHLETE TAB
          athletes.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center text-white/60 text-sm">
              Ingen atleter tilknyttet endnu.
            </div>
          ) : (
            <>
              <label className="block">
                <span className="text-label block mb-2">Vælg atlet</span>
                <select
                  value={selectedAthlete}
                  onChange={(e) => setSelectedAthlete(e.target.value)}
                  className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white focus:outline-none focus:border-white/20"
                >
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id} className="bg-[#0a0a0a]">{a.name}</option>
                  ))}
                </select>
              </label>

              <div className="space-y-3 pt-2">
                {athleteLoading ? ATHLETE_MODULES.map((m) => (
                  <div key={m.key} className="h-20 bg-white/10 animate-pulse rounded-xl" />
                )) : ATHLETE_MODULES.map((m) => {
                  const Icon = m.icon;
                  const on = resolvedFor(m.key);
                  const isOverride = overrideMap[m.key] !== undefined;
                  return (
                    <div
                      key={m.key}
                      className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: on ? "var(--accent-hex, #ef4444)20" : "rgba(255,255,255,0.05)" }}
                      >
                        <Icon
                          className="h-5 w-5"
                          style={{ color: on ? "var(--accent-hex, #ef4444)" : "rgba(255,255,255,0.4)" }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-[14px] font-semibold ${on ? "text-white" : "text-white/50"}`}>{m.label}</p>
                          {isOverride && (
                            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                              Overstyret
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-white/50 mt-0.5">{m.desc}</p>
                      </div>
                      {isOverride && (
                        <button
                          onClick={() => resetOverride(m.key)}
                          aria-label="Nulstil til klub"
                          className="p-2 text-white/50 hover:text-white"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                      <Switch
                        checked={on}
                        onCheckedChange={(v) => toggleOverride(m.key, v)}
                        style={on ? { backgroundColor: "var(--accent-hex, #ef4444)" } : undefined}
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )
        )}
      </main>
    </div>
  );
}
