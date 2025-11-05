import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserByClerjId } from "./_utils";

/**
 * Store user's public key
 */
export const storePublicKey = mutation({
    args: {
        publicKey: v.string(),
        fingerprint: v.string(),
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

        // Update user with public key
        await ctx.db.patch(currentUser._id, {
            publicKey: args.publicKey,
            keyFingerprint: args.fingerprint,
        });

        return { success: true };
    },
});

/**
 * Get public key for a specific user
 */
export const getPublicKey = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("Unauthorized");
        }

        const user = await ctx.db.get(args.userId);
        if (!user) {
            throw new ConvexError("User not found");
        }

        return {
            publicKey: user.publicKey || null,
            fingerprint: user.keyFingerprint || null,
            userId: user._id,
            username: user.username,
        };
    },
});

/**
 * Get public keys for all members of a conversation
 */
export const getConversationMemberKeys = query({
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

        // Verify user is a member of this conversation
        const membership = await ctx.db
            .query("conversationMembers")
            .withIndex("by_memberId_conversationId", (q) =>
                q.eq("memberId", currentUser._id).eq("conversationId", args.conversationId)
            )
            .first();

        if (!membership) {
            throw new ConvexError("Not a member of this conversation");
        }

        // Get all members of the conversation
        const members = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversationId", (q) =>
                q.eq("conversationId", args.conversationId)
            )
            .collect();

        // Get public keys for all members
        const memberKeys = await Promise.all(
            members.map(async (member) => {
                const user = await ctx.db.get(member.memberId);
                if (!user) return null;

                return {
                    userId: user._id,
                    username: user.username,
                    publicKey: user.publicKey || null,
                    fingerprint: user.keyFingerprint || null,
                };
            })
        );

        return memberKeys.filter((key) => key !== null);
    },
});

/**
 * Check if user has encryption keys set up
 */
export const hasEncryptionEnabled = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return false;
        }

        const currentUser = await getUserByClerjId({
            ctx,
            clerkId: identity.subject,
        });

        if (!currentUser) {
            return false;
        }

        return !!(currentUser.publicKey && currentUser.keyFingerprint);
    },
});
