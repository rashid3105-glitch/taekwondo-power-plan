import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  UserCircle, ClipboardList, HeartPulse, Brain, Users, BarChart3, Clock, ChevronDown,
  Activity, Apple, TrendingUp, BookOpen, BookHeart, Download, Video, CalendarRange,
  MessageSquare, MessageCircle, NotebookPen, Search, X, Dumbbell, Heart, Sparkles, UserCog, Settings, FileText, ArrowLeft,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { PublicNav } from "@/components/PublicNav";
import { Watermark } from "@/components/Watermark";
import { PageMeta } from "@/components/PageMeta";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type TopicKey =
  | "helpProfile" | "helpSeasonPlan" | "helpSeasonCalendar" | "helpWearables" | "helpCoachFeedback"
  | "helpMatchAnalysis" | "helpMatchReport" | "helpTrainingPlan" | "helpPhysicalTesting" | "helpProgress"
  | "helpNutrition" | "helpRehabPlan" | "helpMentalPlan" | "helpLibrary" | "helpDiary"
  | "helpReflection" | "helpParentPortal"
  | "helpAddStudents" | "helpStudentProgress" | "helpChat" | "helpWeeklyReport"
  | "helpRoles" | "helpRoleSwitcher";

type Topic = { key: TopicKey; icon: typeof UserCircle; isNew?: boolean };

const TOPICS: Record<TopicKey, Topic> = {
  helpProfile: { key: "helpProfile", icon: UserCircle },
  helpSeasonPlan: { key: "helpSeasonPlan", icon: CalendarRange, isNew: true },
  helpWearables: { key: "helpWearables", icon: NotebookPen, isNew: true },
  helpCoachFeedback: { key: "helpCoachFeedback", icon: MessageSquare, isNew: true },
  helpMatchAnalysis: { key: "helpMatchAnalysis", icon: Video },
  helpMatchReport: { key: "helpMatchReport", icon: FileText, isNew: true },
  helpTrainingPlan: { key: "helpTrainingPlan", icon: ClipboardList },
  helpPhysicalTesting: { key: "helpPhysicalTesting", icon: Activity, isNew: true },
  helpProgress: { key: "helpProgress", icon: TrendingUp },
  helpNutrition: { key: "helpNutrition", icon: Apple },
  helpRehabPlan: { key: "helpRehabPlan", icon: HeartPulse, isNew: true },
  helpMentalPlan: { key: "helpMentalPlan", icon: Brain },
  helpLibrary: { key: "helpLibrary", icon: BookOpen },
  helpDiary: { key: "helpDiary", icon: BookHeart },
  helpReflection: { key: "helpReflection", icon: NotebookPen, isNew: true },
  helpParentPortal: { key: "helpParentPortal", icon: Users, isNew: true },
  helpAddStudents: { key: "helpAddStudents", icon: Users },
  helpStudentProgress: { key: "helpStudentProgress", icon: BarChart3 },
  helpChat: { key: "helpChat", icon: MessageCircle, isNew: true },
  helpWeeklyReport: { key: "helpWeeklyReport", icon: FileText, isNew: true },
  helpSeasonCalendar: { key: "helpSeasonCalendar", icon: CalendarRange, isNew: true },
  helpRoles: { key: "helpRoles", icon: UserCircle, isNew: true },
  helpRoleSwitcher: { key: "helpRoleSwitcher", icon: Settings, isNew: true },
};

type SectionDef = {
  id: string;
  titleKey: string;
  icon: typeof Dumbbell;
  /** Tailwind class fragment for the colored chip background, e.g. 'bg-primary' */
  chipBg: string;
  chipFg: string;
  accent: string; // border color class
  topics: TopicKey[];
};

const SECTIONS: SectionDef[] = [
  {
    id: "training",
    titleKey: "helpSectionTraining",
    icon: Dumbbell,
    chipBg: "bg-primary",
    chipFg: "text-primary-foreground",
    accent: "bg-primary",
    topics: ["helpTrainingPlan", "helpSeasonPlan", "helpPhysicalTesting", "helpMatchAnalysis", "helpMatchReport", "helpProgress"],
  },
  {
    id: "health",
    titleKey: "helpSectionHealth",
    icon: Heart,
    chipBg: "bg-tab-rehab",
    chipFg: "text-white",
    accent: "bg-tab-rehab",
    topics: ["helpRehabPlan", "helpNutrition", "helpWearables"],
  },
  {
    id: "mental",
    titleKey: "helpSectionMental",
    icon: Sparkles,
    chipBg: "bg-tab-mental",
    chipFg: "text-white",
    accent: "bg-tab-mental",
    topics: ["helpMentalPlan", "helpDiary", "helpReflection"],
  },
  {
    id: "coach",
    titleKey: "helpSectionCoach",
    icon: UserCog,
    chipBg: "bg-tab-progress",
    chipFg: "text-white",
    accent: "bg-tab-progress",
    topics: ["helpAddStudents", "helpStudentProgress", "helpSeasonCalendar", "helpCoachFeedback", "helpChat", "helpWeeklyReport"],
  },
  {
    id: "account",
    titleKey: "helpSectionAccount",
    icon: Settings,
    chipBg: "bg-tab-nutrition",
    chipFg: "text-white",
    accent: "bg-tab-nutrition",
    topics: ["helpProfile", "helpLibrary", "helpParentPortal", "helpRoles", "helpRoleSwitcher"],
  },
];

const SECTION_FALLBACK: Record<string, string> = {
  helpSectionTraining: "Training & Plans",
  helpSectionHealth: "Health & Recovery",
  helpSectionMental: "Mental & Diary",
  helpSectionCoach: "Coach Tools",
  helpSectionAccount: "Account & Setup",
  helpSearchPlaceholder: "Search help topics…",
  helpNoResults: "No matching topics",
  helpClear: "Clear",
  helpResults: "Results",
};

const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export default function Help() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTopic, setActiveTopic] = useState<TopicKey | null>(null);
  const [query, setQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAllChangelog, setShowAllChangelog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      setIsLoggedIn(!!user);
      if (!user) return;
      const { data } = await supabase.rpc("is_admin", { _user_id: user.id });
      if (!cancelled && data === true) setIsAdmin(true);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  // Translation helper with safe fallback for new section keys
  const tr = (key: string) => {
    const val = t(key as Parameters<typeof t>[0]);
    if (typeof val === "string" && val && val !== key) return val;
    return SECTION_FALLBACK[key] ?? key;
  };

  // Focus search on "/" key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        setQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const q = normalize(query.trim());
  const isSearching = q.length > 0;

  const matches = useMemo(() => {
    if (!isSearching) return null;
    const all: { topic: Topic; section: SectionDef }[] = [];
    SECTIONS.forEach((section) => {
      section.topics.forEach((tk) => {
        const topic = TOPICS[tk];
        const title = normalize(tr(`${tk}Title`));
        const steps = normalize(tr(`${tk}Steps`));
        if (title.includes(q) || steps.includes(q)) {
          all.push({ topic, section });
        }
      });
    });
    return all;
  }, [isSearching, q]);

  const scrollToSection = (id: string) => {
    document.getElementById(`help-section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderTopicCard = (topic: Topic, section: SectionDef) => {
    const Icon = topic.icon;
    const isActive = activeTopic === topic.key;
    const titleRaw = tr(`${topic.key}Title`);
    return (
      <div key={topic.key} className="space-y-2">
        <button
          onClick={() => setActiveTopic(isActive ? null : topic.key)}
          className={cn(
            "relative w-full flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all min-h-[64px]",
            isActive
              ? "border-primary bg-card shadow-md ring-2 ring-primary/30"
              : "border-border bg-card hover:bg-muted/50 hover:-translate-y-0.5 shadow-sm hover:shadow-md"
          )}
        >
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            section.chipBg,
            section.chipFg
          )}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="font-semibold text-sm text-foreground flex-1 leading-tight">
            {titleRaw.includes("\n") ? (
              <span className="flex flex-col">
                {titleRaw.split("\n").map((line, i) => (
                  <span key={i} className={i === 0 ? "text-[10px] text-muted-foreground leading-tight uppercase tracking-wide" : ""}>
                    {line}
                  </span>
                ))}
              </span>
            ) : (
              titleRaw
            )}
          </span>
          {topic.isNew && (
            <span className="absolute -top-1.5 -right-1.5 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide shadow-sm">
              {t("newBadge")}
            </span>
          )}
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", isActive && "rotate-180")} />
        </button>
        {isActive && (
          <div className={cn(
            "rounded-xl border bg-card px-5 py-4 animate-in fade-in-0 slide-in-from-top-2 shadow-sm border-t-4",
            "border-border"
          )}
          style={{ borderTopColor: "currentColor" }}
          >
            <div className={cn("h-1 -mt-4 -mx-5 mb-4 rounded-t-xl", section.accent)} />
            <div className="space-y-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {tr(`${topic.key}Steps`)}
            </div>
            {topic.key === "helpSeasonCalendar" && (
              <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                <p className="text-xs font-semibold text-foreground">Dag-prikker / Day dots</p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full" style={{ width: 5, height: 5, backgroundColor: "#3b82f6" }} />
                    <span className="text-xs text-muted-foreground">TKD</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full" style={{ width: 5, height: 5, backgroundColor: "#10b981" }} />
                    <span className="text-xs text-muted-foreground">Gym / Styrke</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full" style={{ width: 7, height: 7, backgroundColor: "#ef4444" }} />
                    <span className="text-xs text-muted-foreground">Stævne</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Hver dag viser farvede prikker for den planlagte session. Dage med flere sessioner (fx både TKD og styrke) viser flere prikker side om side.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background relative">
      <PageMeta title="Help Center" description="Get help with Sportstalent features and training tools." canonical="https://sportstalent.dk/help" />
      <Watermark />
      <PublicNav />

      {/* Hero */}
      <div className="px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-3 text-center">
          {isLoggedIn && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-sm"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("backToDashboard")}
              </button>
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">{t("helpTitle")}</h1>
          <p className="text-muted-foreground">{t("helpSubtitle")}</p>
        </div>
      </div>

      {/* Gradient transition */}
      <div className="h-12 bg-gradient-to-b from-background to-[hsl(210,20%,97%)]" aria-hidden="true" />

      <div className="theme-light-section px-4 pb-12">
        <div className="mx-auto max-w-3xl">
          {/* Sticky search + chips */}
          <div className="sticky top-0 z-20 -mx-4 px-4 py-3 bg-[hsl(210,20%,97%)]/85 backdrop-blur-md border-b border-border/40">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tr("helpSearchPlaceholder")}
                className="h-11 pl-9 pr-10 bg-card border-border rounded-xl shadow-sm"
                aria-label={tr("helpSearchPlaceholder")}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
                  aria-label={tr("helpClear")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {!isSearching && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
                {SECTIONS.map((s) => {
                  const SIcon = s.icon;
                  return (
                    <button
                      key={s.id}
                      onClick={() => scrollToSection(s.id)}
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-sm"
                    >
                      <SIcon className="h-3.5 w-3.5" />
                      {tr(s.titleKey)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-6 space-y-10">
            {/* Search results */}
            {isSearching && matches && (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-lg font-bold text-foreground">
                    {tr("helpResults")} <span className="text-muted-foreground font-medium">({matches.length})</span>
                  </h2>
                </div>
                {matches.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
                    <p className="text-sm text-muted-foreground">{tr("helpNoResults")}</p>
                    <button
                      onClick={() => setQuery("")}
                      className="mt-3 text-sm font-semibold text-primary hover:underline"
                    >
                      {tr("helpClear")}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matches.map(({ topic, section }) => (
                      <div key={topic.key}>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">
                          {tr(section.titleKey)}
                        </div>
                        {renderTopicCard(topic, section)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sections */}
            {!isSearching && SECTIONS.map((section) => {
              const SIcon = section.icon;
              return (
                <section key={section.id} id={`help-section-${section.id}`} className="scroll-mt-24">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn("w-1 h-7 rounded-full", section.accent)} />
                    <SIcon className="h-5 w-5 text-foreground" />
                    <h2 className="text-xl font-extrabold text-foreground">{tr(section.titleKey)}</h2>
                    <span className="ml-auto text-xs font-medium text-muted-foreground">
                      {section.topics.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {section.topics.map((tk) => renderTopicCard(TOPICS[tk], section))}
                  </div>
                </section>
              );
            })}

            {/* Install as app */}
            {!isSearching && (
              <button
                onClick={() => navigate("/install")}
                className="w-full flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 px-4 py-4 text-left transition-colors shadow-sm"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Download className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-foreground">{t("installLink")}</div>
                  <div className="text-xs text-muted-foreground">{t("installSubtitle")}</div>
                </div>
              </button>
            )}

            {/* Changelog */}
            {!isSearching && (
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 w-full group cursor-pointer">
                  <Clock className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-extrabold text-foreground">{t("changelogTitle")}</h2>
                  <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-3">
                  {(() => {
                    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
                    const visible = (isAdmin || showAllChangelog)
                      ? CHANGELOG
                      : CHANGELOG.filter(({ dateKey }) => {
                          const m = dateKey.match(/^changelog_(\d{4})_(\d{2})_(\d{2})$/);
                          if (!m) return true;
                          return new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`).getTime() >= cutoff;
                        });
                    return (
                      <>
                        {visible.map(({ dateKey, entries, build }) => (
                          <div key={dateKey} className="rounded-xl border border-border bg-card px-5 py-4 space-y-3 shadow-sm">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <h3 className="text-sm font-bold text-foreground">{t(dateKey as Parameters<typeof t>[0])}</h3>
                              {build && (
                                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                                  {build}
                                </span>
                              )}
                            </div>
                            <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
                              {entries.map((e) => (
                                <li key={e}>{t(e as Parameters<typeof t>[0])}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                        {!isAdmin && !showAllChangelog && visible.length < CHANGELOG.length && (
                          <button
                            type="button"
                            onClick={() => setShowAllChangelog(true)}
                            className="w-full rounded-xl border border-dashed border-border bg-card/50 px-4 py-3 text-sm font-semibold text-primary hover:bg-muted/50 transition-colors"
                          >
                            {t("changelogShowAll")}
                          </button>
                        )}
                      </>
                    );
                  })()}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Build numbers start at v1.0.0 on 2026-05-29 (first build with semantic versioning).
// MINOR bumps for new features, PATCH bumps for small tweaks/fixes. Older releases left unversioned.
const CHANGELOG: { dateKey: string; entries: string[]; build?: string }[] = [
  { dateKey: "changelog_2026_06_04", entries: ["changelogEntry137"], build: "v1.0.6" },
  { dateKey: "changelog_2026_06_03", entries: ["changelogEntry136", "changelogEntry135"], build: "v1.0.5" },
  { dateKey: "changelog_2026_06_02", entries: ["changelogEntry134", "changelogEntry133"], build: "v1.0.3" },
  { dateKey: "changelog_2026_06_01", entries: ["changelogEntry132", "changelogEntry131"], build: "v1.0.1" },
  { dateKey: "changelog_2026_05_29", entries: ["changelogEntry126", "changelogEntry127", "changelogEntry128", "changelogEntry129", "changelogEntry130"], build: "v1.0.0" },
  { dateKey: "changelog_2026_05_28", entries: ["changelogEntry122", "changelogEntry123", "changelogEntry124", "changelogEntry125"] },
  { dateKey: "changelog_2026_05_21", entries: ["changelogEntry119", "changelogEntry120", "changelogEntry121"] },
  { dateKey: "changelog_2026_05_17", entries: ["changelogEntry117"] },
  { dateKey: "changelog_2026_05_15", entries: ["changelogEntry116"] },
  { dateKey: "changelog_2026_05_14b", entries: ["changelogEntry115"] },
  { dateKey: "changelog_2026_05_14", entries: ["changelogEntry112", "changelogEntry113", "changelogEntry114"] },
  { dateKey: "changelog_2026_05_11", entries: ["changelogEntry110"] },
  { dateKey: "changelog_2026_05_10b", entries: ["changelogEntry109"] },
  { dateKey: "changelog_2026_05_10", entries: ["changelogEntry106", "changelogEntry107", "changelogEntry108"] },
  { dateKey: "changelog_2026_05_09", entries: ["changelogEntry102", "changelogEntry103", "changelogEntry104", "changelogEntry105"] },
  { dateKey: "changelog_2026_05_06", entries: ["changelogEntry98", "changelogEntry99", "changelogEntry100", "changelogEntry101"] },
  { dateKey: "changelog_2026_05_04", entries: ["changelogEntry95", "changelogEntry96", "changelogEntry97"] },
  { dateKey: "changelog_2026_05_01", entries: ["changelogEntry92", "changelogEntry93", "changelogEntry94"] },
  { dateKey: "changelog_2026_04_27", entries: ["changelogEntry89", "changelogEntry90", "changelogEntry91"] },
  { dateKey: "changelog_2026_04_26", entries: ["changelogEntry86", "changelogEntry87", "changelogEntry88"] },
  { dateKey: "changelog_2026_04_23", entries: ["changelogEntry74","changelogEntry75","changelogEntry76","changelogEntry77","changelogEntry78","changelogEntry79","changelogEntry80","changelogEntry81","changelogEntry82","changelogEntry83","changelogEntry84","changelogEntry85"] },
  { dateKey: "changelog_2026_04_22", entries: ["changelogEntry67","changelogEntry68","changelogEntry69","changelogEntry70","changelogEntry71","changelogEntry72","changelogEntry73"] },
  { dateKey: "changelog_2026_04_20", entries: ["changelogEntry63","changelogEntry64","changelogEntry65","changelogEntry66"] },
  { dateKey: "changelog_2026_04_16", entries: ["changelogEntry57","changelogEntry58","changelogEntry59","changelogEntry60","changelogEntry61","changelogEntry62"] },
  { dateKey: "changelog_2026_04_10", entries: ["changelogEntry52","changelogEntry53","changelogEntry54","changelogEntry55","changelogEntry56"] },
  { dateKey: "changelog_2026_04_06", entries: ["changelogEntry46","changelogEntry47","changelogEntry48","changelogEntry49","changelogEntry50","changelogEntry51"] },
  { dateKey: "changelog_2026_04_01", entries: ["changelogEntry40","changelogEntry41","changelogEntry42","changelogEntry43","changelogEntry44","changelogEntry45"] },
  { dateKey: "changelog_2026_03_30", entries: ["changelogEntry35","changelogEntry36","changelogEntry37","changelogEntry38","changelogEntry39"] },
  { dateKey: "changelog_2026_03_28", entries: ["changelogEntry29","changelogEntry30","changelogEntry31","changelogEntry32","changelogEntry33","changelogEntry34"] },
  { dateKey: "changelog_2026_03_25", entries: ["changelogEntry17","changelogEntry18","changelogEntry19","changelogEntry20","changelogEntry21","changelogEntry22","changelogEntry23","changelogEntry24","changelogEntry25","changelogEntry26","changelogEntry27","changelogEntry28"] },
  { dateKey: "changelog_2026_03_24", entries: ["changelogEntry9","changelogEntry10","changelogEntry11","changelogEntry12","changelogEntry13","changelogEntry14","changelogEntry15","changelogEntry16"] },
  { dateKey: "changelog_2026_03_23", entries: ["changelogEntry1","changelogEntry2","changelogEntry3","changelogEntry4","changelogEntry5","changelogEntry6","changelogEntry7","changelogEntry8"] },
];
