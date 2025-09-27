"use client";

import React from "react";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useConversation } from "@/hooks/useConversation";
import { api } from "@/convex/_generated/api";
import { useTyping } from "@/hooks/useTyping";
import { Button } from "@/components/ui/button";
import { SendHorizontal } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface ChatInputProps {
  conversationId: Id<"conversations">;
}

export default function ChatInput({ conversationId }: ChatInputProps) {
  const [message, setMessage] = React.useState("");
  const { user } = useUser();
  const createMessage = useMutation(api.message.create);
  const { startTyping, stopTyping } = useTyping({ conversationId });

  const handleTyping = () => {
    startTyping();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user?.id || !conversationId) return;

    try {
      const messageData = {
        conversationId,
        type: "text",
        content: [message],
      };

      // Create message in database
      await createMessage(messageData);

      // Clear input and stop typing
      setMessage("");
      stopTyping();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="flex items-center gap-2 p-4">
      <input
        type="text"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          handleTyping();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        placeholder="Type a message..."
        className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <Button
        onClick={handleSubmit}
        disabled={!message.trim()}
        className="p-2 rounded-full hover:bg-gray-100"
      >
        <SendHorizontal className="w-5 h-5" />
      </Button>
    </div>
  );
}
