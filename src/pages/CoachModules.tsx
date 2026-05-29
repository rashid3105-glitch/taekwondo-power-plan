import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ATHLETE_MODULES } from "@/config/modules";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface AthleteOption { id: string; name: string; }

export default function CoachModules() {
  const navigate = useNavigate();
  const [coachId, setCoachId] = useState<string | null>(null);
  const [athletes, setAthletes] = useState<AthleteOption[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<string>("");
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({});
  const [loadingAthletes, setLoadingAthletes] = useState(true);
  const [loadingModules, setLoadingModules] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingAthletes(false); return; }
      setCoachId(user.id);
      const { data: links } = await supabase
        .from("coach_athletes")
        .select("athlete_id")
        .eq("coach_id", user.id);
      const ids = (links ?? []).map((l: any) => l.athlete_id);
      if (ids.length === 0) {
        setAthletes([]);
        setLoadingAthletes(false);
        return;
      }
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", ids);
      const list = (profs ?? [])
        .map((p: any) => ({ id: p.user_id, name: p.display_name || "Atlet" }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setAthletes(list);
      if (list.length > 0) setSelectedAthlete(list[0].id);
      setLoadingAthletes(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedAthlete) return;
    setLoadingModules(true);
    (async () => {
      const { data } = await supabase
        .from("athlete_modules")
        .select("module_key, enabled")
        .eq("athlete_id", selectedAthlete);
      const map: Record<string, boolean> = {};
      (data ?? []).forEach((r: any) => { map[r.module_key] = !!r.enabled; });
      setEnabledMap(map);
      setLoadingModules(false);
    })();
  }, [selectedAthlete]);

  const toggle = async (moduleKey: string, next: boolean) => {
    if (!coachId || !selectedAthlete) return;
    setEnabledMap((prev) => ({ ...prev, [moduleKey]: next }));
    const { error } = await supabase
      .from("athlete_modules")
      .upsert(
        { athlete_id: selectedAthlete, coach_id: coachId, module_key: moduleKey, enabled: next },
        { onConflict: "athlete_id,module_key" }
      );
    if (error) {
      setEnabledMap((prev) => ({ ...prev, [moduleKey]: !next }));
      toast.error("Kunne ikke gemme ændring");
    }
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
        {loadingAthletes ? (
          <div className="h-12 bg-white/10 animate-pulse rounded-xl" />
        ) : athletes.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center text-white/60 text-sm">
            Du har ingen tilknyttede atleter endnu.
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
              {loadingModules ? (
                ATHLETE_MODULES.map((m) => (
                  <div key={m.key} className="h-20 bg-white/10 animate-pulse rounded-xl" />
                ))
              ) : (
                ATHLETE_MODULES.map((m) => {
                  const Icon = m.icon;
                  const on = !!enabledMap[m.key];
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
                        <p className={`text-[14px] font-semibold ${on ? "text-white" : "text-white/50"}`}>
                          {m.label}
                        </p>
                        <p className="text-[12px] text-white/50 mt-0.5">{m.desc}</p>
                      </div>
                      <Switch
                        checked={on}
                        onCheckedChange={(v) => toggle(m.key, v)}
                        style={on ? { backgroundColor: "var(--accent-hex, #ef4444)" } : undefined}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
