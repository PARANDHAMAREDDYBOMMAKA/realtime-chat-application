import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { getUserByClerjId } from "./_utils";

export const create = mutation({
    args: {
        conversationId: v.id("conversations"),
        type: v.string(),
        content: v.array(v.string())

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

        const membership = await ctx.db.query("conversationMembers").withIndex("by_memberId_conversationId", (q) => q.eq("memberId", currentUser._id).eq("conversationId", args.conversationId)).unique();

        if (!membership) {
            throw new ConvexError("User not found");
        }

        const message = await ctx.db.insert("messages", {
            senderId: currentUser._id,
            createdAt: Date.now(),
            ...args
        })
        await ctx.db.patch(args.conversationId, {
            lastMessageId: message
        })
        return message;
    }
})

export const deleteMessage = mutation({
    args: {
        messageId: v.id("messages"),
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

        // Get the message to verify ownership
        const message = await ctx.db.get(args.messageId);
        if (!message) {
            throw new ConvexError("Message not found");
        }

        // Verify the user is the sender
        if (message.senderId !== currentUser._id) {
            throw new ConvexError("You can only delete your own messages");
        }

        // Delete all reactions associated with this message
        const reactions = await ctx.db
            .query("reactions")
            .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
            .collect();

        for (const reaction of reactions) {
            await ctx.db.delete(reaction._id);
        }

        // Delete the message
        await ctx.db.delete(args.messageId);

        // Update conversation's lastMessageId if this was the last message
        const conversation = await ctx.db.get(message.conversationId);
        if (conversation?.lastMessageId === args.messageId) {
            // Find the most recent message in this conversation
            const latestMessage = await ctx.db
                .query("messages")
                .withIndex("by_conversationId", (q) => q.eq("conversationId", message.conversationId))
                .order("desc")
                .first();

            await ctx.db.patch(message.conversationId, {
                lastMessageId: latestMessage?._id,
            });
        }

        return { success: true };
    }
})