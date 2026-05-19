import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus, Users, ArrowLeft } from "lucide-react";
import { useThreads } from "@/hooks/useThreads";
import { ThreadList } from "./ThreadList";
import { Conversation } from "./Conversation";
import { StartChatPicker } from "./StartChatPicker";
import { NewGroupDialog } from "./NewGroupDialog";
import type { ChatThread } from "@/lib/chatApi";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCoach?: boolean;
}

export function ChatDrawer({ open, onOpenChange, isCoach }: Props) {
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
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-card">
            {active ? (
              <Button variant="ghost" size="icon" onClick={() => setActive(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : (
              <span className="text-sm font-extrabold">Beskeder</span>
            )}
            {!active && (
              <div className="flex items-center gap-1">
                {isCoach && (
                  <Button variant="ghost" size="icon" onClick={() => setGroupOpen(true)} aria-label="Ny gruppe">
                    <Users className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setPickerOpen(true)} aria-label="Ny samtale">
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    navigate("/messages");
                  }}
                >
                  Åbn
                </Button>
              </div>
            )}
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
