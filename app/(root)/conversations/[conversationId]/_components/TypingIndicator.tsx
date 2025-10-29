"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { capitalizeName } from "@/lib/utils";

interface TypingIndicatorProps {
  conversationId: Id<"conversations">;
}

export default function TypingIndicator({ conversationId }: TypingIndicatorProps) {
  const typingUsers = useQuery(api.conversation.getTypingUsers, { conversationId });

  // The getTypingUsers query already filters out the current user server-side
  if (!typingUsers || typingUsers.length === 0) {
    return null;
  }

  const getTypingMessage = () => {
    if (typingUsers.length === 1) {
      return `${capitalizeName(typingUsers[0]?.username)} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${capitalizeName(typingUsers[0]?.username)} and ${capitalizeName(typingUsers[1]?.username)} are typing...`;
    } else {
      return `${capitalizeName(typingUsers[0]?.username)} and ${typingUsers.length - 1} others are typing...`;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="px-4 py-2 flex items-center gap-3"
      >
        {/* Typing animation */}
        <div className="flex items-center gap-1">
          <motion.div
            className="w-2 h-2 bg-primary rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 0,
            }}
          />
          <motion.div
            className="w-2 h-2 bg-primary rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 0.2,
            }}
          />
          <motion.div
            className="w-2 h-2 bg-primary rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 0.4,
            }}
          />
        </div>

        {/* Typing message */}
        <motion.span
          className="text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {getTypingMessage()}
        </motion.span>
      </motion.div>
    </AnimatePresence>
  );
}