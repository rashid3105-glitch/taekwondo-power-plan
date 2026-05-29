import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ATHLETE_MODULES } from "@/config/modules";
import { ChevronRight, Lock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MODULE_ROUTES: Record<string, string> = {
  plan:      '/dashboard',
  progress:  '/dashboard',
  compete:   '/competitions',
  chat:      '/messages',
  mental:    '/dashboard',
  nutrition: '/kostplan',
  rehab:     '/dashboard',
  video:     '/match-analysis/me',
};

export default function AthleteModules() {
  const navigate = useNavigate();
  const [enabledKeys, setEnabledKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("club_id")
        .eq("user_id", user.id)
        .maybeSingle();
      const clubId = (profile as any)?.club_id ?? null;

      const [defaultsRes, overridesRes] = await Promise.all([
        clubId
          ? supabase
              .from("club_module_defaults" as any)
              .select("module, enabled")
              .eq("club_id", clubId)
          : Promise.resolve({ data: [] as any[] }),
        supabase
          .from("athlete_module_overrides" as any)
          .select("module, enabled")
          .eq("user_id", user.id),
      ]);

      const clubMap: Record<string, boolean> = {};
      (((defaultsRes as any).data) ?? []).forEach((r: any) => { clubMap[r.module] = !!r.enabled; });
      const ovMap: Record<string, boolean> = {};
      (((overridesRes as any).data) ?? []).forEach((r: any) => { ovMap[r.module] = !!r.enabled; });

      const set = new Set<string>();
      ATHLETE_MODULES.forEach((m) => {
        const resolved = ovMap[m.key] !== undefined
          ? ovMap[m.key]
          : (clubMap[m.key] !== undefined ? clubMap[m.key] : true);
        if (resolved) set.add(m.key);
      });
      setEnabledKeys(set);
      setLoading(false);
    })();
  }, []);


  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Tilbage" className="p-1 -ml-1 text-white/70 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-heading">Moduler</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ATHLETE_MODULES.map((m) => (
              <div key={m.key} className="h-20 bg-white/10 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ATHLETE_MODULES.map((m) => {
            const enabled = enabledKeys.has(m.key);
            const Icon = m.icon;
            const route = MODULE_ROUTES[m.key];
            const clickable = enabled && !!route;
            return (
              <div
                key={m.key}
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={clickable ? () => navigate(route) : undefined}
                onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(route); } } : undefined}
                className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${
                  enabled
                    ? "border-white/10 bg-white/[0.03]"
                    : "border-white/5 bg-white/[0.02] opacity-60"
                } ${clickable ? "cursor-pointer hover:bg-white/[0.06] active:scale-[0.99]" : "cursor-default"}`}
              >
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                  style={enabled ? { backgroundColor: "var(--accent-hex, #ef4444)20" } : { backgroundColor: "rgba(255,255,255,0.05)" }}
                >
                  {enabled ? (
                    <Icon className="h-5 w-5" style={{ color: "var(--accent-hex, #ef4444)" }} />
                  ) : (
                    <Lock className="h-5 w-5 text-white/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[14px] font-semibold ${enabled ? "text-white" : "text-white/50"}`}>
                    {m.label}
                  </p>
                  <p className="text-[12px] text-white/50 mt-0.5">
                    {enabled ? m.desc : "Din coach har ikke aktiveret dette modul"}
                  </p>
                </div>
                {enabled && <ChevronRight className="h-5 w-5 text-white/40 shrink-0" />}
              </div>
            );
          })}
          </div>
        )}
      </main>
    </div>
  );
}
