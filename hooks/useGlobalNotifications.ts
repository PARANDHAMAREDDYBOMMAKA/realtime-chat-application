import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNotifications } from "./useNotifications";
import { usePathname } from "next/navigation";

/**
 * Global notification hook that monitors ALL conversations for new messages
 * Works even when you're not on a specific conversation page
 */
export function useGlobalNotifications() {
  const { settings, playNotificationSound } = useNotifications();
  const pathname = usePathname();

  // Get all conversations the user is part of
  const conversations = useQuery(api.conversations.get);

  // Get current user info
  const currentUser = useQuery(api.user.getCurrent);

  // Extract current conversation ID from pathname
  const currentConversationId = pathname?.startsWith("/conversations/")
    ? pathname.split("/")[2]
    : null;

  // Track last message timestamps for each conversation
  const lastTimestampsRef = useRef<Record<string, number>>({});
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    console.log("🌍 Global notifications initialized");
    return () => {
      console.log("🌍 Global notifications cleanup");
    };
  }, []);

  useEffect(() => {
    if (!conversations || !settings || !currentUser) {
      console.log("⏭️ Global notifications: waiting for data", {
        hasConversations: !!conversations,
        conversationCount: conversations?.length,
        hasSettings: !!settings,
        hasCurrentUser: !!currentUser,
      });
      return;
    }

    console.log("🔄 Global notifications: checking", conversations.length, "conversations");

    // On first load, just initialize timestamps
    if (isInitialLoadRef.current) {
      console.log("📥 Global notifications: initial load - storing timestamps");
      conversations.forEach((conv) => {
        if (conv.lastMessage) {
          lastTimestampsRef.current[conv.conversation._id] = conv.lastMessage.timestamp;
          console.log("  - Conversation:", conv.conversation._id, "timestamp:", conv.lastMessage.timestamp);
        }
      });
      isInitialLoadRef.current = false;
      return;
    }

    // Check each conversation for new messages
    conversations.forEach((conv) => {
      const conversationId = conv.conversation._id;
      const lastMessage = conv.lastMessage;

      if (!lastMessage) return;

      // Check if conversation is muted
      const isMuted = settings.mutedConversations?.some((id) => id === conversationId);
      if (isMuted) {
        console.log("🔇 Conversation muted:", conversationId);
        return;
      }

      const previousTimestamp = lastTimestampsRef.current[conversationId] || 0;
      const currentTimestamp = lastMessage.timestamp;

      // If timestamp is newer, it's a new message
      if (currentTimestamp > previousTimestamp) {
        console.log("📨 New message detected!", {
          conversationId,
          previousTimestamp,
          currentTimestamp,
          from: lastMessage.sender,
          senderId: (lastMessage as any).senderId,
          type: lastMessage.type,
          isGroup: conv.conversation.isGroup,
        });

        // Update timestamp
        lastTimestampsRef.current[conversationId] = currentTimestamp;

        // Check if message is from current user (don't notify for own messages)
        const isOwnMessage = (lastMessage as any).senderId &&
          currentUser._id &&
          (lastMessage as any).senderId === currentUser._id;

        // Check if user is viewing this conversation (don't play sound if actively viewing)
        const isViewingConversation = currentConversationId === conversationId;

        if (isOwnMessage) {
          console.log("⏭️ Skipping notification - message from current user");
          return;
        }

        if (isViewingConversation) {
          console.log("⏭️ Skipping notification - user is viewing this conversation");
          return;
        }

        const senderName = lastMessage.sender || "Someone";
        const conversationName = conv.conversation.isGroup
          ? conv.conversation.name || "Group Chat"
          : conv.otherMember?.username || senderName;

        const messagePreview = lastMessage.content;

        // Always play sound if enabled (and not from self or current conversation)
        if (settings.soundEnabled) {
          console.log("🔊 Playing notification sound...");
          playNotificationSound();
        } else {
          console.log("🔇 Sound disabled in settings");
        }

        // Check if app is in background (tab hidden OR window not focused)
        const isAppInBackground = document.hidden || !document.hasFocus();

        console.log("📱 App state:", {
          isHidden: document.hidden,
          hasFocus: document.hasFocus(),
          isAppInBackground,
          pushEnabled: settings.pushEnabled,
        });

        // Show browser notification if in background and push is enabled
        if (isAppInBackground && settings.pushEnabled) {
          console.log("🔔 Showing browser notification...");
          if ("Notification" in window && Notification.permission === "granted") {
            try {
              const notificationBody = conv.conversation.isGroup
                ? `${senderName}: ${messagePreview}`
                : messagePreview;

              const notification = new Notification(conversationName, {
                body: notificationBody,
                icon: "/icon-192x192.png",
                badge: "/icon-192x192.png",
                tag: conversationId,
                requireInteraction: false,
                silent: true,
              });

              // Click notification to open conversation
              notification.onclick = () => {
                window.focus();
                window.location.href = `/conversations/${conversationId}`;
                notification.close();
              };

              console.log("✅ Notification created successfully");
            } catch (error) {
              console.error("❌ Error creating notification:", error);
            }
          } else {
            console.log("❌ Cannot show notification:", {
              hasNotificationAPI: "Notification" in window,
              permission: "Notification" in window ? Notification.permission : "N/A"
            });
          }
        } else {
          console.log("ℹ️ Not showing notification:", {
            reason: !isAppInBackground
              ? "App is in foreground"
              : "Push notifications disabled",
            isAppInBackground,
            pushEnabled: settings.pushEnabled,
          });
        }
      }
    });
  }, [conversations, settings, playNotificationSound, currentUser, currentConversationId]);
}
