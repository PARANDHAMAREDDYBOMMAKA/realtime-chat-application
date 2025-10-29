"use client";

import React, { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useConversation } from "@/hooks/useConversation";
import { api } from "@/convex/_generated/api";
import { useTyping } from "@/hooks/useTyping";
import { Button } from "@/components/ui/button";
import { SendHorizontal, Smile, Paperclip, Mic } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";

interface ChatInputProps {
  conversationId: Id<"conversations">;
}

export default function ChatInput({ conversationId }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useUser();
  const createMessage = useMutation(api.message.create);
  const { startTyping, stopTyping } = useTyping({ conversationId });

  const handleTyping = () => {
    startTyping();
    // Note: Don't show local typing indicator for the current user
    // The typing indicator should only be visible to other users
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

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  return (
    <div className="relative p-4 bg-gradient-to-t from-background/95 to-background/80 backdrop-blur-sm border-t border-border/30">

      {/* Input container */}
      <motion.div
        className={`relative flex items-end gap-3 p-3 rounded-2xl bg-gradient-to-r from-muted/50 to-muted/30 border transition-all duration-300 backdrop-blur-sm ${
          isFocused
            ? "border-primary/50 shadow-lg shadow-primary/10 bg-gradient-to-r from-primary/5 to-background/50"
            : "border-border/40 hover:border-border/60"
        }`}
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* Animated background */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0"
            animate={isFocused ? { opacity: [0, 0.5, 0] } : { opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        {/* Action buttons - left side */}
        <div className="flex items-center gap-1 relative z-10">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-all duration-200"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Type your message..."
            className="w-full resize-none bg-transparent border-0 outline-none placeholder:text-muted-foreground/60 text-foreground text-sm leading-relaxed min-h-[24px] max-h-[120px] py-1"
            rows={1}
            style={{ lineHeight: '1.5' }}
          />
        </div>

        {/* Action buttons - right side */}
        <div className="flex items-center gap-1 relative z-10">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-all duration-200"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-all duration-200"
            >
              <Mic className="h-4 w-4" />
            </Button>
          </motion.div>

          {/* Send button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Button
              onClick={handleSubmit}
              disabled={!message.trim()}
              size="icon"
              className={`h-9 w-9 rounded-full transition-all duration-300 shadow-sm ${
                message.trim()
                  ? "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-primary/20 hover:shadow-primary/30"
                  : "bg-muted/50 text-muted-foreground cursor-not-allowed hover:bg-muted/50"
              }`}
            >
              <motion.div
                animate={message.trim() ? { rotate: [0, 15, -15, 0] } : {}}
                transition={{ duration: 0.5 }}
              >
                <SendHorizontal className="h-4 w-4" />
              </motion.div>
            </Button>
          </motion.div>
        </div>

        {/* Input focus ring effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={isFocused ? {
            boxShadow: [
              "0 0 0 0px rgba(var(--primary-rgb, 59 130 246), 0.1)",
              "0 0 0 4px rgba(var(--primary-rgb, 59 130 246), 0.1)",
              "0 0 0 0px rgba(var(--primary-rgb, 59 130 246), 0.1)",
            ]
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>

      {/* Character count (optional) */}
      <AnimatePresence>
        {message.length > 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-1 right-16 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full border border-border/30"
          >
            {message.length}/500
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
