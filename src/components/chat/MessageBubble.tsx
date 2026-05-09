import { useChatAttachmentUrl } from "@/hooks/useChatAttachmentUrl";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/chatApi";

interface Props {
  message: ChatMessage;
  isOwn: boolean;
  senderName?: string;
  showSender?: boolean;
}

export function MessageBubble({ message, isOwn, senderName, showSender }: Props) {
  const url = useChatAttachmentUrl(message.attachment_path);
  const isImage = message.attachment_type?.startsWith("image/");
  const isVideo = message.attachment_type?.startsWith("video/");

  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={cn("flex flex-col mb-2", isOwn ? "items-end" : "items-start")}>
      {showSender && !isOwn && senderName && (
        <span className="text-[10px] text-muted-foreground ml-2 mb-0.5">{senderName}</span>
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
      <span className="text-[10px] text-muted-foreground mt-0.5 mx-2">{time}</span>
    </div>
  );
}
