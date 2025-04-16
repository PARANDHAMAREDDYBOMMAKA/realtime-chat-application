import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserByClerjId } from "./_utils";

export const get = query({
    args: {},
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

        const friendships1 = await ctx.db
            .query("friends")
            .withIndex("by_user1", q => q.eq("user1", currentUser._id))
            .collect();

        const friendships2 = await ctx.db
            .query("friends")
            .withIndex("by_user2", q => q.eq("user2", currentUser._id))
            .collect();

        const friendships = [...friendships1, ...friendships2];

        const friends = await Promise.all(friendships.map(async friendship => {
            const friendId = friendship.user1 === currentUser._id
                ? friendship.user2
                : friendship.user1;

            const friend = await ctx.db.get(friendId);

            if (!friend) {
                throw new ConvexError("Friend not found");
            }

            return {
                _id: friend._id,
                username: friend.username,
                imageUrl: friend.imageUrl,
            };
        }));

        return friends;
    },
});


