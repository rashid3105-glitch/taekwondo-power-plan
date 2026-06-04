import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, ShieldAlert, ShieldCheck, ShieldQuestion, X, Search, History, ExternalLink, Pill, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Flag = "green" | "yellow" | "red";

interface SubstanceRow {
  navn: string;
  flag: Flag;
  kategori: string | null;
  note: string;
}

interface CheckResult {
  product_name: string | null;
  flag_status: Flag;
  substances: SubstanceRow[];
  summary: string;
  age_band?: string;
}

interface HistoryRow {
  id: string;
  created_at: string;
  product_name: string | null;
  flag_status: Flag;
  result_summary: string | null;
  extracted_substances: SubstanceRow[] | null;
}

const flagStyles: Record<Flag, { bg: string; border: string; text: string; icon: typeof ShieldCheck }> = {
  green: { bg: "bg-emerald-500/10", border: "border-emerald-500/40", text: "text-emerald-600 dark:text-emerald-400", icon: ShieldCheck },
  yellow: { bg: "bg-amber-500/10", border: "border-amber-500/40", text: "text-amber-600 dark:text-amber-400", icon: ShieldQuestion },
  red: { bg: "bg-red-500/10", border: "border-red-500/40", text: "text-red-600 dark:text-red-400", icon: ShieldAlert },
};

export function SupplementChecker() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<"text" | "image">("text");
  const [productName, setProductName] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [savedNote, setSavedNote] = useState(false);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from("supplement_checks")
        .select("id, created_at, product_name, flag_status, result_summary, extracted_substances")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      setHistory((data ?? []) as any);
    } catch (e) {
      console.error("history load failed", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  const handleImage = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
    setResult(null);
    setSavedNote(false);
  };

  const runCheck = async () => {
    if (mode === "text" && !productName.trim()) return;
    if (mode === "image" && !image) return;
    setChecking(true);
    setSavedNote(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("not_authenticated");

      const body: any = { input_type: mode, athlete_id: user.id };
      if (mode === "text") body.product_name = productName.trim();
      else body.image_base64 = image;

      const { data, error } = await supabase.functions.invoke("supplement-check", { body });
      if (error) throw error;
      if ((data as any)?.error) {
        const err = (data as any).error;
        toast.error(
          err === "rate_limited" ? t("supplementRateLimited") || "For mange forespørgsler — prøv igen om lidt"
          : err === "payment_required" ? t("supplementPaymentRequired") || "Kreditter opbrugt — kontakt support"
          : t("supplementCheckError") || "Kunne ikke gennemføre tjekket"
        );
        return;
      }
      setResult(data as CheckResult);
      setSavedNote(true);
      loadHistory();
    } catch (e: any) {
      console.error("supplement-check failed", e);
      toast.error(t("supplementCheckError") || "Kunne ikke gennemføre tjekket");
    } finally {
      setChecking(false);
    }
  };

  const resetForNew = () => {
    setResult(null);
    setSavedNote(false);
    setImage(null);
    setProductName("");
  };

  const flagLabel = (f: Flag) =>
    f === "green" ? (t("supplementFlagGreen") || "Ingen kendte flag")
    : f === "yellow" ? (t("supplementFlagYellow") || "Vær opmærksom — verificér")
    : (t("supplementFlagRed") || "Muligt forbudt stof — stop og verificér");

  const showResult = (r: HistoryRow) => {
    setResult({
      product_name: r.product_name,
      flag_status: r.flag_status,
      substances: Array.isArray(r.extracted_substances) ? r.extracted_substances : [],
      summary: r.result_summary ?? "",
    });
    setSavedNote(false);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="theme-light-section relative z-10 space-y-4">
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-foreground">{t("supplementCheckerTitle") || "Tjek kosttilskud & medicin"}</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("supplementCheckerIntro") || "Tjek baseret på viden om antidoping og WADA's liste. Resultatet er vejledende — ikke en garanti."}
        </p>

        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => { setMode("text"); setResult(null); }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              mode === "text" ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background text-foreground hover:bg-secondary"
            )}
          >
            <Type className="h-4 w-4" /> {t("supplementModeText") || "Tekst"}
          </button>
          <button
            type="button"
            onClick={() => { setMode("image"); setResult(null); }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              mode === "image" ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background text-foreground hover:bg-secondary"
            )}
          >
            <Camera className="h-4 w-4" /> {t("supplementModeImage") || "Billede"}
          </button>
        </div>

        {mode === "text" ? (
          <Input
            placeholder={t("supplementProductPlaceholder") || "Produktnavn eller indholdsstof"}
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            maxLength={200}
          />
        ) : (
          <>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])}
            />
            {!image ? (
              <div className="space-y-2">
                <div className="rounded-2xl border-2 border-dashed border-border bg-background py-6 px-4 flex flex-col items-center justify-center gap-2">
                  <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground text-center">
                    {t("supplementTakePhoto") || "Tag billede af etiketten eller vælg fra galleri"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" className="gap-2" onClick={() => cameraInputRef.current?.click()}>
                    <Camera className="h-4 w-4" /> {t("supplementCamera") || "Kamera"}
                  </Button>
                  <Button type="button" variant="outline" className="gap-2" onClick={() => galleryInputRef.current?.click()}>
                    <Pill className="h-4 w-4" /> {t("supplementGallery") || "Galleri"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden">
                <img src={image} alt="" className="w-full max-h-64 object-cover rounded-2xl" />
                <button
                  onClick={() => setImage(null)}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 flex items-center justify-center text-white"
                  aria-label="x"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}

        <Button
          className="w-full gap-2"
          onClick={runCheck}
          disabled={checking || (mode === "text" ? !productName.trim() : !image)}
        >
          {checking ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> {t("supplementChecking") || "Tjekker…"}</>
          ) : (
            <><Search className="h-4 w-4" /> {t("supplementCheckButton") || "Tjek produkt"}</>
          )}
        </Button>
      </Card>

      {/* Result */}
      {result && (
        <Card className={cn("p-4 space-y-3 border-2 bg-card", flagStyles[result.flag_status].border)}>
          <div className="flex items-start gap-3">
            {(() => { const Icon = flagStyles[result.flag_status].icon; return <Icon className={cn("h-8 w-8 shrink-0", flagStyles[result.flag_status].text)} />; })()}
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-base text-foreground">{flagLabel(result.flag_status)}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn("inline-block h-2 w-2 rounded-full", result.flag_status === "green" ? "bg-emerald-500" : result.flag_status === "yellow" ? "bg-amber-500" : "bg-red-500")} />
                <span className={cn("text-xs font-bold uppercase", flagStyles[result.flag_status].text)}>{result.flag_status}</span>
              </div>
              {result.product_name && (
                <p className="text-sm font-semibold text-foreground truncate mt-1">{result.product_name}</p>
              )}
            </div>
          </div>

          {result.substances.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("supplementSubstances") || "Stoffer"}
              </p>
              {result.substances.map((s, i) => (
                <div key={i} className={cn("rounded-lg border p-2 bg-background", flagStyles[s.flag].border)}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-foreground">{s.navn}</span>
                    <span className={cn("text-xs font-bold uppercase shrink-0", flagStyles[s.flag].text)}>
                      {s.kategori ? `${s.kategori} · ` : ""}{s.flag}
                    </span>
                  </div>
                  {s.note && <p className="text-xs text-foreground/80 mt-1">{s.note}</p>}
                </div>
              ))}
            </div>
          )}

          {result.summary && (
            <div className="rounded-lg bg-background border border-border p-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {result.summary}
            </div>
          )}

          {savedNote && (
            <p className="text-xs text-muted-foreground italic">
              ✓ {t("supplementSavedNote") || "Gemt i din historik"}
            </p>
          )}

          <Button variant="outline" size="sm" className="w-full" onClick={resetForNew}>
            {t("supplementCheckAnother") || "Tjek et nyt produkt"}
          </Button>
        </Card>
      )}

      {/* Always-visible disclaimer */}
      <Card className="p-4 border-l-4 border-l-amber-500 border border-border bg-card space-y-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <p className="font-bold text-sm text-foreground">
            {t("supplementDisclaimerTitle") || "Vigtigt — vejledende screening"}
          </p>
        </div>
        <p className="text-xs text-foreground/90 leading-relaxed">
          {t("supplementDisclaimerBody") || "Dette er en vejledende screening, ikke en garanti. WADA's liste er ikke udtømmende, og du er selv ansvarlig (strict liability) for hvad du indtager. Kosttilskud dækkes IKKE af Global DRO og kan være forurenede eller fejlmærkede. Verificér altid officielt og tal med din træner, læge eller en voksen."}
        </p>
        <div className="flex flex-col gap-1.5 pt-1">
          <a href="https://www.antidoping.dk" target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
            <ExternalLink className="h-3 w-3" /> Anti Doping Danmark (antidoping.dk)
          </a>
          <a href="https://www.globaldro.com" target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
            <ExternalLink className="h-3 w-3" /> Global DRO (globaldro.com)
          </a>
        </div>
      </Card>

      {/* History */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-bold text-foreground text-sm">{t("supplementHistoryTitle") || "Din historik"}</h3>
        </div>
        {historyLoading ? (
          <div className="flex items-center justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : history.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("supplementHistoryEmpty") || "Ingen tidligere tjek endnu."}</p>
        ) : (
          <ul className="divide-y divide-border">
            {history.map((h) => {
              const style = flagStyles[h.flag_status];
              const Icon = style.icon;
              return (
                <li key={h.id}>
                  <button
                    onClick={() => showResult(h)}
                    className="w-full flex items-center gap-3 py-2 text-left hover:bg-accent rounded-md px-2 -mx-2 cursor-pointer"
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", style.text)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{h.product_name || "—"}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(h.created_at).toLocaleString()}</p>
                    </div>
                    <span className={cn("text-[10px] font-bold uppercase", style.text)}>{h.flag_status}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
