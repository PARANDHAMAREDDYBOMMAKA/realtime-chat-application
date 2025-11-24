import { ConvexError } from "convex/values";
import { getUserByClerjId } from "./_utils";
import { query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    const currentUser = await getUserByClerjId({
      ctx,
      clerkId: identity.subject,
    });

    if (!currentUser) {
      throw new ConvexError("User not found");
    }

    const conversationMemberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_memberId", (q) => q.eq("memberId", currentUser._id))
      .collect();

    if (!conversationMemberships || conversationMemberships.length === 0) {
      return [];
    }

    const conversations = await Promise.all(
      conversationMemberships?.map(async (membership) => {
        const conversation = await ctx.db.get(membership.conversationId);

        if (!conversation) {
          throw new ConvexError("Conversation not found");
        }
        return conversation;
      })
    );

    // Batch fetch all memberships for all conversations
    const allMembershipsPromises = conversations.map(conversation =>
      ctx.db
        .query("conversationMembers")
        .withIndex("by_conversationId", (q) => q.eq("conversationId", conversation._id))
        .collect()
    );
    const allMembershipsResults = await Promise.all(allMembershipsPromises);
    const membershipsMap = new Map(
      conversations.map((conv, idx) => [conv._id, allMembershipsResults[idx]])
    );

    // Batch fetch last messages
    const lastMessageIds = conversations
      .filter(c => c.lastMessageId)
      .map(c => c.lastMessageId!);
    const lastMessagesData = await Promise.all(
      lastMessageIds.map(id => ctx.db.get(id))
    );
    const lastMessagesMap = new Map(
      lastMessageIds.map((id, idx) => [id, lastMessagesData[idx]])
    );

    // Get all sender IDs for last messages
    const senderIds = lastMessagesData
      .filter(m => m !== null)
      .map(m => m!.senderId);
    const sendersData = await Promise.all(
      [...new Set(senderIds)].map(id => ctx.db.get(id))
    );
    const sendersMap = new Map(
      sendersData.filter(s => s !== null).map(s => [s!._id, s!])
    );

    // Get all other member IDs for DM conversations
    const otherMemberIds = conversations
      .filter(c => !c.isGroup)
      .map(c => {
        const members = membershipsMap.get(c._id) || [];
        const otherMembership = members.find(m => m.memberId !== currentUser._id);
        return otherMembership?.memberId;
      })
      .filter(id => id !== undefined);
    const otherMembersData = await Promise.all(
      otherMemberIds.map(id => ctx.db.get(id!))
    );
    const otherMembersMap = new Map(
      otherMembersData.filter(m => m !== null).map(m => [m!._id, m!])
    );

    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conversation) => {
        const allConversationMemberships = membershipsMap.get(conversation._id) || [];

        // Get last message details from cache
        let lastMessage = null;
        if (conversation.lastMessageId) {
          const message = lastMessagesMap.get(conversation.lastMessageId);
          if (message) {
            const sender = sendersMap.get(message.senderId);
            if (sender) {
              const content = getMessageContent(
                message.type,
                message.content as unknown as string
              );
              lastMessage = {
                content,
                sender: sender.username,
                senderId: message.senderId,
                timestamp: message.createdAt ?? message._creationTime,
                type: message.type,
              };
            }
          }
        }

        const currentUserMembership = conversationMemberships.find(
          (m) => m.conversationId === conversation._id
        );

        let unreadCount = 0;
        if (currentUserMembership && conversation.lastMessageId) {
          const lastSeenMessageId = currentUserMembership.lastSeenMessage;

          if (!lastSeenMessageId) {
            // Count all messages from others - limit to recent for performance
            const allMessages = await ctx.db
              .query("messages")
              .withIndex("by_conversationId", (q) =>
                q.eq("conversationId", conversation._id)
              )
              .filter((q) => q.neq(q.field("senderId"), currentUser._id))
              .collect();
            unreadCount = allMessages.length;
          } else {
            const lastSeenMessage = await ctx.db.get(lastSeenMessageId);
            if (lastSeenMessage) {
              const lastSeenTime = lastSeenMessage.createdAt ?? lastSeenMessage._creationTime;
              const unreadMessages = await ctx.db
                .query("messages")
                .withIndex("by_conversationId", (q) =>
                  q.eq("conversationId", conversation._id)
                )
                .filter((q) =>
                  q.and(
                    q.gt(q.field("createdAt"), lastSeenTime),
                    q.neq(q.field("senderId"), currentUser._id)
                  )
                )
                .collect();
              unreadCount = unreadMessages.length;
            }
          }
        }

        if (conversation.isGroup) {
          return { conversation, lastMessage, unreadCount };
        } else {
          const otherMembership = allConversationMemberships.find(
            (membership) => membership.memberId !== currentUser._id
          );

          const otherMember = otherMembership ? otherMembersMap.get(otherMembership.memberId) : undefined;

          let userStatus: "online" | "offline" | "away" = "offline";
          if (otherMember) {
            const now = Date.now();
            const lastSeen = otherMember.lastSeen || 0;
            const timeDiff = now - lastSeen;

            if (timeDiff <= 5 * 60 * 1000) {
              userStatus = otherMember.status || "offline";
            } else if (timeDiff <= 10 * 60 * 1000) {
              userStatus = "away";
            }
          }

          return {
            conversation,
            otherMember,
            lastMessage,
            userStatus,
            unreadCount,
          };
        }
      })
    );

    const sortedConversations = conversationsWithDetails.sort((a, b) => {
      const timeA = a.lastMessage?.timestamp ?? 0;
      const timeB = b.lastMessage?.timestamp ?? 0;
      return timeB - timeA;
    });

    return sortedConversations;
  },
});

const getMessageContent = (type: string, content: string | string[]) => {
  switch (type) {
    case "text":
      return typeof content === "string" ? content : content[0] || "";
    case "image":
      return "Photo";
    case "video":
      return "Video";
    case "audio":
      return "Audio";
    case "file":
      // Try to get filename if content is an array
      if (Array.isArray(content) && content[1]) {
        return content[1];
      }
      return "File";
    default:
      return "[Non-text]";
  }
};
