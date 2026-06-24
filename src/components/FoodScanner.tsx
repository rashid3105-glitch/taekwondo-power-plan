import { useState, useRef, useMemo } from "react";
import { Camera, Loader2, X, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ScanItem {
  name: string;
  portion_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  bbox: { x: number; y: number; w: number; h: number };
  confidence: "high" | "medium" | "low";
}

interface ScanResult {
  items: ScanItem[];
  total: {
    name: string;
    portion: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    confidence: "high" | "medium" | "low";
  };
}

interface ScanFoodResponse {
  error?: string;
  result?: ScanResult | { error: string };
}

interface Props {
  onLogged?: () => void;
}

const MAX_SCAN_IMAGE_BYTES = 4 * 1024 * 1024;

const dataUrlByteLength = (dataUrl: string) => Math.ceil(dataUrl.length * 0.75);

const canvasToDataUrl = (canvas: HTMLCanvasElement, quality: number) =>
  canvas.toDataURL("image/jpeg", quality);

async function downscaleImage(file: File, maxDim = 1280, quality = 0.82): Promise<string> {
  const dataUrl: string = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);

  let output = canvasToDataUrl(canvas, quality);
  let currentMaxDim = maxDim;
  let currentQuality = quality;

  while (dataUrlByteLength(output) > MAX_SCAN_IMAGE_BYTES && currentMaxDim > 640) {
    currentMaxDim = Math.round(currentMaxDim * 0.82);
    currentQuality = Math.max(0.55, currentQuality - 0.08);

    const nextScale = Math.min(1, currentMaxDim / Math.max(img.width, img.height));
    const nextW = Math.max(1, Math.round(img.width * nextScale));
    const nextH = Math.max(1, Math.round(img.height * nextScale));
    canvas.width = nextW;
    canvas.height = nextH;
    ctx.drawImage(img, 0, 0, nextW, nextH);
    output = canvasToDataUrl(canvas, currentQuality);
  }

  return output;
}

export function FoodScanner({ onLogged }: Props) {
  const { t } = useLanguage();
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [items, setItems] = useState<ScanItem[] | null>(null);
  const [dishName, setDishName] = useState<string>("");
  const [selected, setSelected] = useState<number | null>(null);
  const [logging, setLogging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const totals = useMemo(() => {
    if (!items) return null;
    return items.reduce(
      (a, it) => ({
        calories: a.calories + (it.calories || 0),
        protein: a.protein + (it.protein || 0),
        carbs: a.carbs + (it.carbs || 0),
        fat: a.fat + (it.fat || 0),
        grams: a.grams + (it.portion_g || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, grams: 0 },
    );
  }, [items]);

  const handleImage = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setItems(null);
    setSelected(null);
    try {
      const dataUrl = await downscaleImage(file, 1280, 0.8);
      if (dataUrlByteLength(dataUrl) > MAX_SCAN_IMAGE_BYTES) {
        toast.error("Billedet er for stort — prøv et beskåret eller mindre billede");
        return;
      }
      setImage(dataUrl);
    } catch (e) {
      console.error("downscale failed", e);
      toast.error("Kunne ikke læse billedet");
    }
  };

  const analyzeImage = async () => {
    if (!image) return;
    if (dataUrlByteLength(image) > MAX_SCAN_IMAGE_BYTES) {
      toast.error("Billedet er for stort — upload billedet igen");
      return;
    }
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
        const profile = profileData as { weight_kg?: number | null; birth_date?: string | null } | null;
        const profileWeight = profile?.weight_kg;
        const birthDate = profile?.birth_date;
        if (profileWeight != null) weight = profileWeight;
        if (birthDate) {
          age = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        }
      }

      const { data, error } = await supabase.functions.invoke<ScanFoodResponse>("scan-food", {
        body: { image, weight, age },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error === "rate_limited"
          ? "For mange forespørgsler — prøv igen om lidt"
          : data.error === "payment_required"
            ? "AI-kreditter opbrugt — kontakt support"
            : t("foodScanError") || "Kunne ikke analysere billedet");
        return;
      }
      const parsed = data?.result;
      if (!parsed) {
        toast.error(t("foodScanError") || "Kunne ikke analysere billedet");
        return;
      }
      if (parsed && "error" in parsed) {
        toast.error(parsed.error);
        return;
      }
      const scanResult = parsed as ScanResult;
      const itemsArr = scanResult.items;
      if (!Array.isArray(itemsArr) || itemsArr.length === 0) {
        toast.error(t("foodScanError") || "Kunne ikke analysere billedet");
        return;
      }
      setItems(itemsArr);
      setDishName(scanResult.total?.name || itemsArr.map(i => i.name).join(", "));
    } catch (e) {
      console.error("scan-food error", e);
      toast.error(t("foodScanError") || "Kunne ikke analysere billedet");
    } finally {
      setScanning(false);
    }
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev ? prev.filter((_, i) => i !== idx) : prev);
    setSelected(null);
  };

  const scaleItem = (idx: number, factor: number) => {
    setItems((prev) => prev ? prev.map((it, i) => i === idx ? {
      ...it,
      portion_g: Math.max(0, Math.round((it.portion_g || 0) * factor)),
      calories: Math.max(0, Math.round(it.calories * factor)),
      protein: Math.max(0, +(it.protein * factor).toFixed(1)),
      carbs: Math.max(0, +(it.carbs * factor).toFixed(1)),
      fat: Math.max(0, +(it.fat * factor).toFixed(1)),
    } : it) : prev);
  };

  const logMeal = async () => {
    if (!items || items.length === 0 || !totals) return;
    setLogging(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("not_authenticated");

      const today = new Date().toISOString().slice(0, 10);
      const portion = totals.grams > 0 ? `1 tallerken (~${Math.round(totals.grams)}g)` : "1 tallerken";
      const { error } = await supabase.from("nutrition_logs").insert({
        user_id: user.id,
        date: today,
        meal_name: dishName || items.map(i => i.name).join(", "),
        calories: Math.round(totals.calories),
        protein_g: Math.round(totals.protein),
        carbs_g: Math.round(totals.carbs),
        fat_g: Math.round(totals.fat),
        portion,
        source: "ai_scan",
        logged_at: new Date().toISOString(),
      });
      if (error) throw error;

      toast.success(`${dishName || "Måltid"} ✓`);
      setImage(null);
      setItems(null);
      setSelected(null);
      onLogged?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Kunne ikke logge måltidet");
    } finally {
      setLogging(false);
    }
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
      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])}
      />

      {!image ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 py-8 hover:bg-primary/10 transition-colors"
          >
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <p className="text-xs font-semibold text-foreground text-center px-2">{t("foodScanTake") || "Tag billede"}</p>
          </button>
          <button
            onClick={() => uploadRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 py-8 hover:bg-primary/10 transition-colors"
          >
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <p className="text-xs font-semibold text-foreground text-center px-2">{t("foodScanUpload") || "Upload billede"}</p>
          </button>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden bg-black">
          <img src={image} alt="Måltid" className="w-full max-h-80 object-contain" />
          {items && items.map((it, i) => {
            const isSel = selected === i;
            const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
            return (
              <button
                key={i}
                onClick={() => setSelected(isSel ? null : i)}
                className={cn(
                  "absolute border-2 rounded-md transition-all",
                  isSel ? "border-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.3)]" : "border-red-500/90 hover:border-red-400",
                )}
                style={{ left: pct(it.bbox.x), top: pct(it.bbox.y), width: pct(it.bbox.w), height: pct(it.bbox.h) }}
                aria-label={`${it.name} ${Math.round(it.calories)} kcal`}
              >
                <span className="absolute -top-6 left-0 whitespace-nowrap rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
                  {it.name}: {Math.round(it.calories)} kcal
                </span>
              </button>
            );
          })}
          {totals && (
            <div className="absolute top-2 right-2 rounded-lg bg-black/70 px-2.5 py-1 text-right">
              <p className="text-base font-bold text-white leading-tight">{Math.round(totals.calories)}</p>
              <p className="text-[9px] text-white/70 leading-none">kcal total</p>
            </div>
          )}
          <button
            onClick={() => { setImage(null); setItems(null); setSelected(null); }}
            className="absolute top-2 left-2 h-8 w-8 rounded-full bg-black/60 flex items-center justify-center text-white"
            aria-label="Fjern billede"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {image && !items && (
        <Button className="w-full gap-2" onClick={analyzeImage} disabled={scanning}>
          {scanning ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> {t("foodScanning") || "Analyserer…"}</>
          ) : (
            <><Camera className="h-4 w-4" /> {t("foodScanAnalyze") || "Analysér mad"}</>
          )}
        </Button>
      )}

      {items && totals && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-primary/5">
            <input
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              className="w-full bg-transparent font-bold text-sm text-foreground outline-none"
              placeholder="Måltidets navn"
            />
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{items.length} {items.length === 1 ? "komponent" : "komponenter"} · ~{Math.round(totals.grams)}g</p>
              <p className="text-lg font-bold text-primary leading-none">{Math.round(totals.calories)} <span className="text-[10px] text-muted-foreground font-normal">kcal</span></p>
            </div>
          </div>

          <ul className="divide-y divide-border">
            {items.map((it, i) => (
              <li key={i} className={cn("px-4 py-2.5 flex items-center gap-3", selected === i && "bg-primary/5")}>
                <button onClick={() => setSelected(selected === i ? null : i)} className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground">{it.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {Math.round(it.portion_g)}g · {Math.round(it.calories)} kcal · P {Math.round(it.protein)}g · K {Math.round(it.carbs)}g · F {Math.round(it.fat)}g
                  </p>
                </button>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => scaleItem(i, 0.5)} aria-label="Halvér portion">½</Button>
                  <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => scaleItem(i, 2)} aria-label="Fordobl portion">2×</Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => removeItem(i)} aria-label="Fjern">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
            {[
              { label: t("protein") || "Protein", value: totals.protein, color: "text-red-400" },
              { label: t("carbs") || "Kulhydrater", value: totals.carbs, color: "text-amber-400" },
              { label: t("fat") || "Fedt", value: totals.fat, color: "text-purple-400" },
            ].map((m) => (
              <div key={m.label} className="py-3 text-center">
                <p className={cn("text-base font-bold", m.color)}>{Math.round(m.value)}g</p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 flex items-center justify-end border-t border-border">
            <Button size="sm" className="gap-1.5" onClick={logMeal} disabled={logging || items.length === 0}>
              {logging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {t("foodScanLog") || "Log måltid"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
