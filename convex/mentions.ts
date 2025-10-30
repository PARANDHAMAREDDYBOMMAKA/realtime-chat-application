import { ConvexError, v } from "convex/values";
import { getUserByClerjId } from "./_utils";
import { mutation, query } from "./_generated/server";

// Create a mention
export const create = mutation({
    args: {
        messageId: v.id("messages"),
        mentionedUserId: v.id("users"),
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

        // Check if mention already exists
        const existingMention = await ctx.db
            .query("mentions")
            .withIndex("by_message_user", (q) =>
                q.eq("messageId", args.messageId).eq("mentionedUserId", args.mentionedUserId)
            )
            .first();

        if (existingMention) {
            return existingMention._id;
        }

        // Create mention
        const mentionId = await ctx.db.insert("mentions", {
            messageId: args.messageId,
            userId: currentUser._id,
            mentionedUserId: args.mentionedUserId,
            createdAt: Date.now(),
        });

        return mentionId;
    },
});

// Get mentions for a user
export const getUserMentions = query({
    args: {
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

        // Get all mentions for this user
        const mentions = await ctx.db
            .query("mentions")
            .withIndex("by_mentionedUserId", (q) => q.eq("mentionedUserId", currentUser._id))
            .collect();

        // Get message details
        const mentionsWithDetails = await Promise.all(
            mentions.map(async (mention) => {
                const message = await ctx.db.get(mention.messageId);
                if (!message) return null;

                // Filter by conversation if specified
                if (args.conversationId && message.conversationId !== args.conversationId) {
                    return null;
                }

                const sender = await ctx.db.get(message.senderId);
                const conversation = await ctx.db.get(message.conversationId);

                if (!sender || !conversation) return null;

                return {
                    mentionId: mention._id,
                    messageId: message._id,
                    conversationId: message.conversationId,
                    content: message.content[0],
                    senderId: sender._id,
                    senderName: sender.username,
                    senderImage: sender.imageUrl,
                    createdAt: message.createdAt || 0,
                };
            })
        );

        return mentionsWithDetails.filter((m) => m !== null);
    },
});

// Get users that can be mentioned in a conversation
export const getMentionableUsers = query({
    args: {
        conversationId: v.id("conversations"),
        searchQuery: v.optional(v.string()),
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

        // Get all members of the conversation
        const members = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
            .collect();

        // Get user details
        const users = await Promise.all(
            members.map(async (member) => {
                const user = await ctx.db.get(member.memberId);
                if (!user || user._id === currentUser._id) return null; // Exclude current user

                // Filter by search query if provided
                if (
                    args.searchQuery &&
                    !user.username.toLowerCase().includes(args.searchQuery.toLowerCase())
                ) {
                    return null;
                }

                return {
                    id: user._id,
                    username: user.username,
                    imageUrl: user.imageUrl,
                };
            })
        );

        return users.filter((u) => u !== null);
    },
});
