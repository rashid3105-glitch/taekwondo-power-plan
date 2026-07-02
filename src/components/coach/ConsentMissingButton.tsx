import { useEffect, useState } from "react";
import { FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useActiveClub } from "@/contexts/ActiveClubContext";
import { ConsentMissingPanel } from "@/components/coach/ConsentMissingPanel";

/**
 * Red trigger button that renders only when the club has athletes with
 * missing parental consent. Opens a modal containing the existing
 * `ConsentMissingPanel` so coaches can act on each athlete.
 */
export function ConsentMissingButton() {
  const { t } = useLanguage();
  const { activeClubId } = useActiveClub();
  const [count, setCount] = useState<number>(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.functions.invoke("consent-coach-actions", {
        body: { action: "list_missing", ...(activeClubId ? { club_id: activeClubId } : {}) },
      });
      if (cancelled) return;
      if (error || (data as any)?.error) {
        setCount(0);
        return;
      }
      setCount(((data as any)?.missing || []).length || 0);
    })();
    return () => { cancelled = true; };
  }, [activeClubId, open]);

  if (count === 0) return null;

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <FileWarning className="h-4 w-4" />
        <span>{t("consentMissingPanelTitle")}</span>
        <Badge variant="secondary" className="ml-1">{count}</Badge>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <FileWarning className="h-5 w-5" />
              {t("consentMissingPanelTitle")}
            </DialogTitle>
          </DialogHeader>
          <ConsentMissingPanel />
        </DialogContent>
      </Dialog>
    </>
  );
}
