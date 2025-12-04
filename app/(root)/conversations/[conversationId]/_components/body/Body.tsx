"use client";

import { useQuery, useMutation } from "convex/react";
import React from "react";
import Message from "./Message";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import TypingIndicator from "../TypingIndicator";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { capitalizeName } from "@/lib/utils";
import { useScreenshotDetection } from "@/hooks/useScreenshotDetection";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: number;
  type: string;
  senderImage: string;
  senderName: string;
  isCurrentUser: boolean;
  lastByUser: boolean;
  seen: boolean;
}

interface BodyProps {
  initialMessages?: Message[];
  conversationId: Id<"conversations">;
  onReply?: (messageId: Id<"messages">) => void;
}

const formatDateSeparator = (timestamp: number): string => {
  const date = new Date(timestamp);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM dd, yyyy");
};

export default function Body({ conversationId, onReply }: BodyProps) {
  const messages = useQuery(api.messages.get,
    conversationId ? { id: conversationId } : "skip"
  );
  const updateLastSeenMessage = useMutation(api.conversation.updateLastSeenMessage);
  const recordScreenshot = useMutation(api.screenshots.recordScreenshot);
  const { user } = useUser();
  const { toast } = useToast();
  const conversation = useQuery(api.conversation.get,
    conversationId ? { id: conversationId } : "skip"
  );

  // Screenshot detection
  useScreenshotDetection({
    enabled: !!conversationId && !!user,
    onScreenshotDetected: async () => {
      console.log("🔔 Screenshot detected! Recording...");
      if (!conversationId) {
        console.log("❌ No conversation ID");
        return;
      }

      try {
        const result = await recordScreenshot({ conversationId });
        console.log("✅ Screenshot recorded:", result);
        toast({
          title: "Screenshot detected",
          description: "Other participants have been notified",
        });
      } catch (error) {
        console.error("❌ Error recording screenshot:", error);
        toast({
          title: "Screenshot detection failed",
          description: error instanceof Error ? error.message : "Could not record screenshot",
          variant: "destructive",
        });
      }
    },
  });

  React.useEffect(() => {
    if (messages && messages.length > 0 && conversationId && user) {
      // Mark the latest message as seen
      updateLastSeenMessage({
        conversationId: conversationId as Id<"conversations">,
        messageId: messages[0].message._id,
      });
    }
  }, [messages, conversationId, user, updateLastSeenMessage]);

  // Get the lastSeenMessageId from the other user (for 1:1 only)
  // Don't show read receipts for group conversations
  const lastSeenMessageId = !conversation?.isGroup
    ? conversation?.otherMember?.lastSeenMessageId
    : undefined;

  if (!conversationId) {
    return null;
  }

  return (
    <div className="flex-1 w-full flex overflow-y-scroll flex-col-reverse gap-2 p-3 no-scrollbar">
      <TypingIndicator conversationId={conversationId} />
      {messages?.map(
        ({ message, senderImage, senderName, isCurrentUser }, index) => {
          const lastByUser =
            messages[index - 1]?.message.senderId ===
            messages[index].message.senderId;

          // Seen logic: only for messages from current user in 1:1 conversations
          // Don't show read receipts for group conversations (pass undefined to hide completely)
          // Messages are sorted newest first (desc), so higher index = older messages
          // If they've seen message at index X, they've also seen all indices > X
          const lastSeenIndex = lastSeenMessageId
            ? messages.findIndex(m => m.message._id === lastSeenMessageId)
            : -1;

          // For group chats, return undefined to completely hide read receipts
          // For 1:1 chats, return boolean to show single/double check
          const seen = conversation?.isGroup
            ? undefined
            : (isCurrentUser && lastSeenIndex !== -1 && index >= lastSeenIndex);

          // Check if we need to show a date separator
          const currentDate = new Date(message.createdAt || message._creationTime);
          const nextMessage = messages[index + 1];
          const nextDate = nextMessage
            ? new Date(nextMessage.message.createdAt || nextMessage.message._creationTime)
            : null;
          const showDateSeparator = !nextDate || !isSameDay(currentDate, nextDate);

          return (
            <React.Fragment key={message._id}>
              <Message
                messageId={message._id}
                fromCurrentUser={isCurrentUser}
                senderImage={senderImage}
                senderName={capitalizeName(senderName)}
                lastByUser={lastByUser}
                content={message.content}
                createdAt={message._creationTime}
                type={message.type}
                seen={seen}
                replyTo={message.replyTo}
                storyReplyId={message.storyReplyId}
                storyReplyType={message.storyReplyType}
                storyReplyContent={message.storyReplyContent}
                onReply={onReply}
              />
              {showDateSeparator && (
                <div className="flex items-center justify-center my-4">
                  <div className="bg-muted/80 backdrop-blur-sm text-muted-foreground text-xs px-3 py-1 rounded-full shadow-sm border border-border/50">
                    {formatDateSeparator(message.createdAt || message._creationTime)}
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        }
      )}
    </div>
  );
}
