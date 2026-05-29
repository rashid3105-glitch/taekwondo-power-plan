import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ATHLETE_MODULES } from "@/config/modules";
import { ChevronRight, Lock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
      const { data } = await supabase
        .from("athlete_modules")
        .select("module_key, enabled")
        .eq("athlete_id", user.id);
      const set = new Set<string>();
      (data ?? []).forEach((r: any) => { if (r.enabled) set.add(r.module_key); });
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

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {ATHLETE_MODULES.map((m) => (
              <div key={m.key} className="h-20 bg-white/10 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          ATHLETE_MODULES.map((m) => {
            const enabled = enabledKeys.has(m.key);
            const Icon = m.icon;
            return (
              <div
                key={m.key}
                className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${
                  enabled
                    ? "border-white/10 bg-white/[0.03]"
                    : "border-white/5 bg-white/[0.02] opacity-60"
                }`}
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
          })
        )}
      </main>
    </div>
  );
}
