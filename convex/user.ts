import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";

export const create = internalMutation({
    args: {
        username: v.string(),
        imageUrl: v.string(),
        clerkId: v.string(),
        email: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("users", args)
    }
})

export const get = internalQuery({
    args: { clerkId: v.string() },
    async handler(ctx, args) {
        return ctx.db.query("users").withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId)).first();
    }
})

export const getByEmail = internalQuery({
    args: { email: v.string() },
    async handler(ctx, args) {
        return ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", args.email)).first();
    }
})

export const update = internalMutation({
    args: {
        clerkId: v.string(),
        username: v.string(),
        imageUrl: v.string(),
        email: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();

        if (user) {
            await ctx.db.patch(user._id, {
                username: args.username,
                imageUrl: args.imageUrl,
                email: args.email,
            });
        }
    }
})