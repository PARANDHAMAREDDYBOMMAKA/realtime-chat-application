import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useNotifications } from "./useNotifications";

export function useMessageNotifications(conversationId: Id<"conversations">) {
  const messages = useQuery(api.messages.get, conversationId ? { id: conversationId } : "skip");
  const conversation = useQuery(api.conversation.get, conversationId ? { id: conversationId } : "skip");
  const { settings, playNotificationSound } = useNotifications();
  const previousMessageCountRef = useRef<number>(0);
  const isInitialLoadRef = useRef(true);
  const notifiedMessagesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!messages || !conversation || !settings) return;

    // Check if conversation is muted
    const isMuted = settings.mutedConversations?.includes(conversationId);
    if (isMuted) return;

    // On initial load, just store the count without notifying
    if (isInitialLoadRef.current) {
      previousMessageCountRef.current = messages.length;
      // Mark all existing messages as already notified
      messages.forEach(msg => {
        notifiedMessagesRef.current.add(msg.message._id);
      });
      isInitialLoadRef.current = false;
      return;
    }

    // Check if there are new messages
    if (messages.length > previousMessageCountRef.current) {
      const newMessages = messages.slice(0, messages.length - previousMessageCountRef.current);

      // Only notify for messages from other users that we haven't notified about yet
      newMessages.forEach((msg) => {
        if (!msg.isCurrentUser && !notifiedMessagesRef.current.has(msg.message._id)) {
          // Mark this message as notified
          notifiedMessagesRef.current.add(msg.message._id);

          // Only play sound if enabled (don't show browser notifications)
          if (settings.soundEnabled && !document.hidden) {
            playNotificationSound();
          }
        }
      });

      previousMessageCountRef.current = messages.length;
    }
  }, [messages, conversation, conversationId, settings, playNotificationSound]);

  // Reset when conversation changes
  useEffect(() => {
    isInitialLoadRef.current = true;
    previousMessageCountRef.current = 0;
  }, [conversationId]);
}
