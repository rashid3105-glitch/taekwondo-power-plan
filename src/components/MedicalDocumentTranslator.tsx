import { useState, useRef } from "react";
import { FileText, Upload, Loader2, Copy, X, AlertTriangle, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { haptics } from "@/lib/haptics";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_TEXT_LEN = 15000;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
  "text/plain",
];

interface KeyFinding {
  term: string;
  explanation: string;
}
interface TranslationResult {
  summary: string;
  keyFindings: KeyFinding[];
  trainingImplications: string;
  questionsForDoctor: string[];
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip "data:...;base64," prefix
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function MedicalDocumentTranslator() {
  const { t, locale } = useLanguage();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [tab, setTab] = useState<"text" | "file">("text");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      toast.error(t("medDocFileTooLarge"));
      e.target.value = "";
      return;
    }
    if (!ALLOWED_TYPES.includes(f.type)) {
      toast.error(t("medDocUnsupportedFile"));
      e.target.value = "";
      return;
    }
    setFile(f);
  };

  const handleSubmit = async () => {
    if (tab === "text" && !text.trim()) {
      toast.error(t("medDocNeedInput"));
      return;
    }
    if (tab === "file" && !file) {
      toast.error(t("medDocNeedInput"));
      return;
    }
    if (text.length > MAX_TEXT_LEN) {
      toast.error(t("medDocTextTooLong"));
      return;
    }

    haptics.tap();
    setLoading(true);
    setResult(null);
    try {
      const payload: any = { language: locale };
      if (tab === "text") {
        payload.text = text.trim();
      } else if (file) {
        payload.fileBase64 = await fileToBase64(file);
        payload.mimeType = file.type;
      }

      const { data, error } = await supabase.functions.invoke("translate-medical-document", {
        body: payload,
      });

      if (error) {
        const msg = (error as any)?.context?.body
          ? (() => { try { return JSON.parse((error as any).context.body).error; } catch { return null; } })()
          : null;
        toast.error(msg || error.message || t("error"));
        return;
      }
      if (!data?.success || !data?.result) {
        toast.error(data?.error || t("error"));
        return;
      }
      setResult(data.result);
      haptics.success();
    } catch (e: any) {
      toast.error(e?.message || t("error"));
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setResult(null);
    setText("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCopy = async () => {
    if (!result) return;
    const lines: string[] = [];
    lines.push(t("medDocSummary"));
    lines.push(result.summary);
    lines.push("");
    lines.push(t("medDocKeyFindings"));
    result.keyFindings.forEach((f) => lines.push(`• ${f.term}: ${f.explanation}`));
    lines.push("");
    lines.push(t("medDocTrainingImplications"));
    lines.push(result.trainingImplications);
    lines.push("");
    lines.push(t("medDocQuestionsForDoctor"));
    result.questionsForDoctor.forEach((q) => lines.push(`• ${q}`));
    await navigator.clipboard.writeText(lines.join("\n"));
    toast.success(t("medDocCopied"));
  };

  return (
    <div className="rounded-xl border border-border bg-card text-card-foreground p-4 sm:p-5 shadow-card space-y-3">
      <div className="flex items-center gap-2">
        <Stethoscope className="h-5 w-5 text-tab-rehab" />
        <h3 className="font-bold text-card-foreground">{t("medDocTitle")}</h3>
      </div>
      <p className="text-xs text-muted-foreground">{t("medDocDescription")}</p>

      <div className="rounded-md border border-amber-500/40 bg-amber-500/15 p-2.5 flex gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900 dark:text-amber-100">{t("medDocDisclaimer")}</p>
      </div>

      {!result && (
        <Tabs value={tab} onValueChange={(v) => setTab(v as "text" | "file")}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="text">
              <FileText className="h-4 w-4 mr-1.5" />
              {t("medDocTabText")}
            </TabsTrigger>
            <TabsTrigger value="file">
              <Upload className="h-4 w-4 mr-1.5" />
              {t("medDocTabFile")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="mt-3 space-y-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("medDocTextPlaceholder")}
              rows={6}
              maxLength={MAX_TEXT_LEN}
              className="resize-none"
            />
            <p className="text-[11px] text-muted-foreground text-right">
              {text.length} / {MAX_TEXT_LEN}
            </p>
          </TabsContent>

          <TabsContent value="file" className="mt-3 space-y-2">
            <label
              htmlFor="med-doc-file"
              className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-6 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm font-medium text-card-foreground">
                {file ? file.name : t("medDocFilePrompt")}
              </span>
              <span className="text-[11px] text-muted-foreground">{t("medDocFileHint")}</span>
              <input
                id="med-doc-file"
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.heic,.heif,.pdf,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {file && (
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                {t("medDocRemoveFile")}
              </button>
            )}
          </TabsContent>
        </Tabs>
      )}

      {!result && (
        <Button
          onClick={handleSubmit}
          disabled={loading || (tab === "text" ? !text.trim() : !file)}
          className="w-full"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> {t("medDocTranslating")}</>
          ) : (
            <><Stethoscope className="h-4 w-4 mr-1.5" /> {t("medDocTranslate")}</>
          )}
        </Button>
      )}

      {result && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("medDocSummary")}
            </h4>
            <p className="text-sm text-card-foreground leading-relaxed">{result.summary}</p>
          </div>

          {result.keyFindings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("medDocKeyFindings")}
              </h4>
              <ul className="space-y-2">
                {result.keyFindings.map((f, i) => (
                  <li key={i} className="rounded-md border border-border bg-muted/30 p-2.5">
                    <p className="text-sm font-semibold text-card-foreground">{f.term}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{f.explanation}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.trainingImplications && (
            <div className="space-y-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("medDocTrainingImplications")}
              </h4>
              <p className="text-sm text-card-foreground leading-relaxed">{result.trainingImplications}</p>
            </div>
          )}

          {result.questionsForDoctor.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("medDocQuestionsForDoctor")}
              </h4>
              <ul className="space-y-1.5 text-sm text-card-foreground list-disc pl-5">
                {result.questionsForDoctor.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-md border border-amber-500/40 bg-amber-500/15 p-2.5 flex gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 dark:text-amber-100">{t("medDocDisclaimer")}</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCopy} variant="outline" size="sm" className="flex-1">
              <Copy className="h-4 w-4 mr-1.5" /> {t("medDocCopy")}
            </Button>
            <Button onClick={handleClear} variant="ghost" size="sm" className="flex-1">
              <X className="h-4 w-4 mr-1.5" /> {t("medDocClear")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
