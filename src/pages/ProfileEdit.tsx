import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Save, Loader2 } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

const cardCls = "rounded-xl bg-white/[0.03] border border-white/10 p-5 sm:p-6";
const sectionTitleCls = "text-xs uppercase tracking-wider text-white/35 mb-4";
const inputCls = "bg-white/[0.04] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20";

export default function ProfileEdit() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [beltLevel, setBeltLevel] = useState("");
  const [weightKg, setWeightKg] = useState<string>("");
  const [discipline, setDiscipline] = useState("sparring");
  const [goalsText, setGoalsText] = useState("");


  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      const { data: p } = await supabase
        .from("profiles")
        .select("display_name, birth_date, belt_level, weight_kg, sport, discipline, goals")
      const { data: p } = await supabase
        .from("profiles")
        .select("display_name, birth_date, belt_level, weight_kg, discipline, goals")
        .eq("user_id", user.id)
        .maybeSingle();
      if (p) {
        setDisplayName(p.display_name ?? "");
        setBirthDate(p.birth_date ?? "");
        setBeltLevel(p.belt_level ?? "");
        setWeightKg(p.weight_kg != null ? String(p.weight_kg) : "");
        setDiscipline(p.discipline ?? "sparring");
        setGoalsText(Array.isArray(p.goals) ? p.goals.join(", ") : "");
      }

  }, [navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const goals = goalsText.split(",").map((g) => g.trim()).filter(Boolean);
      const weight = weightKg ? parseFloat(weightKg) : null;

      const { error } = await supabase.functions.invoke("update-my-profile", {
        body: {
          display_name: displayName || null,
          birth_date: birthDate || null,
          belt_level: beltLevel || null,
          weight_kg: weight,
          sport,
          discipline,
          goals,
        },
      });
      if (error) throw error;
      toast.success(t("profileSaved" as any) || "Gemt");
      navigate("/profile");
    } catch (e: any) {
      toast.error(e?.message || "Fejl");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white" style={{ backgroundColor: "#0a0a0a" }}>
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: "#0a0a0a" }}>
      <PageMeta title={`${t("profileEdit" as any)} · Sportstalent`} description="Edit profile" noindex />
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/profile")}
            className="-ml-2 text-white/70 hover:text-white hover:bg-white/5"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t("profileBack" as any)}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="text-black font-medium"
            style={{ backgroundColor: "var(--accent-hex)" }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {t("save" as any) || "Gem"}
          </Button>
        </div>

        <div className={cardCls}>
          <h2 className={sectionTitleCls}>{t("profileTitle" as any)}</h2>
          <div className="space-y-4">
            <Field label={t("profileNoName" as any) || "Navn"}>
              <Input className={inputCls} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </Field>
            <Field label={t("profileBirthDate" as any)}>
              <Input type="date" className={inputCls} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </Field>
            <Field label={t("profileBeltLevel" as any)}>
              <Input className={inputCls} value={beltLevel} onChange={(e) => setBeltLevel(e.target.value)} placeholder="e.g. 1. dan" />
            </Field>
            <Field label={t("profileWeight" as any)}>
              <Input
                type="number"
                inputMode="decimal"
                className={inputCls}
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="kg"
              />
            </Field>
          </div>
        </div>

        <div className={cardCls}>
          <h2 className={sectionTitleCls}>{t("profileSportDiscipline" as any)}</h2>
          <div className="space-y-4">
            <Field label={t("profileSport" as any)}>
              <Input className={inputCls} value={sport} onChange={(e) => setSport(e.target.value)} />
            </Field>
            <Field label={t("profileDiscipline" as any)}>
              <div className="flex gap-2">
                {["sparring", "poomsae"].map((d) => {
                  const active = discipline === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDiscipline(d)}
                      className="capitalize px-3 py-2 rounded-md text-sm font-medium"
                      style={
                        active
                          ? { backgroundColor: "var(--accent-hex)", color: "#000" }
                          : { backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }
                      }
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>
        </div>

        <div className={cardCls}>
          <h2 className={sectionTitleCls}>{t("profileGoalsTitle" as any)}</h2>
          <Field label={t("profileGoalsTitle" as any)}>
            <Input
              className={inputCls}
              value={goalsText}
              onChange={(e) => setGoalsText(e.target.value)}
              placeholder="goal1, goal2, ..."
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider text-white/45">{label}</Label>
      {children}
    </div>
  );
}
