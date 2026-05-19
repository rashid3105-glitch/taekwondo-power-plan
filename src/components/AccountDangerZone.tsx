import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { AlertTriangle, Download, Trash2, Loader2, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AccountDangerZone() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

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
      toast({ title: t("dataExported") });
    } catch {
      toast({ title: t("error"), variant: "destructive" });
    }
    setExporting(false);
  };

  const handleDelete = async () => {
    if (confirmation !== "DELETE MY ACCOUNT") return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-my-account", {
        body: { confirmation: "DELETE MY ACCOUNT" },
      });
      if (error) throw error;
      if (data?.success) {
        await supabase.auth.signOut();
        navigate("/");
        toast({ title: t("accountDeleted") });
      } else {
        throw new Error("Deletion failed");
      }
    } catch {
      toast({ title: t("error"), variant: "destructive" });
    }
    setDeleting(false);
    setDialogOpen(false);
    setConfirmation("");
  };

  return (
    <div className="mt-10 rounded-xl border-2 border-destructive/30 bg-destructive/5 p-5 space-y-4">
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="h-5 w-5" />
        <h3 className="font-bold text-base">{t("dangerZone")}</h3>
      </div>

      {/* Export data */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{t("exportDataDesc")}</p>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
          {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          {t("exportMyData")}
        </Button>
      </div>

      {/* Delete account */}
      <div className="space-y-2 pt-2 border-t border-destructive/20">
        <p className="text-sm text-muted-foreground">{t("deleteAccountDesc")}</p>
        <p className="text-xs font-semibold text-destructive">{t("deleteAccountWarning")}</p>

        <AlertDialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setConfirmation(""); }}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              {t("deleteMyAccount")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {t("deleteAccountConfirmTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <span className="block">{t("deleteAccountConfirmDesc")}</span>
                <span className="block font-bold text-destructive">{t("deleteAccountIrreversible")}</span>
                <span className="block text-sm">{t("deleteAccountExportFirst")}</span>
                <span className="block text-sm mt-2">
                  {t("deleteAccountTypeConfirm")} <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">DELETE MY ACCOUNT</code>
                </span>
                <Input
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="mt-2"
                />
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={confirmation !== "DELETE MY ACCOUNT" || deleting}
              >
                {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                {t("permanentlyDelete")}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
