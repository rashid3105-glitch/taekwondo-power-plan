import { AnimatePresence, motion } from "framer-motion";
import { useActiveClub } from "@/contexts/ActiveClubContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Building2 } from "lucide-react";

const LABEL: Record<string, string> = {
  da: "Skifter klub",
  en: "Switching club",
  sv: "Byter klubb",
  de: "Wechsle Verein",
  ar: "تغيير النادي",
  no: "Bytter klubb",
  es: "Cambiando de club",
};

export function ClubSwitchOverlay() {
  const { switchingTo } = useActiveClub();
  const { locale } = useLanguage();
  const label = LABEL[locale] ?? LABEL.en;

  return (
    <AnimatePresence>
      {switchingTo && (
        <motion.div
          key={switchingTo.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/85 backdrop-blur-md pointer-events-none motion-reduce:backdrop-blur-none"
          aria-live="polite"
          role="status"
        >
          <motion.div
            initial={{ scale: 0.94, y: 8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-4 px-8 text-center motion-reduce:transform-none"
          >
            <motion.div
              initial={{ rotate: -8, scale: 0.85 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 to-primary/5 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.5)]"
            >
              <span className="text-3xl font-black tracking-tight text-primary">
                {switchingTo.name.trim().charAt(0).toUpperCase() || (
                  <Building2 className="h-8 w-8" />
                )}
              </span>
            </motion.div>
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                {label}
              </p>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {switchingTo.name}
              </p>
            </div>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
              className="h-[2px] w-28 origin-left rounded-full bg-gradient-to-r from-transparent via-primary to-transparent"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
