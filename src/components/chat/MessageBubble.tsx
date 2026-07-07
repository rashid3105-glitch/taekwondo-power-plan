import { useRef, useState, Fragment } from "react";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;
function renderBodyWithLinks(body: string) {
  const parts = body.split(URL_REGEX);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      const isInternal = typeof window !== "undefined" && part.startsWith(window.location.origin);
      return (
        <a
          key={i}
          href={part}
          target={isInternal ? undefined : "_blank"}
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:opacity-80"
        >
          {part}
        </a>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
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
  senderAvatar?: string | null;
  showSender?: boolean;
  onDelete?: () => void;
  onEdit?: (newBody: string) => void;
  reactions?: { emoji: string; count: number; byMe: boolean }[];
  onReact?: (emoji: string) => void;
}

const EDIT_WINDOW_MS = 60_000;

export function MessageBubble({
  message,
  isOwn,
  senderName,
  showSender,
  senderAvatar,
  onDelete,
  onEdit,
  reactions = [],
  onReact,
}: Props) {
  const url = useChatAttachmentUrl(message.attachment_path);
  const isImage = message.attachment_type?.startsWith("image/");
  const isVideo = message.attachment_type?.startsWith("video/");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "🔥", "💪"];

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => setShowPicker(true), 500);
  };
  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

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
    <div className={cn("flex flex-col mb-2 group max-w-[78%]", isOwn ? "items-end ml-auto" : "items-start mr-auto")}>
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
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(false)} aria-label="Cancel" title="Cancel">
              <X className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" className="h-7 w-7" onClick={confirmEdit} aria-label="Save" title="Save">
              <Check className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-end gap-1.5">
          {/* Avatar for other people's messages */}
          {!isOwn && (
            <div className="h-7 w-7 rounded-full flex-shrink-0 overflow-hidden bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground self-end mb-0.5">
            {senderAvatar && !avatarError ? (
              <img
                src={senderAvatar}
                alt={senderName || ""}
                className="h-full w-full object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <span>{(senderName || "?").slice(0, 2).toUpperCase()}</span>
            )}
            </div>
          )}
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
              "relative rounded-2xl px-3 py-2 text-sm break-words",
              isOwn
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-muted text-card-foreground rounded-bl-sm",
            )}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchEnd}
            onMouseEnter={() => onReact && setShowPicker(true)}
            onMouseLeave={() => setShowPicker(false)}
          >
            {showPicker && onReact && (
              <div
                className={cn(
                  "absolute z-20 flex gap-1 bg-card border border-border rounded-2xl shadow-lg px-2 py-1.5 -top-10",
                  isOwn ? "right-0" : "left-0",
                )}
              >
                {REACTION_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => { onReact?.(e); setShowPicker(false); }}
                    className="text-lg hover:scale-125 transition-transform"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
            {url && isImage && (
              <img src={url} alt="" className="rounded-lg max-h-60 mb-1 object-cover" />
            )}
            {url && isVideo && (
              <video src={url} controls className="rounded-lg max-h-60 mb-1" />
            )}
            {message.body && <div className="whitespace-pre-wrap break-words">{renderBodyWithLinks(message.body)}</div>}
          </div>
        </div>
      )}

      {reactions && reactions.length > 0 && (
        <div className={cn("flex flex-wrap gap-1 mt-0.5", isOwn ? "justify-end" : "justify-start")}>
          {reactions.map((r) => (
            <button
              key={r.emoji}
              onClick={() => onReact?.(r.emoji)}
              className={cn(
                "flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs transition-colors",
                r.byMe
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "bg-muted border-border text-muted-foreground hover:bg-muted/80",
              )}
            >
              <span>{r.emoji}</span>
              <span className="font-semibold">{r.count}</span>
            </button>
          ))}
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
