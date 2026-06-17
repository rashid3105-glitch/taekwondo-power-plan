import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useRole } from "@/contexts/RoleContext";
import { ChevronDown, ChevronUp, Youtube, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  TEST_CATALOG,
  TEST_CATEGORIES,
  type TestDefinition,
  localizedTestName,
  localizedProtocol,
} from "@/lib/testCatalog";
import { PhysicalTesting } from "@/components/PhysicalTesting";

export function TestLibrary() {
  const { t, locale } = useLanguage();
  const { hasCoachRole } = useRole();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resultsOpen, setResultsOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Test results entry */}
      <div className="flex justify-end">
        <Button
          onClick={() => setResultsOpen(true)}
          className="gap-2"
          size="sm"
        >
          <ClipboardList className="h-4 w-4" />
          {t("ptTestResultsButton")}
        </Button>
      </div>

      {TEST_CATEGORIES.map((cat) => {
        const catTests = TEST_CATALOG.filter((d) => d.category === cat);
        if (catTests.length === 0) return null;

        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-base font-bold text-foreground">{t(`ptCat_${cat}` as any)}</h2>
              <Badge variant="secondary" className="text-[10px]">{catTests.length}</Badge>
            </div>

            <div className="space-y-2">
              {catTests.map((def) => {
                const isExpanded = expandedId === def.id;
                const name = localizedTestName(def, locale);
                return (
                  <div
                    key={def.id}
                    className="rounded-xl border border-border bg-card shadow-card overflow-hidden"
                  >
                    <button
                      className="w-full flex items-center justify-between p-4 text-left"
                      onClick={() => setExpandedId(isExpanded ? null : def.id)}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-card-foreground text-sm truncate">{name}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {def.unit} ·{" "}
                          {def.direction === "lower_is_better"
                            ? t("ptDirection_lower")
                            : t("ptDirection_higher")}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(def.names.en + " physical test")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded-md hover:bg-destructive/10 transition-colors"
                          title={`Search "${name}" on YouTube`}
                        >
                          <Youtube className="h-4 w-4 text-destructive" />
                        </a>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-border px-4 pb-4 pt-3 space-y-2">
                        <div>
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("ptUnit")}</span>
                          <p className="text-sm text-card-foreground font-mono">{def.unit}</p>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("ptProtocol")}</span>
                          <p className="text-sm text-card-foreground leading-relaxed whitespace-pre-line">
                            {localizedProtocol(def, locale)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <Dialog open={resultsOpen} onOpenChange={setResultsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("ptTestResultsButton")}</DialogTitle>
          </DialogHeader>
          <PhysicalTesting mode={hasCoachRole ? "coach" : "individual"} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Backwards-compatible export for callers that previously imported this helper from TestLibrary.
export { getLocalizedTestName } from "@/components/PhysicalTesting";
