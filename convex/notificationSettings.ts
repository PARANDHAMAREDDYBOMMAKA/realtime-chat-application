import { ConvexError, v } from "convex/values";
import { getUserByClerjId } from "./_utils";
import { mutation, query } from "./_generated/server";

// Get or create notification settings for a user
export const getSettings = query({
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

        const settings = await ctx.db
            .query("notificationSettings")
            .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
            .first();

        // Return default settings if none exist
        if (!settings) {
            return {
                userId: currentUser._id,
                pushEnabled: true,
                soundEnabled: true,
                customSound: "default" as string,
                mutedConversations: [] as Array<typeof currentUser._id>,
            };
        }

        return settings;
    },
});

// Initialize notification settings for a user
export const initializeSettings = mutation({
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

        // Check if settings already exist
        const existing = await ctx.db
            .query("notificationSettings")
            .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
            .first();

        if (existing) {
            return existing._id;
        }

        // Create default settings
        const settingsId = await ctx.db.insert("notificationSettings", {
            userId: currentUser._id,
            pushEnabled: true,
            soundEnabled: true,
            customSound: "default",
            mutedConversations: [],
        });

        return settingsId;
    },
});

// Update push notification setting
export const updatePushEnabled = mutation({
    args: {
        enabled: v.boolean(),
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

        const settings = await ctx.db
            .query("notificationSettings")
            .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
            .first();

        if (!settings) {
            // Create new settings
            return await ctx.db.insert("notificationSettings", {
                userId: currentUser._id,
                pushEnabled: args.enabled,
                soundEnabled: true,
                customSound: "default",
                mutedConversations: [],
            });
        }

        await ctx.db.patch(settings._id, {
            pushEnabled: args.enabled,
        });

        return settings._id;
    },
});

// Update sound setting
export const updateSoundEnabled = mutation({
    args: {
        enabled: v.boolean(),
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

        const settings = await ctx.db
            .query("notificationSettings")
            .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
            .first();

        if (!settings) {
            return await ctx.db.insert("notificationSettings", {
                userId: currentUser._id,
                pushEnabled: true,
                soundEnabled: args.enabled,
                customSound: "default",
                mutedConversations: [],
            });
        }

        await ctx.db.patch(settings._id, {
            soundEnabled: args.enabled,
        });

        return settings._id;
    },
});

// Update custom sound
export const updateCustomSound = mutation({
    args: {
        sound: v.string(),
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

        const settings = await ctx.db
            .query("notificationSettings")
            .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
            .first();

        if (!settings) {
            return await ctx.db.insert("notificationSettings", {
                userId: currentUser._id,
                pushEnabled: true,
                soundEnabled: true,
                customSound: args.sound,
                mutedConversations: [],
            });
        }

        await ctx.db.patch(settings._id, {
            customSound: args.sound,
        });

        return settings._id;
    },
});

// Mute/unmute a conversation
export const toggleMuteConversation = mutation({
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

        const settings = await ctx.db
            .query("notificationSettings")
            .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
            .first();

        if (!settings) {
            // Create settings with this conversation muted
            return await ctx.db.insert("notificationSettings", {
                userId: currentUser._id,
                pushEnabled: true,
                soundEnabled: true,
                customSound: "default",
                mutedConversations: [args.conversationId],
            });
        }

        // Toggle mute status
        const mutedConversations = settings.mutedConversations || [];
        const isMuted = mutedConversations.includes(args.conversationId);

        if (isMuted) {
            // Unmute
            await ctx.db.patch(settings._id, {
                mutedConversations: mutedConversations.filter(
                    (id) => id !== args.conversationId
                ),
            });
        } else {
            // Mute
            await ctx.db.patch(settings._id, {
                mutedConversations: [...mutedConversations, args.conversationId],
            });
        }

        return settings._id;
    },
});

// Check if a conversation is muted
export const isConversationMuted = query({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
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

        const settings = await ctx.db
            .query("notificationSettings")
            .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
            .first();

        if (!settings) {
            return false;
        }

        return (settings.mutedConversations || []).includes(args.conversationId);
    },
});
