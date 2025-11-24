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
        const searchQuery = args.query.toLowerCase();
        const matchingMessages: Array<{
            _id: any;
            senderId: any;
            conversationId: any;
            content: string[];
            createdAt?: number;
            type: string;
        }> = [];

        // Query messages for each conversation separately to avoid loading all messages
        for (const conversationId of targetConversations) {
            const messages = await ctx.db
                .query("messages")
                .withIndex("by_conversationId", (q) => q.eq("conversationId", conversationId))
                .filter((q) => q.eq(q.field("type"), "text"))
                .order("desc")
                .take(100); // Limit per conversation

            // Filter for matching content
            const filtered = messages.filter((message) =>
                message.content.some((content) =>
                    content.toLowerCase().includes(searchQuery)
                )
            );

            matchingMessages.push(...filtered);

            // Early exit if we have enough results
            if (matchingMessages.length >= 50) {
                break;
            }
        }

        // Sort by most recent first
        matchingMessages.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        // Limit to 50 results
        const limitedMessages = matchingMessages.slice(0, 50);

        // Build caches to avoid N+1 queries
        const senderIds = [...new Set(limitedMessages.map(m => m.senderId))];
        const conversationIdsSet = [...new Set(limitedMessages.map(m => m.conversationId))];

        const sendersData = await Promise.all(senderIds.map(id => ctx.db.get(id)));
        const conversationsData = await Promise.all(conversationIdsSet.map(id => ctx.db.get(id)));

        const senderMap = new Map(
            sendersData.filter((s): s is NonNullable<typeof s> => s !== null && '_id' in s && 'username' in s).map(s => [s._id, s])
        );
        const conversationMap = new Map(
            conversationsData.filter((c): c is NonNullable<typeof c> => c !== null && '_id' in c && 'isGroup' in c).map(c => [c._id, c])
        );

        // Get message details with sender info
        const messagesWithDetails = await Promise.all(
            limitedMessages.map(async (message) => {
                const sender = senderMap.get(message.senderId);
                const conversation = conversationMap.get(message.conversationId);

                // Type guard to ensure we have the right types
                if (!sender || !conversation ||
                    !('username' in sender) || !('imageUrl' in sender) ||
                    !('isGroup' in conversation)) {
                    return null;
                }

                // Get conversation name
                let conversationName = ('name' in conversation ? conversation.name : '') || "";
                if (!conversation.isGroup) {
                    // For DM, get the other user's name
                    const members = await ctx.db
                        .query("conversationMembers")
                        .withIndex("by_conversationId", (q) =>
                            q.eq("conversationId", conversation._id as any)
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
