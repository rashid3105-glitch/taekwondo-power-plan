import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, ShieldAlert, ShieldCheck, ShieldQuestion, X, Search, History, ExternalLink, Pill, Type } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AntidopingCertificate } from "@/components/AntidopingCertificate";

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

interface SupplementCheckerProps {
  athleteId?: string;
}

export function SupplementChecker({ athleteId }: SupplementCheckerProps = {}) {
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
      let q = supabase
        .from("supplement_checks")
        .select("id, created_at, product_name, flag_status, result_summary, extracted_substances")
        .order("created_at", { ascending: false })
        .limit(20);
      if (athleteId) q = q.eq("user_id", athleteId);
      const { data, error } = await q;
      if (error) throw error;
      setHistory((data ?? []) as any);
    } catch (e) {
      console.error("history load failed", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => { loadHistory(); }, [athleteId]);

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

      const targetAthleteId = athleteId ?? user.id;
      const body: any = { input_type: mode, athlete_id: targetAthleteId };
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
    <div className="relative z-10 space-y-5 font-['Manrope'] antialiased">
      {/* Main search card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-[#121212]/80 backdrop-blur-xl p-5 md:p-7 shadow-2xl">
        <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full blur-[100px]" style={{ backgroundColor: "var(--gold)", opacity: 0.07 }} />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-xl border p-2.5" style={{ borderColor: "color-mix(in srgb, var(--gold) 25%, transparent)", backgroundColor: "color-mix(in srgb, var(--gold) 10%, transparent)" }}>
              <Search className="h-5 w-5" style={{ color: "var(--gold)" }} />
            </div>
            <h2 className="font-['Sora'] text-xl md:text-2xl font-bold tracking-tight text-white">
              {t("supplementCheckerTitle") || "Tjek kosttilskud & medicin"}
            </h2>
          </div>
          <p className="text-sm text-white/50 mb-6">
            {t("supplementCheckerIntro") || "Tjek baseret på viden om antidoping og WADA's liste. Resultatet er vejledende — ikke en garanti."}
          </p>

          {/* Mode toggle */}
          <div className="flex p-1 mb-5 rounded-2xl border border-white/5 bg-black/40">
            <button
              type="button"
              onClick={() => { setMode("text"); setResult(null); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all",
                mode === "text" ? "text-black" : "text-white/50 hover:text-white font-semibold"
              )}
              style={mode === "text" ? { backgroundColor: "var(--gold)" } : undefined}
            >
              <Type className="h-4 w-4" /> {t("supplementModeText") || "Tekst"}
            </button>
            <button
              type="button"
              onClick={() => { setMode("image"); setResult(null); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all",
                mode === "image" ? "text-black" : "text-white/50 hover:text-white font-semibold"
              )}
              style={mode === "image" ? { backgroundColor: "var(--gold)" } : undefined}
            >
              <Camera className="h-4 w-4" /> {t("supplementModeImage") || "Billede"}
            </button>
          </div>

          {mode === "text" ? (
            <input
              type="text"
              placeholder={t("supplementProductPlaceholder") || "Produktnavn eller indholdsstof"}
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              maxLength={200}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-5 py-4 text-base text-white placeholder:text-white/30 outline-none transition-all focus:border-white/25"
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
                <div className="space-y-3">
                  <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-black/40 px-4 py-7">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: "color-mix(in srgb, var(--gold) 12%, transparent)" }}>
                      <Camera className="h-6 w-6" style={{ color: "var(--gold)" }} />
                    </div>
                    <p className="text-center text-sm font-semibold text-white/80">
                      {t("supplementTakePhoto") || "Tag billede af etiketten eller vælg fra galleri"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => cameraInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-semibold text-white hover:bg-white/[0.08] transition-colors">
                      <Camera className="h-4 w-4" style={{ color: "var(--gold)" }} /> {t("supplementCamera") || "Kamera"}
                    </button>
                    <button type="button" onClick={() => galleryInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-semibold text-white hover:bg-white/[0.08] transition-colors">
                      <Pill className="h-4 w-4" style={{ color: "var(--gold)" }} /> {t("supplementGallery") || "Galleri"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-2xl">
                  <img src={image} alt="" className="max-h-64 w-full rounded-2xl object-cover" />
                  <button
                    onClick={() => setImage(null)}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white"
                    aria-label="x"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}

          <button
            type="button"
            onClick={runCheck}
            disabled={checking || (mode === "text" ? !productName.trim() : !image)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-4 font-['Sora'] text-sm font-bold uppercase tracking-wider text-black shadow-lg transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-40"
            style={{ background: "linear-gradient(90deg, var(--gold), color-mix(in srgb, var(--gold) 70%, #7a5c00))" }}
          >
            {checking ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {t("supplementChecking") || "Tjekker…"}</>
            ) : (
              <><Search className="h-4 w-4" /> {t("supplementCheckButton") || "Tjek produkt"}</>
            )}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className={cn("rounded-3xl border-2 bg-[#121212]/80 backdrop-blur-xl p-5 space-y-3 animate-fade-in", flagStyles[result.flag_status].border)}>
          <div className="flex items-start gap-3">
            {(() => { const Icon = flagStyles[result.flag_status].icon; return <Icon className={cn("h-8 w-8 shrink-0", flagStyles[result.flag_status].text)} />; })()}
            <div className="min-w-0 flex-1">
              <p className="font-['Sora'] text-base font-bold text-white">{flagLabel(result.flag_status)}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className={cn("inline-block h-2 w-2 rounded-full", result.flag_status === "green" ? "bg-emerald-500" : result.flag_status === "yellow" ? "bg-amber-500" : "bg-red-500")} />
                <span className={cn("text-xs font-bold uppercase", flagStyles[result.flag_status].text)}>{result.flag_status}</span>
              </div>
              {result.product_name && (
                <p className="mt-1 truncate text-sm font-semibold text-white/80">{result.product_name}</p>
              )}
            </div>
          </div>

          {result.substances.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">
                {t("supplementSubstances") || "Stoffer"}
              </p>
              {result.substances.map((s, i) => (
                <div key={i} className={cn("rounded-xl border bg-black/40 p-3", flagStyles[s.flag].border)}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white">{s.navn}</span>
                    <span className={cn("shrink-0 text-xs font-bold uppercase", flagStyles[s.flag].text)}>
                      {s.kategori ? `${s.kategori} · ` : ""}{s.flag}
                    </span>
                  </div>
                  {s.note && <p className="mt-1 text-xs text-white/60">{s.note}</p>}
                </div>
              ))}
            </div>
          )}

          {result.summary && (
            <div className="whitespace-pre-wrap rounded-xl border border-white/5 bg-black/40 p-3 text-sm leading-relaxed text-white/80">
              {result.summary}
            </div>
          )}

          {savedNote && (
            <p className="text-xs italic text-white/40">
              ✓ {t("supplementSavedNote") || "Gemt i din historik"}
            </p>
          )}

          <button
            type="button"
            onClick={resetForNew}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-sm font-semibold text-white hover:bg-white/[0.08] transition-colors"
          >
            {t("supplementCheckAnother") || "Tjek et nyt produkt"}
          </button>
        </div>
      )}

      {/* Always-visible disclaimer */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "var(--gold)" }} />
          <div className="space-y-2">
            <p className="font-['Sora'] text-sm font-bold text-white">
              {t("supplementDisclaimerTitle") || "Vigtigt — vejledende screening"}
            </p>
            <p className="text-xs leading-relaxed text-white/55">
              {t("supplementDisclaimerBody") || "Dette er en vejledende screening, ikke en garanti. WADA's liste er ikke udtømmende, og du er selv ansvarlig (strict liability) for hvad du indtager. Kosttilskud dækkes IKKE af Global DRO og kan være forurenede eller fejlmærkede. Verificér altid officielt og tal med din træner, læge eller en voksen."}
            </p>
            <div className="flex flex-wrap gap-4 pt-1">
              <a href="https://www.antidoping.dk" target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide hover:underline" style={{ color: "var(--gold)" }}>
                <ExternalLink className="h-3 w-3" /> Antidoping.dk
              </a>
              <a href="https://www.globaldro.com" target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide hover:underline" style={{ color: "var(--gold)" }}>
                <ExternalLink className="h-3 w-3" /> Global DRO
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Antidoping course + certificate */}
      <AntidopingCertificate />

      {/* History */}
      <div className="rounded-3xl border border-white/5 bg-[#121212]/80 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-3">
          <History className="h-5 w-5 text-white/40" />
          <h3 className="font-['Sora'] text-sm font-bold uppercase tracking-wide text-white">{t("supplementHistoryTitle") || "Din historik"}</h3>
        </div>
        {historyLoading ? (
          <div className="flex items-center justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-white/40" /></div>
        ) : history.length === 0 ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-white/10 py-6">
            <p className="text-sm text-white/35">{t("supplementHistoryEmpty") || "Ingen tidligere tjek endnu."}</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {history.map((h) => {
              const style = flagStyles[h.flag_status];
              const Icon = style.icon;
              return (
                <li key={h.id}>
                  <button
                    onClick={() => showResult(h)}
                    className="-mx-2 flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-white/[0.05]"
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", style.text)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{h.product_name || "—"}</p>
                      <p className="text-[11px] text-white/40">{new Date(h.created_at).toLocaleString()}</p>
                    </div>
                    <span className={cn("text-[10px] font-bold uppercase", style.text)}>{h.flag_status}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

