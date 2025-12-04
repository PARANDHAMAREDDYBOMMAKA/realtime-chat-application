import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, CheckCheck, Download, FileText, Reply } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import AudioPlayer from "./AudioPlayer";
import MessageActions from "./MessageActions";
import MessageReactions from "./MessageReactions";
import ForwardMessageDialog from "./ForwardMessageDialog";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import MessageTranslation from "@/components/MessageTranslation";
import { toast } from "sonner";
import { useSwipeable } from "react-swipeable";

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
  replyTo?: Id<"messages">;
  storyReplyId?: Id<"stories">;
  storyReplyType?: "text" | "image" | "video";
  storyReplyContent?: string[];
  onReply?: (messageId: Id<"messages">) => void;
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
  replyTo,
  storyReplyId,
  storyReplyType,
  storyReplyContent,
  onReply,
}: Props) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fileUrl = useQuery(
    api.files.getUrl,
    type !== "text" && type !== "system" && content[0] ? { storageId: content[0] } : "skip"
  );

  const reactions = useQuery(
    api.reactions.getMessageReactions,
    messageId ? { messageId } : "skip"
  );

  const replyToMessage = useQuery(
    api.message.getById,
    replyTo ? { messageId: replyTo } : "skip"
  );

  // Get story file URL if this is a reply to an image/video story
  const storyFileUrl = useQuery(
    api.files.getUrl,
    storyReplyId && storyReplyType !== "text" && storyReplyContent?.[0]
      ? { storageId: storyReplyContent[0] }
      : "skip"
  );

  const linkPreviews = useQuery(
    api.linkPreviews.getMessageLinkPreviews,
    type === "text" && messageId ? { messageId } : "skip"
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

  // Swipe handlers for mobile reply
  const swipeHandlers = useSwipeable({
    onSwiping: (eventData) => {
      // Only allow swipe right for reply
      if (eventData.dir === "Right" && onReply) {
        const offset = Math.min(eventData.deltaX * 0.5, 80);
        setSwipeOffset(offset);
      }
    },
    onSwiped: (eventData) => {
      if (eventData.dir === "Right" && swipeOffset > 40 && onReply) {
        // Trigger reply if swiped more than 40px
        onReply(messageId);
      }
      // Reset swipe offset
      setSwipeOffset(0);
    },
    trackMouse: false,
    trackTouch: true,
  });

  // Long press handlers for mobile options menu
  const handleTouchStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      setShowMobileActions(true);
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Cleanup long press timer
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      {...swipeHandlers}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={cn(
        "flex items-end gap-2 transition-all duration-300 transform relative",
        {
          "justify-end": fromCurrentUser,
          "opacity-0 translate-y-4": !isVisible,
          "opacity-100 translate-y-0": isVisible
        }
      )}
      style={{
        transform: `translateX(${swipeOffset}px)`,
      }}
    >
      {/* Swipe indicator for reply */}
      {swipeOffset > 0 && onReply && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-0 opacity-50">
          <Reply className="h-6 w-6 text-primary" />
        </div>
      )}
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
            <div className="space-y-2">
              {/* Story Reply preview */}
              {storyReplyId && storyReplyType && storyReplyContent && (
                <div className="border-l-2 border-purple-500/50 pl-2 py-1 bg-purple-500/10 rounded">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs font-semibold opacity-80 flex items-center gap-1">
                      <span className="text-purple-500">📖</span>
                      Replied to story
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {/* Story preview thumbnail */}
                    {storyReplyType === "text" ? (
                      <div
                        className="w-12 h-12 rounded flex items-center justify-center text-[8px] p-1 flex-shrink-0"
                        style={{
                          backgroundColor: storyReplyContent[1] || "#000",
                          color: storyReplyContent[2] || "#fff"
                        }}
                      >
                        <span className="line-clamp-3 text-center">
                          {storyReplyContent[0]}
                        </span>
                      </div>
                    ) : storyReplyType === "image" && storyFileUrl ? (
                      <img
                        src={storyFileUrl}
                        alt="Story"
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                      />
                    ) : storyReplyType === "video" && storyFileUrl ? (
                      <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                        <video
                          src={storyFileUrl}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <span className="text-white text-xs">▶</span>
                        </div>
                      </div>
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] opacity-60 uppercase tracking-wide">
                        {storyReplyType} story
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Reply preview */}
              {replyToMessage && (
                <div className="border-l-2 border-primary/50 pl-2 py-1 bg-background/20 rounded">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Reply className="h-3 w-3 opacity-60" />
                    <span className="text-xs font-semibold opacity-80">
                      {replyToMessage.senderName}
                    </span>
                  </div>
                  <p className="text-xs opacity-70 line-clamp-2">
                    {replyToMessage.content[0]}
                  </p>
                </div>
              )}

              <div className="text-wrap break-words leading-relaxed">
                <MarkdownRenderer content={content[0]} />
              </div>

              {/* Link previews */}
              {linkPreviews && linkPreviews.length > 0 && (
                <div className="space-y-2 mt-2">
                  {linkPreviews.map((preview, index) => (
                    <a
                      key={index}
                      href={preview.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block border border-border/50 rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
                    >
                      {preview.image && (
                        <img
                          src={preview.image}
                          alt={preview.title || "Link preview"}
                          className="w-full h-32 object-cover"
                        />
                      )}
                      <div className="p-3 bg-background/30">
                        {preview.title && (
                          <p className="font-semibold text-sm line-clamp-1 mb-1">
                            {preview.title}
                          </p>
                        )}
                        {preview.description && (
                          <p className="text-xs opacity-70 line-clamp-2 mb-1">
                            {preview.description}
                          </p>
                        )}
                        {preview.siteName && (
                          <p className="text-xs opacity-50">{preview.siteName}</p>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              )}
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
          <div className={cn(
            "absolute -top-3 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            "bg-background/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow-lg border border-border/50",
            {
              "right-2": fromCurrentUser,
              "left-2": !fromCurrentUser,
            }
          )}>
            {/* Translation Button for text messages */}
            {type === "text" && (
              <MessageTranslation messageText={content[0]} />
            )}

            {/* Message Actions Dropdown */}
            <MessageActions
              onDelete={handleDelete}
              onReact={() => setShowReactionPicker(true)}
              onReply={onReply ? () => onReply(messageId) : undefined}
              onForward={() => setShowForwardDialog(true)}
              fromCurrentUser={fromCurrentUser}
            />
          </div>

          {/* Reaction Picker positioned near message bubble */}
          {showReactionPicker && (
            <>
              {/* Backdrop to close on outside click */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowReactionPicker(false)}
              />

              {/* Emoji picker */}
              <div
                className={cn("absolute -top-14 z-50 bg-background border border-border rounded-lg shadow-lg p-2 w-64", {
                  "right-0": fromCurrentUser,
                  "left-0": !fromCurrentUser,
                })}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="grid grid-cols-6 gap-1">
                  {["👍", "❤️", "😂", "😮", "😢", "😡", "🔥", "👏", "🎉", "✨", "💯", "🙏"].map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-0 text-2xl hover:bg-accent hover:scale-110 transition-transform"
                      onClick={() => {
                        handleAddReaction(emoji);
                        setShowReactionPicker(false);
                      }}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
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

      {/* Forward Message Dialog */}
      <ForwardMessageDialog
        open={showForwardDialog}
        onOpenChange={setShowForwardDialog}
        messageId={messageId}
        messageType={type}
        messageContent={content}
      />

      {/* Mobile Actions Sheet - shown on long press */}
      {showMobileActions && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={() => setShowMobileActions(false)}
          />

          {/* Action Sheet */}
          <div className="fixed bottom-0 left-0 right-0 bg-background rounded-t-2xl z-50 p-4 space-y-2 md:hidden animate-slide-up">
            {onReply && (
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  onReply(messageId);
                  setShowMobileActions(false);
                }}
              >
                <Reply className="h-4 w-4 mr-2" />
                Reply
              </Button>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                setShowReactionPicker(true);
                setShowMobileActions(false);
              }}
            >
              <span className="mr-2">😊</span>
              Add Reaction
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                setShowForwardDialog(true);
                setShowMobileActions(false);
              }}
            >
              <Reply className="h-4 w-4 mr-2 rotate-180" />
              Forward
            </Button>
            {fromCurrentUser && (
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => {
                  handleDelete();
                  setShowMobileActions(false);
                }}
              >
                <span className="mr-2">🗑️</span>
                Delete
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowMobileActions(false)}
            >
              Cancel
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default Message;
