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
}

const formatDateSeparator = (timestamp: number): string => {
  const date = new Date(timestamp);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM dd, yyyy");
};

export default function Body({ conversationId }: BodyProps) {
  const messages = useQuery(api.messages.get,
    conversationId ? { id: conversationId } : "skip"
  );
  const updateLastSeenMessage = useMutation(api.conversation.updateLastSeenMessage);
  const { user } = useUser();
  const conversation = useQuery(api.conversation.get,
    conversationId ? { id: conversationId } : "skip"
  );

  React.useEffect(() => {
    if (messages && messages.length > 0 && conversationId && user) {
      // Mark the latest message as seen
      updateLastSeenMessage({
        conversationId: conversationId as Id<"conversations">,
        messageId: messages[0].message._id,
      });
    }
  }, [messages, conversationId, user, updateLastSeenMessage]);

  // Get the lastSeenMessageId from the other user (for 1:1)
  const lastSeenMessageId = conversation?.otherMember?.lastSeenMessageId;

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

          // Seen logic: only for messages from current user
          // Messages are sorted newest first (desc), so higher index = older messages
          // If they've seen message at index X, they've also seen all indices > X
          const lastSeenIndex = lastSeenMessageId
            ? messages.findIndex(m => m.message._id === lastSeenMessageId)
            : -1;
          const seen = isCurrentUser && lastSeenIndex !== -1 && index >= lastSeenIndex;

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
                fromCurrentUser={isCurrentUser}
                senderImage={senderImage}
                senderName={capitalizeName(senderName)}
                lastByUser={lastByUser}
                content={message.content}
                createdAt={message._creationTime}
                type={message.type}
                seen={seen}
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
