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

  // Log when hook is mounted
  useEffect(() => {
    console.log("🔔 useMessageNotifications hook mounted for conversation:", conversationId);
    return () => {
      console.log("🔕 useMessageNotifications hook unmounted");
    };
  }, [conversationId]);

  useEffect(() => {
    console.log("🔄 useMessageNotifications effect running:", {
      hasMessages: !!messages,
      messageCount: messages?.length,
      hasConversation: !!conversation,
      hasSettings: !!settings,
      conversationId,
    });

    if (!messages || !conversation || !settings) {
      console.log("⏭️ Skipping - missing data:", {
        messages: !!messages,
        conversation: !!conversation,
        settings: !!settings
      });
      return;
    }

    // Check if conversation is muted
    const isMuted = settings.mutedConversations?.some((id) => id === conversationId);
    if (isMuted) {
      console.log("🔇 Conversation is muted");
      return;
    }

    // On initial load, just store the count without notifying
    if (isInitialLoadRef.current) {
      console.log("📥 Initial load - storing", messages.length, "messages");
      previousMessageCountRef.current = messages.length;
      // Mark all existing messages as already notified
      messages.forEach(msg => {
        notifiedMessagesRef.current.add(msg.message._id);
      });
      isInitialLoadRef.current = false;
      return;
    }

    console.log("📊 Message count check:", {
      current: messages.length,
      previous: previousMessageCountRef.current,
      hasNewMessages: messages.length > previousMessageCountRef.current,
    });

    // Check if there are new messages
    if (messages.length > previousMessageCountRef.current) {
      console.log("🆕 New messages detected!");

      const newMessages = messages.slice(0, messages.length - previousMessageCountRef.current);

      // Only notify for messages from other users that we haven't notified about yet
      newMessages.forEach((msg) => {
        if (!msg.isCurrentUser && !notifiedMessagesRef.current.has(msg.message._id)) {
          // Mark this message as notified
          notifiedMessagesRef.current.add(msg.message._id);

          const senderName = msg.senderName || "Someone";
          const messagePreview = msg.message.type === "text"
            ? msg.message.content.slice(0, 50) + (msg.message.content.length > 50 ? "..." : "")
            : msg.message.type === "image"
              ? "📷 Photo"
              : msg.message.type === "video"
                ? "🎥 Video"
                : "📎 Attachment";

          const conversationName = conversation.isGroup
            ? conversation.name || "Group Chat"
            : senderName;

          // Debug logging
          console.log("📨 New message received:", {
            from: senderName,
            soundEnabled: settings.soundEnabled,
            pushEnabled: settings.pushEnabled,
            permission: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'N/A',
            isHidden: document.hidden,
            hasFocus: document.hasFocus(),
          });

          // Always play sound if enabled
          if (settings.soundEnabled) {
            console.log("🔊 Playing notification sound...");
            playNotificationSound();
          }

          // Check if app is in background (tab hidden OR window not focused)
          const isAppInBackground = document.hidden || !document.hasFocus();

          // Show browser notification if in background and push is enabled
          if (isAppInBackground && settings.pushEnabled) {
            console.log("🔔 Showing browser notification...");
            if ("Notification" in window && Notification.permission === "granted") {
              const notification = new Notification(conversationName, {
                body: conversation.isGroup ? `${senderName}: ${messagePreview}` : messagePreview,
                icon: "/icon-192x192.png",
                badge: "/icon-192x192.png",
                tag: conversationId,
                requireInteraction: false,
                silent: true,
              });
              console.log("✅ Notification created:", notification);
            } else {
              console.log("❌ Cannot show notification:", {
                hasNotificationAPI: "Notification" in window,
                permission: "Notification" in window ? Notification.permission : "N/A"
              });
            }
          } else {
            console.log("ℹ️ Not showing notification - app is in foreground or push disabled");
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
