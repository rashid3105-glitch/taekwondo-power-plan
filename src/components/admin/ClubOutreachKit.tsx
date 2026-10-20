import { useState } from "react";
import { Copy, Download, FileText, Printer, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { buildOutreach, outreachOverviewHtml, type OutreachInput, type OutreachMaterials } from "@/lib/clubOutreach";

const fields = ["club", "contact", "challenge", "group", "next"] as const;
const materialKeys = ["script", "email", "overview"] as const;
const fieldLabels = { club: "outreachClub", contact: "outreachContact", challenge: "outreachChallenge", group: "outreachGroup", next: "outreachNext" } as const;
const materialLabels = { script: "outreachScript", email: "outreachEmail", overview: "outreachOverview" } as const;

export default function ClubOutreachKit() {
  const { t, locale } = useLanguage();
  const { isAdmin, loading } = useIsAdmin();
  const [input, setInput] = useState<OutreachInput>({ club: "", contact: "", challenge: "", group: "", next: "" });
  const [materials, setMaterials] = useState<OutreachMaterials | null>(null);
  const [generatedInput, setGeneratedInput] = useState("");
  const [generatedLocale, setGeneratedLocale] = useState(locale);
  const changed = Boolean(materials && (generatedInput !== JSON.stringify(input) || generatedLocale !== locale));

  if (loading || !isAdmin) return null;

  const generate = () => {
    try {
      setMaterials(buildOutreach(input, { script: t("outreachScriptTemplate"), email: t("outreachEmailTemplate"), overview: t("outreachOverviewTemplate") }));
      setGeneratedInput(JSON.stringify(input));
      setGeneratedLocale(locale);
    } catch { toast.error(t("outreachError")); }
  };

  const download = (key: keyof OutreachMaterials) => {
    if (!materials) return;
    const url = URL.createObjectURL(new Blob([materials[key]], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${input.club.replace(/[^\p{L}\p{N}-]+/gu, "-")}-${key}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const print = () => {
    if (!materials) return;
    const popup = window.open("", "_blank");
    if (!popup) { toast.error(t("outreachPrintBlocked")); return; }
    popup.opener = null;
    popup.document.write(outreachOverviewHtml(t("outreachOverview"), materials.overview, generatedLocale));
    popup.document.close();
    popup.focus();
    popup.print();
  };

  return <section className="mt-8 border-y border-border py-6" aria-labelledby="outreach-heading">
    <h2 id="outreach-heading" className="flex items-center gap-2 text-xl font-semibold"><FileText className="h-5 w-5 text-primary" />{t("outreachTitle")}</h2>
    <p className="mt-1 text-sm text-muted-foreground">{t("outreachReview")}</p>
    <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); generate(); }}>
      {fields.map(field => <label key={field} className={field === "challenge" ? "sm:col-span-2" : ""}>
        <span className="mb-1.5 block text-sm font-medium">{t(fieldLabels[field])}</span>
        <Input required maxLength={field === "challenge" ? 300 : 150} value={input[field]} onChange={e => setInput(prev => ({ ...prev, [field]: e.target.value }))} />
      </label>)}
      <div className="sm:col-span-2"><Button type="submit" className="h-11"><RefreshCw className="mr-2 h-4 w-4" />{t("outreachGenerate")}</Button></div>
    </form>
    {materials && <div className="mt-6">
      {changed && <p role="status" className="mb-3 text-sm text-destructive">{t("outreachChanged")}</p>}
      <Tabs defaultValue="script">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1">
          {materialKeys.map(key => <TabsTrigger key={key} value={key} className="min-h-11 whitespace-normal break-words px-2 text-xs sm:text-sm">{t(materialLabels[key])}</TabsTrigger>)}
        </TabsList>
        {materialKeys.map(key => <TabsContent key={key} value={key}>
          <Textarea aria-label={t(materialLabels[key])} value={materials[key]} onChange={e => setMaterials(prev => prev ? { ...prev, [key]: e.target.value } : prev)} className="min-h-[420px] leading-relaxed" />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" className="h-11" disabled={changed} onClick={async () => {
              try { await navigator.clipboard.writeText(materials[key]); toast.success(t("outreachCopied")); }
              catch { toast.error(t("error")); }
            }}><Copy className="mr-2 h-4 w-4" />{t("outreachCopy")}</Button>
            <Button variant="outline" className="h-11" disabled={changed} onClick={() => download(key)}><Download className="mr-2 h-4 w-4" />{t("outreachDownload")}</Button>
            {key === "overview" && <Button className="h-11" disabled={changed} onClick={print}><Printer className="mr-2 h-4 w-4" />{t("outreachPrint")}</Button>}
          </div>
        </TabsContent>)}
      </Tabs>
    </div>}
  </section>;
}