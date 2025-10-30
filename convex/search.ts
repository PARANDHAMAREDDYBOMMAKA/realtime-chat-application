import { ConvexError, v } from "convex/values";
import { getUserByClerjId } from "./_utils";
import { query } from "./_generated/server";

// Search messages across all conversations
export const searchMessages = query({
    args: {
        query: v.string(),
        conversationId: v.optional(v.id("conversations")),
    },
    handler: async (ctx, args) => {
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

        // Get all conversations the user is part of
        const userConversations = await ctx.db
            .query("conversationMembers")
            .withIndex("by_memberId", (q) => q.eq("memberId", currentUser._id))
            .collect();

        const conversationIds = userConversations.map((cm) => cm.conversationId);

        // If a specific conversation is provided, filter to that one
        const targetConversations = args.conversationId
            ? conversationIds.filter((id) => id === args.conversationId)
            : conversationIds;

        if (targetConversations.length === 0) {
            return [];
        }

        // Search for messages in those conversations
        const allMessages = await ctx.db.query("messages").collect();

        const searchQuery = args.query.toLowerCase();

        // Filter messages by conversation and search query
        const matchingMessages = allMessages.filter((message) => {
            if (!targetConversations.includes(message.conversationId)) {
                return false;
            }

            // Only search text messages
            if (message.type !== "text") {
                return false;
            }

            // Check if any content matches
            return message.content.some((content) =>
                content.toLowerCase().includes(searchQuery)
            );
        });

        // Sort by most recent first
        matchingMessages.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        // Limit to 50 results
        const limitedMessages = matchingMessages.slice(0, 50);

        // Get message details with sender info
        const messagesWithDetails = await Promise.all(
            limitedMessages.map(async (message) => {
                const sender = await ctx.db.get(message.senderId);
                const conversation = await ctx.db.get(message.conversationId);

                if (!sender || !conversation) {
                    return null;
                }

                // Get conversation name
                let conversationName = conversation.name || "";
                if (!conversation.isGroup) {
                    // For DM, get the other user's name
                    const members = await ctx.db
                        .query("conversationMembers")
                        .withIndex("by_conversationId", (q) =>
                            q.eq("conversationId", conversation._id)
                        )
                        .collect();

                    const otherMember = members.find(
                        (m) => m.memberId !== currentUser._id
                    );
                    if (otherMember) {
                        const otherUser = await ctx.db.get(otherMember.memberId);
                        if (otherUser) {
                            conversationName = otherUser.username;
                        }
                    }
                }

                return {
                    messageId: message._id,
                    conversationId: message.conversationId,
                    conversationName,
                    isGroup: conversation.isGroup,
                    content: message.content[0],
                    senderId: sender._id,
                    senderName: sender.username,
                    senderImage: sender.imageUrl,
                    createdAt: message.createdAt || 0,
                    isCurrentUser: sender._id === currentUser._id,
                };
            })
        );

        return messagesWithDetails.filter((m) => m !== null);
    },
});
