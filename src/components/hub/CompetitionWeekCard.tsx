import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Trophy, Check, Circle } from "lucide-react";
import { getCurrentUser } from "@/lib/authSession";

interface Comp {
  id: string;
  name: string;
  event_date: string;
  weight_class_kg: number | null;
}

const CHECKS = ["gear", "transport"] as const;
type CheckKey = (typeof CHECKS)[number];

/**
 * Competition-week mode: from 7 days out the hub shows a countdown with the
 * live weight status, licence status and a small pre-event checklist.
 */
export function CompetitionWeekCard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [comp, setComp] = useState<Comp | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [licenceOk, setLicenceOk] = useState<boolean | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await getCurrentUser();
      if (!user) return;
      const today = new Date().toISOString().slice(0, 10);
      const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

      const { data: comps } = await supabase
        .from("competitions")
        .select("id, name, event_date, weight_class_kg")
        .eq("user_id", user.id)
        .gte("event_date", today)
        .lte("event_date", in7)
        .order("event_date", { ascending: true })
        .limit(1);
      const c = ((comps as any[]) || [])[0] as Comp | undefined;
      if (!c || cancelled) return;
      setComp(c);

      const { data: w } = await supabase
        .from("weight_logs")
        .select("weight_kg, log_date")
        .eq("user_id", user.id)
        .order("log_date", { ascending: false })
        .limit(1);
      const latest = ((w as any[]) || [])[0];
      if (!cancelled) setWeight(latest?.log_date === today ? Number(latest.weight_kg) : null);

      const { data: prof } = await supabase
        .from("profiles")
        .select("gal_license_expires_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) {
        const exp = (prof as any)?.gal_license_expires_at as string | null;
        setLicenceOk(exp ? exp >= c.event_date : null);
      }

      try {
        setChecked(JSON.parse(localStorage.getItem(`compweek-${c.id}`) || "{}"));
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const daysLeft = useMemo(() => {
    if (!comp) return 0;
    const ms = new Date(comp.event_date).getTime() - new Date().setHours(0, 0, 0, 0);
    return Math.max(0, Math.round(ms / 86400000));
  }, [comp]);

  if (!comp) return null;

  const toggle = (k: CheckKey) => {
    const next = { ...checked, [k]: !checked[k] };
    setChecked(next);
    localStorage.setItem(`compweek-${comp.id}`, JSON.stringify(next));
  };

  const Line = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
    <div className="flex items-center gap-2 text-sm">
      {ok ? <Check className="h-4 w-4 text-[#c9a84c]" /> : <Circle className="h-4 w-4 text-white/30" />}
      <span className={ok ? "text-white" : "text-white/60"}>{children}</span>
    </div>
  );

  return (
    <section className="rounded-xl border border-[#c9a84c]/40 bg-[#111] p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-[#c9a84c]" />
        <h3 className="font-['Sora'] text-sm font-bold uppercase tracking-tight text-white">
          {t("compWeekTitle")} · {daysLeft === 0 ? t("compWeekToday") : t("compWeekDaysLeft").replace("{n}", String(daysLeft))}
        </h3>
      </div>
      <p className="text-xs uppercase tracking-widest text-[#c9a84c]/70">{comp.name}</p>

      <div className="pt-1 space-y-1.5">
        <Line ok={licenceOk === true}>{t("compWeekLicence")}</Line>
        <Line ok={weight !== null}>
          {weight !== null
            ? `${t("compWeekWeight")}: ${weight.toFixed(1)} kg${comp.weight_class_kg ? ` (${t("compWeekLimit")} ${comp.weight_class_kg})` : ""}`
            : t("compWeekWeightMissing")}
        </Line>
        {CHECKS.map((k) => (
          <button key={k} type="button" onClick={() => toggle(k)} className="block w-full text-left" style={{ minHeight: 32 }}>
            <Line ok={!!checked[k]}>{t(k === "gear" ? "compWeekGear" : "compWeekTransport")}</Line>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => navigate("/competitions")}
        className="mt-2 w-full h-10 rounded-lg border border-[#c9a84c]/40 text-[#c9a84c] text-xs font-bold hover:bg-[#c9a84c]/10 transition-colors"
      >
        {t("compWeekOpen")}
      </button>
      <p className="text-[11px] text-white/45 text-center">{t("compWeekTaper")}</p>
    </section>
  );
}
