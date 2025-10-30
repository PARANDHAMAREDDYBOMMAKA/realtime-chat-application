import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserByClerjId } from "./_utils";

export const addReaction = mutation({
    args: {
        messageId: v.id("messages"),
        emoji: v.string(),
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

        // Check if message exists
        const message = await ctx.db.get(args.messageId);
        if (!message) {
            throw new ConvexError("Message not found");
        }

        // Verify user is a member of the conversation
        const membership = await ctx.db
            .query("conversationMembers")
            .withIndex("by_memberId_conversationId", (q) =>
                q.eq("memberId", currentUser._id).eq("conversationId", message.conversationId)
            )
            .unique();

        if (!membership) {
            throw new ConvexError("You are not a member of this conversation");
        }

        // Check if user already reacted with this emoji
        const existingReaction = await ctx.db
            .query("reactions")
            .withIndex("by_message_user", (q) =>
                q.eq("messageId", args.messageId).eq("userId", currentUser._id)
            )
            .filter((q) => q.eq(q.field("emoji"), args.emoji))
            .unique();

        if (existingReaction) {
            // Remove reaction if it already exists (toggle behavior)
            await ctx.db.delete(existingReaction._id);
            return { action: "removed" };
        }

        // Add new reaction
        const reactionId = await ctx.db.insert("reactions", {
            messageId: args.messageId,
            userId: currentUser._id,
            emoji: args.emoji,
            createdAt: Date.now(),
        });

        return { action: "added", reactionId };
    },
});

export const removeReaction = mutation({
    args: {
        reactionId: v.id("reactions"),
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

        // Get reaction to verify ownership
        const reaction = await ctx.db.get(args.reactionId);
        if (!reaction) {
            throw new ConvexError("Reaction not found");
        }

        // Verify user owns this reaction
        if (reaction.userId !== currentUser._id) {
            throw new ConvexError("You can only remove your own reactions");
        }

        await ctx.db.delete(args.reactionId);

        return { success: true };
    },
});

export const getMessageReactions = query({
    args: {
        messageId: v.id("messages"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const currentUser = await getUserByClerjId({
            ctx,
            clerkId: identity.subject,
        });

        if (!currentUser) {
            return [];
        }

        // Get all reactions for this message
        const reactions = await ctx.db
            .query("reactions")
            .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
            .collect();

        // Group reactions by emoji with user details
        const reactionMap: { [emoji: string]: { count: number; users: any[]; userReacted: boolean } } = {};

        for (const reaction of reactions) {
            const user = await ctx.db.get(reaction.userId);

            if (!reactionMap[reaction.emoji]) {
                reactionMap[reaction.emoji] = {
                    count: 0,
                    users: [],
                    userReacted: false,
                };
            }

            reactionMap[reaction.emoji].count++;
            reactionMap[reaction.emoji].users.push({
                id: user?._id,
                name: user?.username,
                image: user?.imageUrl,
            });

            if (reaction.userId === currentUser._id) {
                reactionMap[reaction.emoji].userReacted = true;
            }
        }

        // Convert to array format
        return Object.entries(reactionMap).map(([emoji, data]) => ({
            emoji,
            count: data.count,
            users: data.users,
            userReacted: data.userReacted,
        }));
    },
});
