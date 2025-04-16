import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { getUserByClerjId } from "./_utils";

export const remove = mutation({
    args: {
        conversationId: v.id("conversations"),
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

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) throw new ConvexError("Conversation not found");

        const membership = await ctx.db.query("conversationMembers").withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId)).collect()
        if (!membership || membership.length !== 2) throw new ConvexError("Membership not found");

        const friendships = await ctx.db.query("friends").withIndex("by_conversationId", q => { return q.eq("conversationId", args.conversationId) }).unique();

        if (!friendships) {
            throw new ConvexError("Friendship not found");
        }

        const messages = await ctx.db.query("messages").withIndex("by_conversationId", q => { return q.eq("conversationId", args.conversationId) }).collect();
        await ctx.db.delete(args.conversationId)

        await ctx.db.delete(friendships._id)

        await Promise.all(membership.map(async memberships => {
            await ctx.db.delete(memberships._id)
        }))
        await Promise.all(messages.map(async message => {
            await ctx.db.delete(message._id)
        }))
    }
})