import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Loader2, Download, Trash2, AlertTriangle, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PageMeta } from "@/components/PageMeta";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { DELETE_ACCOUNT_API_CONFIRMATION } from "@/lib/accountDeletion";

const cardCls = "rounded-xl bg-white/[0.03] border border-white/10 p-5 sm:p-6";
const sectionTitleCls = "text-xs uppercase tracking-wider text-white/35 mb-4";
const inputCls = "bg-white/[0.04] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20";

const CONFIRM_PHRASE = "SLET";

type CountRow = { table: string; column: string; count: number; error?: string };
type StorageRow = { bucket: string; estimated_objects: number; error?: string };
type DryRun = {
  hard_delete: CountRow[];
  anonymize: CountRow[];
  storage: StorageRow[];
  total_hard: number;
  total_anonymize: number;
  total_storage: number;
  total_hard_tables: number;
};

export default function DeleteAccount() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [confirmInput, setConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dryRun, setDryRun] = useState<DryRun | null>(null);
  const [dryRunLoading, setDryRunLoading] = useState(true);
  const [dryRunError, setDryRunError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      try {
        const { data, error } = await supabase.functions.invoke("account-deletion-dry-run");
        if (error) throw error;
        setDryRun(data as DryRun);
      } catch (e: any) {
        setDryRunError(e?.message || "Error");
      } finally {
        setDryRunLoading(false);
      }
    })();
  }, [navigate]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("export-my-data");
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t("dataExported" as any) || "Eksport hentet");
    } catch (e: any) {
      toast.error(e?.message || "Fejl");
    }
    setExporting(false);
  };

  const canDelete = confirmInput.trim().toUpperCase() === CONFIRM_PHRASE;

  const handleDelete = async () => {
    if (!canDelete) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-my-account", {
        body: { confirmation: DELETE_ACCOUNT_API_CONFIRMATION },
      });
      if (error) throw error;
      const errs = (data as any)?.errors ?? [];
      if (errs.length > 0) {
        toast.warning(
          (t("deletionPartialErrors" as any) || "Konto slettet, men {n} trin fejlede").replace(
            "{n}",
            String(errs.length),
          ),
        );
      } else {
        toast.success(t("accountDeleted" as any) || "Konto slettet");
      }
      await supabase.auth.signOut();
      navigate("/");
    } catch (e: any) {
      toast.error(e?.message || "Fejl");
      setDeleting(false);
    }
  };

  const summary = dryRun
    ? (t("deleteDryRunSummary" as any) || "Når du sletter din konto, fjernes {hard} rækker permanent på tværs af {tables} tabeller, og {anon} rækker anonymiseres.")
        .replace("{hard}", String(dryRun.total_hard))
        .replace("{tables}", String(dryRun.total_hard_tables))
        .replace("{anon}", String(dryRun.total_anonymize))
    : "";

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: "#0a0a0a" }}>
      <PageMeta title="Slet konto · Sportstalent" description="Delete account" noindex />
      <div className="mx-auto max-w-md px-4 py-6 space-y-5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/profile")}
          className="-ml-2 text-white/70 hover:text-white hover:bg-white/5"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t("profileBack" as any)}
        </Button>

        <div className={cardCls}>
          <h2 className={sectionTitleCls}>{t("profileExportData" as any) || "Download mine data"}</h2>
          <p className="text-sm text-white/60 mb-4">
            {t("exportBeforeDelete" as any) ||
              "Vi anbefaler at du downloader en kopi af dine data, før du sletter kontoen."}
          </p>
          <Button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            variant="ghost"
            className="w-full h-11 border border-white/10 text-white hover:bg-white/5"
          >
            {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {t("profileExportData" as any) || "Download mine data"}
          </Button>
        </div>

        {/* Dry-run transparency */}
        <div className={cardCls}>
          <h2 className={sectionTitleCls}>{t("deleteDryRunTitle" as any) || "Hvad sker der når du sletter?"}</h2>
          {dryRunLoading && (
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("deleteDryRunLoading" as any) || "Beregner..."}
            </div>
          )}
          {dryRunError && (
            <p className="text-sm text-red-400">{t("deleteDryRunError" as any) || "Kunne ikke beregne"}: {dryRunError}</p>
          )}
          {dryRun && (
            <>
              <p className="text-sm text-white/75">{summary}</p>
              {dryRun.total_storage > 0 && (
                <p className="text-sm text-white/60 mt-2">
                  {(t("deleteDryRunStorageSummary" as any) || "{files} filer i lagring slettes også.").replace(
                    "{files}",
                    String(dryRun.total_storage),
                  )}
                </p>
              )}
              <Collapsible className="mt-4">
                <CollapsibleTrigger className="flex w-full items-center justify-between text-xs uppercase tracking-wider text-white/45 group">
                  <span>{t("deleteDryRunShowDetails" as any) || "Vis detaljer"}</span>
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-4">
                  <Section
                    title={t("deleteDryRunHardSection" as any) || "Slettes permanent"}
                    rows={dryRun.hard_delete}
                    unit={t("deleteDryRunRowsLabel" as any) || "rækker"}
                  />
                  <Section
                    title={t("deleteDryRunAnonSection" as any) || "Anonymiseres"}
                    rows={dryRun.anonymize}
                    unit={t("deleteDryRunRowsLabel" as any) || "rækker"}
                  />
                  {dryRun.storage.length > 0 && (
                    <div>
                      <h3 className="text-xs uppercase tracking-wider text-white/45 mb-2">
                        {t("deleteDryRunStorageSection" as any) || "Filer i lagring"}
                      </h3>
                      <ul className="text-xs text-white/70 space-y-1">
                        {dryRun.storage.map((s) => (
                          <li key={s.bucket} className="flex justify-between">
                            <span>{s.bucket}</span>
                            <span>{s.estimated_objects} {t("deleteDryRunFilesLabel" as any) || "filer"}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </div>

        <div
          className="rounded-xl p-5 sm:p-6 border"
          style={{ backgroundColor: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.3)" }}
        >
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-semibold text-red-400 mb-1">
                {t("deleteAccountConfirmTitle" as any) || "Slet konto permanent"}
              </h2>
              <p className="text-sm text-white/70">
                {t("deleteAccountConfirmDesc" as any) ||
                  "Denne handling sletter alle dine data permanent: træning, dagbog, vurderinger og profil."}
              </p>
              <p className="text-sm font-semibold text-red-400 mt-2">
                {t("deleteAccountIrreversible" as any) || "Handlingen kan ikke fortrydes."}
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <Label className="text-xs uppercase tracking-wider text-white/45">
              {t("typeToConfirm" as any) || "Skriv"} <span className="text-red-400 font-bold">{CONFIRM_PHRASE}</span>{" "}
              {t("toConfirm" as any) || "for at bekræfte"}
            </Label>
            <Input
              className={inputCls}
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              autoComplete="off"
            />
          </div>

          <Button
            type="button"
            onClick={handleDelete}
            disabled={!canDelete || deleting}
            className="w-full h-11 text-white font-medium"
            style={{ backgroundColor: canDelete ? "#dc2626" : "rgba(220,38,38,0.4)" }}
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
            {t("profileDeleteAccount" as any) || "Slet min konto"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, rows, unit }: { title: string; rows: CountRow[]; unit: string }) {
  const visible = rows.filter((r) => r.count > 0 || r.error);
  if (visible.length === 0) {
    return (
      <div>
        <h3 className="text-xs uppercase tracking-wider text-white/45 mb-2">{title}</h3>
        <p className="text-xs text-white/40">—</p>
      </div>
    );
  }
  return (
    <div>
      <h3 className="text-xs uppercase tracking-wider text-white/45 mb-2">{title}</h3>
      <ul className="text-xs text-white/70 space-y-1">
        {visible.map((r) => (
          <li key={`${r.table}.${r.column}`} className="flex justify-between gap-2">
            <span className="truncate">{r.table} <span className="text-white/30">({r.column})</span></span>
            <span className={r.error ? "text-red-400" : ""}>
              {r.error ? r.error : `${r.count} ${unit}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
