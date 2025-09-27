"use client";

import { useQuery, useMutation } from "convex/react";
import React from "react";
import Message from "./Message";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

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

  // Get the lastSeenMessageId and isTyping from the other user (for 1:1)
  const lastSeenMessageId = conversation?.otherMember?.lastSeenMessageId;
  const isOtherTyping = !!conversation?.otherMember?.isTyping;

  if (!conversationId) {
    return null;
  }

  return (
    <div className="flex-1 w-full flex overflow-y-scroll flex-col-reverse gap-2 p-3 no-scrollbar">
      {isOtherTyping && (
        <div className="text-xs text-muted-foreground mb-2">Typing...</div>
      )}
      {messages?.map(
        ({ message, senderImage, senderName, isCurrentUser }, index) => {
          const lastByUser =
            messages[index - 1]?.message.senderId ===
            messages[index].message.senderId;
          // Seen logic: only for messages from current user
          const seen = isCurrentUser && lastSeenMessageId === message._id;
          return (
            <Message
              key={message._id}
              fromCurrentUser={isCurrentUser}
              senderImage={senderImage}
              senderName={senderName}
              lastByUser={lastByUser}
              content={message.content}
              createdAt={message._creationTime}
              type={message.type}
              seen={seen}
            />
          );
        }
      )}
    </div>
  );
}
