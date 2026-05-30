import { useState, useRef } from "react";
import { Camera, Loader2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ScanResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
  confidence: "high" | "medium" | "low";
}

interface Props {
  onLogged?: () => void;
}

export function FoodScanner({ onLogged }: Props) {
  const { t } = useLanguage();
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [logging, setLogging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleImage = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
    setResult(null);
  };

  const analyzeImage = async () => {
    if (!image) return;
    setScanning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let weight = 70;
      let age = 25;
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("weight_kg, birth_date")
          .eq("user_id", user.id)
          .maybeSingle();
        const profileWeight = (profileData as any)?.weight_kg;
        const birthDate = (profileData as any)?.birth_date;
        if (profileWeight != null) weight = profileWeight;
        if (birthDate) {
          age = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        }
      }

      const { data, error } = await supabase.functions.invoke("scan-food", {
        body: { image, weight, age },
      });
      if (error) throw error;
      if ((data as any)?.error) {
        toast.error((data as any).error === "rate_limited"
          ? "For mange forespørgsler — prøv igen om lidt"
          : (data as any).error === "payment_required"
            ? "AI-kreditter opbrugt — kontakt support"
            : t("foodScanError") || "Kunne ikke analysere billedet");
        return;
      }
      const parsed = (data as any)?.result;
      if (parsed?.error) {
        toast.error(parsed.error);
        return;
      }
      if (!parsed?.name) {
        toast.error(t("foodScanError") || "Kunne ikke analysere billedet");
        return;
      }
      setResult(parsed as ScanResult);
    } catch (e) {
      console.error("scan-food error", e);
      toast.error(t("foodScanError") || "Kunne ikke analysere billedet");
    } finally {
      setScanning(false);
    }
  };

  const logMeal = async () => {
    if (!result) return;
    setLogging(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("not_authenticated");

      const today = new Date().toISOString().slice(0, 10);
      const { error } = await (supabase.from as any)("nutrition_logs").insert({
        user_id: user.id,
        date: today,
        meal_name: result.name,
        calories: result.calories,
        protein_g: result.protein,
        carbs_g: result.carbs,
        fat_g: result.fat,
        portion: result.portion,
        source: "ai_scan",
        logged_at: new Date().toISOString(),
      });
      if (error) throw error;

      toast.success(`${result.name} ✓`);
      setImage(null);
      setResult(null);
      onLogged?.();
    } catch (e: any) {
      toast.error(e.message || "Kunne ikke logge måltidet");
    } finally {
      setLogging(false);
    }
  };

  const confidenceColor = {
    high: "text-emerald-500",
    medium: "text-amber-500",
    low: "text-red-500",
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])}
      />

      {!image ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 py-10 hover:bg-primary/10 transition-colors"
        >
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Camera className="h-7 w-7 text-primary" />
          </div>
          <div className="text-center px-4">
            <p className="text-sm font-semibold text-foreground">{t("foodScanTake") || "Tag et billede af dit måltid"}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("foodScanDesc") || "AI analyserer kalorier, protein, kulhydrater og fedt"}</p>
          </div>
        </button>
      ) : (
        <div className="relative rounded-2xl overflow-hidden">
          <img src={image} alt="Måltid" className="w-full max-h-64 object-cover rounded-2xl" />
          <button
            onClick={() => { setImage(null); setResult(null); }}
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 flex items-center justify-center text-white"
            aria-label="Fjern billede"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {image && !result && (
        <Button className="w-full gap-2" onClick={analyzeImage} disabled={scanning}>
          {scanning ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> {t("foodScanning") || "Analyserer…"}</>
          ) : (
            <><Camera className="h-4 w-4" /> {t("foodScanAnalyze") || "Analysér mad"}</>
          )}
        </Button>
      )}

      {result && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-primary/5">
            <div>
              <p className="font-bold text-sm text-foreground">{result.name}</p>
              <p className="text-xs text-muted-foreground">{result.portion}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-primary">{Math.round(result.calories)}</p>
              <p className="text-[10px] text-muted-foreground">kcal</p>
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-border">
            {[
              { label: t("protein") || "Protein", value: result.protein, color: "text-red-400" },
              { label: t("carbs") || "Kulhydrater", value: result.carbs, color: "text-amber-400" },
              { label: t("fat") || "Fedt", value: result.fat, color: "text-purple-400" },
            ].map((m) => (
              <div key={m.label} className="py-3 text-center">
                <p className={cn("text-base font-bold", m.color)}>{Math.round(m.value)}g</p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 flex items-center justify-between gap-2 border-t border-border">
            <p className={cn("text-xs", confidenceColor[result.confidence])}>
              {result.confidence === "high" && "✓ Høj sikkerhed"}
              {result.confidence === "medium" && "~ Middel sikkerhed"}
              {result.confidence === "low" && "⚠ Lav sikkerhed"}
            </p>
            <Button size="sm" className="gap-1.5" onClick={logMeal} disabled={logging}>
              {logging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {t("foodScanLog") || "Log måltid"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
