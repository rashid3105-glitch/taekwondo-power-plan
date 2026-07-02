import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThreads } from "@/hooks/useThreads";
import { ChatDrawer } from "./ChatDrawer";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  isCoach?: boolean;
}

export function MessagesIcon({ isCoach }: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const { totalUnread } = useThreads();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="relative"
        aria-label={t("iconHintMessages")} title={t("iconHintMessages")}
      >
        <MessageCircle className="h-5 w-5" />
        {totalUnread > 0 && (
          <span className="absolute top-0.5 right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[16px] h-[16px] px-1 flex items-center justify-center">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </Button>
      <ChatDrawer open={open} onOpenChange={setOpen} isCoach={isCoach} />
    </>
  );
}
