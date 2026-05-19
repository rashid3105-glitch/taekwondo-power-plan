import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Check, X } from "lucide-react";
import { useChatAttachmentUrl } from "@/hooks/useChatAttachmentUrl";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ChatMessage } from "@/lib/chatApi";

interface Props {
  message: ChatMessage;
  isOwn: boolean;
  senderName?: string;
  showSender?: boolean;
  onDelete?: () => void;
  onEdit?: (newBody: string) => void;
}

const EDIT_WINDOW_MS = 60_000;

export function MessageBubble({
  message,
  isOwn,
  senderName,
  showSender,
  onDelete,
  onEdit,
}: Props) {
  const url = useChatAttachmentUrl(message.attachment_path);
  const isImage = message.attachment_type?.startsWith("image/");
  const isVideo = message.attachment_type?.startsWith("video/");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const canEdit =
    isOwn && Date.now() - new Date(message.created_at).getTime() < EDIT_WINDOW_MS;

  const confirmEdit = () => {
    const v = draft.trim();
    if (v && v !== message.body) onEdit?.(v);
    setEditing(false);
  };

  return (
    <div className={cn("flex flex-col mb-2 group", isOwn ? "items-end" : "items-start")}>
      {showSender && !isOwn && senderName && (
        <span className="text-[10px] text-muted-foreground ml-2 mb-0.5">{senderName}</span>
      )}

      {editing ? (
        <div className="max-w-[78%] w-full flex flex-col gap-1">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[60px] text-sm"
            autoFocus
          />
          <div className="flex gap-1 justify-end">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" className="h-7 w-7" onClick={confirmEdit}>
              <Check className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-end gap-1">
          {isOwn && (onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition text-muted-foreground hover:text-foreground p-1"
                  aria-label="Beskedhandlinger"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top">
                {canEdit && onEdit && (
                  <DropdownMenuItem onClick={() => { setDraft(message.body); setEditing(true); }}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Rediger
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={(e) => { e.preventDefault(); setConfirmDelete(true); }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Slet
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <div
            className={cn(
              "max-w-[78%] rounded-2xl px-3 py-2 text-sm break-words",
              isOwn
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-muted text-foreground rounded-bl-sm",
            )}
          >
            {url && isImage && (
              <img src={url} alt="" className="rounded-lg max-h-60 mb-1 object-cover" />
            )}
            {url && isVideo && (
              <video src={url} controls className="rounded-lg max-h-60 mb-1" />
            )}
            {message.body && <div className="whitespace-pre-wrap">{message.body}</div>}
          </div>
        </div>
      )}

      <span className="text-[10px] text-muted-foreground mt-0.5 mx-2">
        {time}
        {message.edited_at && <span className="ml-1">(redigeret)</span>}
      </span>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slet besked?</AlertDialogTitle>
            <AlertDialogDescription>
              Beskeden slettes permanent for alle deltagere.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { setConfirmDelete(false); onDelete?.(); }}
            >
              Slet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
