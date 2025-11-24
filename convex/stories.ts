import { ConvexError, v } from "convex/values";
import { getUserByClerjId } from "./_utils";
import { mutation, query } from "./_generated/server";

// Create a new story
export const create = mutation({
    args: {
        type: v.union(v.literal("text"), v.literal("image"), v.literal("video")),
        content: v.array(v.string()),
        backgroundColor: v.optional(v.string()),
        textColor: v.optional(v.string()),
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

        const now = Date.now();
        const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours from now

        const storyId = await ctx.db.insert("stories", {
            userId: currentUser._id,
            type: args.type,
            content: args.content,
            backgroundColor: args.backgroundColor,
            textColor: args.textColor,
            createdAt: now,
            expiresAt,
            viewers: [],
        });

        return storyId;
    },
});

// Get stories from friends (active stories only)
export const getFriendsStories = query({
    args: {
        limit: v.optional(v.number()),
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

        const now = Date.now();

        // Get user's friends
        const friendships1 = await ctx.db
            .query("friends")
            .withIndex("by_user1", (q) => q.eq("user1", currentUser._id))
            .collect();

        const friendships2 = await ctx.db
            .query("friends")
            .withIndex("by_user2", (q) => q.eq("user2", currentUser._id))
            .collect();

        const friendIds = [
            ...friendships1.map((f) => f.user2),
            ...friendships2.map((f) => f.user1),
        ];

        // Get all active stories
        const allStories = await ctx.db
            .query("stories")
            .withIndex("by_expiresAt", (q) => q.gt("expiresAt", now))
            .collect();

        // Filter stories from friends and current user
        const relevantStories = allStories.filter(
            (story) =>
                friendIds.includes(story.userId) || story.userId === currentUser._id
        );

        // Group stories by user
        const storiesByUser = new Map<string, typeof relevantStories>();

        for (const story of relevantStories) {
            const userId = story.userId;
            if (!storiesByUser.has(userId)) {
                storiesByUser.set(userId, []);
            }
            storiesByUser.get(userId)!.push(story);
        }

        // Get user details and format response
        const storiesWithUserDetails = await Promise.all(
            Array.from(storiesByUser.entries()).map(async ([_, stories]) => {
                // The userId from map is a string, we need to retrieve the actual user
                const firstStory = stories[0];
                if (!firstStory) return null;

                const user = await ctx.db.get(firstStory.userId);
                if (!user) return null;

                // Sort stories by creation time
                stories.sort((a, b) => a.createdAt - b.createdAt);

                // Check if current user has viewed all stories
                const hasUnviewed = stories.some(
                    (s) => !s.viewers.includes(currentUser._id)
                );

                return {
                    userId: user._id,
                    username: user.username,
                    userImage: user.imageUrl,
                    isCurrentUser: user._id === currentUser._id,
                    hasUnviewed,
                    storiesCount: stories.length,
                    stories: stories.map((s) => ({
                        id: s._id,
                        type: s.type,
                        content: s.content,
                        backgroundColor: s.backgroundColor,
                        textColor: s.textColor,
                        createdAt: s.createdAt,
                        expiresAt: s.expiresAt,
                        // Only show view count to story owner
                        viewersCount: user._id === currentUser._id ? s.viewers.length : 0,
                        hasViewed: s.viewers.includes(currentUser._id),
                    })),
                };
            })
        );

        const filteredStories = storiesWithUserDetails.filter((s) => s !== null);

        // Sort: current user first, then by whether they have unviewed stories, then by most recent
        filteredStories.sort((a, b) => {
            if (a!.isCurrentUser) return -1;
            if (b!.isCurrentUser) return 1;
            if (a!.hasUnviewed && !b!.hasUnviewed) return -1;
            if (!a!.hasUnviewed && b!.hasUnviewed) return 1;
            return b!.stories[0].createdAt - a!.stories[0].createdAt;
        });

        // Apply limit if specified
        const limit = args.limit ?? 20;
        return filteredStories.slice(0, limit);
    },
});

// Mark story as viewed
export const markAsViewed = mutation({
    args: {
        storyId: v.id("stories"),
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

        const story = await ctx.db.get(args.storyId);
        if (!story) {
            throw new ConvexError("Story not found");
        }

        // Don't add viewer if already viewed
        if (story.viewers.includes(currentUser._id)) {
            return;
        }

        // Add current user to viewers
        await ctx.db.patch(args.storyId, {
            viewers: [...story.viewers, currentUser._id],
        });

        // Record the view
        await ctx.db.insert("storyViews", {
            storyId: args.storyId,
            viewerId: currentUser._id,
            viewedAt: Date.now(),
        });
    },
});

// Get story viewers
export const getStoryViewers = query({
    args: {
        storyId: v.id("stories"),
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

        const story = await ctx.db.get(args.storyId);
        if (!story) {
            throw new ConvexError("Story not found");
        }

        // Only story owner can see viewers
        if (story.userId !== currentUser._id) {
            throw new ConvexError("Unauthorized");
        }

        const views = await ctx.db
            .query("storyViews")
            .withIndex("by_storyId", (q) => q.eq("storyId", args.storyId))
            .collect();

        const viewersWithDetails = await Promise.all(
            views.map(async (view) => {
                const viewer = await ctx.db.get(view.viewerId);
                if (!viewer) return null;

                return {
                    id: viewer._id,
                    username: viewer.username,
                    imageUrl: viewer.imageUrl,
                    viewedAt: view.viewedAt,
                };
            })
        );

        return viewersWithDetails.filter((v) => v !== null);
    },
});

// Delete a story
export const deleteStory = mutation({
    args: {
        storyId: v.id("stories"),
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

        const story = await ctx.db.get(args.storyId);
        if (!story) {
            throw new ConvexError("Story not found");
        }

        // Only story owner can delete
        if (story.userId !== currentUser._id) {
            throw new ConvexError("Unauthorized");
        }

        // Delete story views
        const views = await ctx.db
            .query("storyViews")
            .withIndex("by_storyId", (q) => q.eq("storyId", args.storyId))
            .collect();

        for (const view of views) {
            await ctx.db.delete(view._id);
        }

        // Delete story
        await ctx.db.delete(args.storyId);
    },
});

// Clean up expired stories (should be called periodically)
export const cleanupExpiredStories = mutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const expiredStories = await ctx.db
            .query("stories")
            .withIndex("by_expiresAt", (q) => q.lt("expiresAt", now))
            .collect();

        for (const story of expiredStories) {
            // Delete views
            const views = await ctx.db
                .query("storyViews")
                .withIndex("by_storyId", (q) => q.eq("storyId", story._id))
                .collect();

            for (const view of views) {
                await ctx.db.delete(view._id);
            }

            // Delete replies
            const replies = await ctx.db
                .query("storyReplies")
                .withIndex("by_storyId", (q) => q.eq("storyId", story._id))
                .collect();

            for (const reply of replies) {
                await ctx.db.delete(reply._id);
            }

            // Delete story
            await ctx.db.delete(story._id);
        }

        return expiredStories.length;
    },
});

// Send a reply to a story (creates a private message)
export const sendStoryReply = mutation({
    args: {
        storyId: v.id("stories"),
        content: v.string(),
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

        const story = await ctx.db.get(args.storyId);
        if (!story) {
            throw new ConvexError("Story not found");
        }

        // Check if story is still active
        if (story.expiresAt < Date.now()) {
            throw new ConvexError("Story has expired");
        }

        // Can't reply to own story
        if (story.userId === currentUser._id) {
            throw new ConvexError("Cannot reply to your own story");
        }

        // Create a reply record
        await ctx.db.insert("storyReplies", {
            storyId: args.storyId,
            senderId: currentUser._id,
            content: args.content,
            createdAt: Date.now(),
        });

        // Find or create conversation with story owner
        const friendships1 = await ctx.db
            .query("friends")
            .withIndex("by_user1", (q) => q.eq("user1", currentUser._id))
            .collect();

        const friendships2 = await ctx.db
            .query("friends")
            .withIndex("by_user2", (q) => q.eq("user2", currentUser._id))
            .collect();

        const friendship = [...friendships1, ...friendships2].find(
            (f) => f.user1 === story.userId || f.user2 === story.userId
        );

        if (!friendship) {
            throw new ConvexError("You must be friends to reply to stories");
        }

        // Send message to conversation
        const conversationId = friendship.conversationId;

        // Create message with story reply context
        const messageId = await ctx.db.insert("messages", {
            senderId: currentUser._id,
            conversationId,
            type: "text",
            content: [args.content],
            createdAt: Date.now(),
            storyReplyId: args.storyId,
            storyReplyType: story.type,
            storyReplyContent: story.content,
        });

        // Update conversation's last message
        await ctx.db.patch(conversationId, {
            lastMessageId: messageId,
        });

        return messageId;
    },
});

// Get replies to a story (only story owner can see)
export const getStoryReplies = query({
    args: {
        storyId: v.id("stories"),
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

        const story = await ctx.db.get(args.storyId);
        if (!story) {
            throw new ConvexError("Story not found");
        }

        // Only story owner can see replies
        if (story.userId !== currentUser._id) {
            throw new ConvexError("Unauthorized");
        }

        const replies = await ctx.db
            .query("storyReplies")
            .withIndex("by_storyId", (q) => q.eq("storyId", args.storyId))
            .collect();

        const repliesWithSenderDetails = await Promise.all(
            replies.map(async (reply) => {
                const sender = await ctx.db.get(reply.senderId);
                if (!sender) return null;

                return {
                    id: reply._id,
                    content: reply.content,
                    createdAt: reply.createdAt,
                    sender: {
                        id: sender._id,
                        username: sender.username,
                        imageUrl: sender.imageUrl,
                    },
                };
            })
        );

        return repliesWithSenderDetails.filter((r) => r !== null).sort((a, b) => a!.createdAt - b!.createdAt);
    },
});
