// Catalog browser. Group catalog by category and let the user pick a test.

import { useMemo, useState } from "react";
import {
  TEST_CATALOG,
  TEST_CATEGORIES,
  type TestCategory,
  type TestDefinition,
  localizedTestName,
} from "@/lib/testCatalog";
import { useLanguage } from "@/i18n/LanguageContext";
import { Play, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Props {
  onPick: (def: TestDefinition) => void;
}

export function TestCatalogPicker({ onPick }: Props) {
  const { t, locale } = useLanguage();
  const [query, setQuery] = useState("");
  const [openCat, setOpenCat] = useState<TestCategory | null>(TEST_CATEGORIES[0]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TEST_CATALOG;
    return TEST_CATALOG.filter((d) =>
      localizedTestName(d, locale).toLowerCase().includes(q),
    );
  }, [query, locale]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("ptPickTestPrompt")}
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        {TEST_CATEGORIES.map((cat) => {
          const tests = filtered.filter((d) => d.category === cat);
          if (tests.length === 0) return null;
          const isOpen = query.trim().length > 0 || openCat === cat;
          return (
            <div key={cat} className="rounded-lg border border-border bg-card overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-accent/30"
                onClick={() => setOpenCat(isOpen && !query ? null : cat)}
              >
                <span className="text-sm font-semibold text-card-foreground">
                  {t(`ptCat_${cat}`)}
                </span>
                <span className="text-xs text-muted-foreground">{tests.length}</span>
              </button>
              {isOpen && (
                <ul className="divide-y divide-border/60">
                  {tests.map((d) => (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => onPick(d)}
                        className={cn(
                          "w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-primary/5 active:bg-primary/10",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-card-foreground truncate">
                            {localizedTestName(d, locale)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {d.unit} ·{" "}
                            {d.direction === "lower_is_better"
                              ? t("ptDirection_lower")
                              : t("ptDirection_higher")}
                          </div>
                        </div>
                        <span
                          aria-label={t("ptStartTest")}
                          className="shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-full bg-primary text-primary-foreground shadow-sm group-hover:scale-105 transition-transform"
                        >
                          <Play className="h-4 w-4 fill-current" />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
