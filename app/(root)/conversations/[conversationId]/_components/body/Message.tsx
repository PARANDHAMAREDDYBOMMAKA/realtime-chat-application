import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, CheckCheck, Download, FileText } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import AudioPlayer from "./AudioPlayer";
import MessageActions from "./MessageActions";
import MessageReactions from "./MessageReactions";
import ReactionPicker from "./ReactionPicker";
import { toast } from "sonner";

type Props = {
  messageId: Id<"messages">;
  fromCurrentUser: boolean;
  senderImage: string;
  senderName: string;
  lastByUser: boolean;
  content: string[];
  createdAt: number;
  type: string;
  seen?: boolean;
};

const Message = ({
  messageId,
  fromCurrentUser,
  senderImage,
  senderName,
  lastByUser,
  content,
  createdAt,
  type,
  seen,
}: Props) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const fileUrl = useQuery(
    api.files.getUrl,
    type !== "text" && type !== "system" && content[0] ? { storageId: content[0] } : "skip"
  );

  const reactions = useQuery(
    api.reactions.getMessageReactions,
    messageId ? { messageId } : "skip"
  );

  const deleteMessage = useMutation(api.message.deleteMessage);
  const addReaction = useMutation(api.reactions.addReaction);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Render system messages (like "User left the group") differently
  if (type === "system") {
    return (
      <div className="flex items-center justify-center my-2">
        <div className="bg-muted/60 backdrop-blur-sm text-muted-foreground text-xs px-3 py-1.5 rounded-full shadow-sm border border-border/30">
          {content[0]}
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteMessage({ messageId });
      toast.success("Message deleted");
    } catch (error) {
      toast.error("Failed to delete message");
      console.error(error);
    }
  };

  const handleAddReaction = async (emoji: string) => {
    try {
      await addReaction({ messageId, emoji });
    } catch (error) {
      toast.error("Failed to add reaction");
      console.error(error);
    }
  };

  const formatTime = (timeStamp: number) => {
    return format(timeStamp, "HH:mm");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div
      className={cn(
        "flex items-end gap-2 transition-all duration-300 transform",
        {
          "justify-end": fromCurrentUser,
          "opacity-0 translate-y-4": !isVisible,
          "opacity-100 translate-y-0": isVisible
        }
      )}
    >
      {/* Avatar for non-current user messages */}
      {!fromCurrentUser && (
        <Avatar
          className={cn("h-8 w-8 rounded-full ring-2 ring-border/20 transition-all duration-200", {
            "invisible": lastByUser,
            "hover:ring-primary/50": !lastByUser
          })}
        >
          <AvatarImage src={senderImage} alt={senderName} className="rounded-full object-cover" />
          <AvatarFallback className="rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
            {senderName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn("flex flex-col max-w-[70%] transition-all duration-200", {
          "items-end": fromCurrentUser,
          "items-start": !fromCurrentUser,
        })}
      >
        {/* Sender name for group messages */}
        {!fromCurrentUser && !lastByUser && (
          <span className="text-xs text-muted-foreground mb-1 px-3 font-medium">
            {senderName}
          </span>
        )}

        {/* Message bubble with actions */}
        <div className="relative group">
          {/* Message bubble */}
          <div
            className={cn(
              "relative px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md",
              {
                // Current user styling
                "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-primary/20": fromCurrentUser,
                "rounded-br-md": fromCurrentUser && !lastByUser,

                // Other user styling
                "bg-gradient-to-br from-muted to-muted/80 text-foreground border border-border/50": !fromCurrentUser,
                "rounded-bl-md": !fromCurrentUser && !lastByUser,

                // Hover effects
                "hover:shadow-primary/30": fromCurrentUser,
                "hover:border-primary/30": !fromCurrentUser,
              }
            )}
          >
          {/* Message content */}
          {type === "text" && (
            <div className="space-y-1">
              <p className="text-wrap break-words whitespace-pre-wrap leading-relaxed">
                {content}
              </p>
            </div>
          )}

          {/* Image message */}
          {type === "image" && fileUrl && (
            <div className="space-y-2">
              <div className="relative max-w-sm rounded-lg overflow-hidden">
                <img
                  src={fileUrl}
                  alt={content[1] || "Image"}
                  className="w-full h-auto object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(fileUrl, "_blank")}
                />
              </div>
              {content[1] && (
                <p className="text-xs opacity-70">{content[1]}</p>
              )}
            </div>
          )}

          {/* Video message */}
          {type === "video" && fileUrl && (
            <div className="space-y-2">
              <div className="relative max-w-sm rounded-lg overflow-hidden">
                <video
                  src={fileUrl}
                  controls
                  className="w-full h-auto rounded-lg"
                  style={{ maxHeight: "400px" }}
                />
              </div>
              {content[1] && (
                <p className="text-xs opacity-70">{content[1]}</p>
              )}
            </div>
          )}

          {/* Audio message */}
          {type === "audio" && fileUrl && (
            <div className="space-y-2">
              <AudioPlayer audioUrl={fileUrl} fromCurrentUser={fromCurrentUser} />
              {content[1] && (
                <p className="text-xs opacity-60 truncate px-1">{content[1]}</p>
              )}
            </div>
          )}

          {/* File message */}
          {type === "file" && fileUrl && (
            <a
              href={fileUrl}
              download={content[1] || "file"}
              className="flex items-center gap-3 p-3 rounded-lg bg-background/10 hover:bg-background/20 transition-colors cursor-pointer min-w-[200px]"
            >
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {content[1] || "File"}
                </p>
                {content[2] && (
                  <p className="text-xs opacity-70">
                    {formatFileSize(parseInt(content[2]))}
                  </p>
                )}
              </div>
              <Download className="h-4 w-4 flex-shrink-0" />
            </a>
          )}

          {/* Timestamp and status */}
          <div
            className={cn("flex items-center justify-between mt-2 gap-2", {
              "justify-end": fromCurrentUser,
              "justify-start": !fromCurrentUser,
            })}
          >
            <span
              className={cn("text-xs opacity-70 group-hover:opacity-90 transition-opacity", {
                "text-primary-foreground/80": fromCurrentUser,
                "text-muted-foreground": !fromCurrentUser,
              })}
            >
              {formatTime(createdAt)}
            </span>

            {/* Read status for current user messages (only in 1:1 chats) */}
            {fromCurrentUser && seen !== undefined && (
              <div className="flex items-center">
                {seen ? (
                  <CheckCheck className="w-3 h-3 text-green-400 opacity-80" />
                ) : (
                  <Check className="w-3 h-3 text-primary-foreground/60" />
                )}
              </div>
            )}
          </div>

          {/* Message bubble tail */}
          <div
            className={cn("absolute top-3 w-3 h-3 transform rotate-45", {
              "right-[-6px] bg-gradient-to-br from-primary to-primary/90": fromCurrentUser && !lastByUser,
              "left-[-6px] bg-gradient-to-br from-muted to-muted/80 border-l border-t border-border/50": !fromCurrentUser && !lastByUser,
              "hidden": lastByUser
            })}
          />

          {/* Message actions - positioned as overlay */}
          <div className={cn("absolute -top-3 z-20", {
            "right-2": fromCurrentUser,
            "left-2": !fromCurrentUser,
          })}>
            <ReactionPicker onSelect={handleAddReaction}>
              <div className="inline-block">
                <MessageActions
                  onDelete={handleDelete}
                  onReact={() => setShowReactionPicker(!showReactionPicker)}
                  fromCurrentUser={fromCurrentUser}
                />
              </div>
            </ReactionPicker>
          </div>
          </div>

          {/* Reactions display */}
          {reactions && reactions.length > 0 && (
            <MessageReactions
              reactions={reactions}
              onToggleReaction={handleAddReaction}
            />
          )}
        </div>
      </div>

      {/* Avatar for current user messages */}
      {fromCurrentUser && (
        <Avatar
          className={cn("h-8 w-8 rounded-full ring-2 ring-primary/20 transition-all duration-200", {
            "invisible": lastByUser,
            "hover:ring-primary/50": !lastByUser
          })}
        >
          <AvatarImage src={senderImage} alt={senderName} className="rounded-full object-cover" />
          <AvatarFallback className="rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
            {senderName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default Message;
