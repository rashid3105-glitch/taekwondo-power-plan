import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus, Users, ArrowLeft, X } from "lucide-react";
import { useThreads } from "@/hooks/useThreads";
import { ThreadList } from "./ThreadList";
import { Conversation } from "./Conversation";
import { StartChatPicker } from "./StartChatPicker";
import { NewGroupDialog } from "./NewGroupDialog";
import type { ChatThread } from "@/lib/chatApi";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCoach?: boolean;
}

export function ChatDrawer({ open, onOpenChange, isCoach }: Props) {
  const { t } = useLanguage();
  const { threads, loading, refresh } = useThreads();
  const [active, setActive] = useState<ChatThread | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);

  const onStarted = async (id: string) => {
    await refresh();
    const t = (await import("@/lib/chatApi")).listThreads;
    const ts = await t();
    const found = ts.find((x) => x.id === id);
    if (found) setActive(found);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        {/* hideClose removes the absolute-positioned default X that lands in the iPhone safe area */}
        <SheetContent
          side="right"
          hideClose
          className="w-full sm:max-w-md p-0 flex flex-col"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          {/* Our own header — full control over placement */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card">
            {/* Left: back arrow when in a conversation */}
            {active ? (
              <Button variant="ghost" size="icon" onClick={() => setActive(null)} aria-label={t("back")} title={t("back")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            ) : (
              <span className="text-sm font-extrabold flex-1">Beskeder</span>
            )}

            {/* Middle spacer when in conversation */}
            {active && <span className="flex-1 text-sm font-semibold truncate" />}

            {/* Right: action buttons */}
            <div className="flex items-center gap-1 ml-auto">
              {!active && isCoach && (
                <Button variant="ghost" size="icon" onClick={() => setGroupOpen(true)} aria-label={t("iconHintMessages")} title={t("iconHintMessages")}>
                  <Users className="h-4 w-4" />
                </Button>
              )}
              {!active && (
                <Button variant="ghost" size="icon" onClick={() => setPickerOpen(true)} aria-label={t("iconHintSend")} title={t("iconHintSend")}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              {/* Close — always visible, always in our header, never behind safe area */}
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label={t("iconHintClose")} title={t("iconHintClose")}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {active ? (
              <Conversation thread={active} onBack={() => setActive(null)} />
            ) : (
              <ThreadList
                threads={threads}
                loading={loading}
                onSelect={setActive}
                onRefresh={refresh}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <StartChatPicker open={pickerOpen} onOpenChange={setPickerOpen} onStarted={onStarted} />
      <NewGroupDialog open={groupOpen} onOpenChange={setGroupOpen} onCreated={onStarted} />
    </>
  );
}
