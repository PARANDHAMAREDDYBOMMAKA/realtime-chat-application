import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserByClerjId, capitalizeName } from "./_utils";

export const get = query({
    args: {
        id: v.id("conversations"),
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
        const conversation = await ctx.db.get(args.id);

        if (!conversation) {
            throw new ConvexError("Conversation not found");
        }

        const membership = await ctx.db.query("conversationMembers").withIndex("by_memberId_conversationId", (q) => q.eq("memberId", currentUser._id).eq("conversationId", conversation._id)).unique();

        if (!membership) {
            throw new ConvexError("You are not a member of this conversation");
        }
        const allConversationMemberships = await ctx.db.query("conversationMembers").withIndex("by_conversationId", (q) => q.eq("conversationId", args.id)).collect();

        if (!conversation.isGroup) {
            const otherMembership = allConversationMemberships.filter(membership => membership.memberId !== currentUser._id)[0];

            const otherMemberDetails = await ctx.db.get(otherMembership.memberId)

            return {
                ...conversation,
                otherMember: {
                    ...otherMemberDetails,
                    lastSeenMessageId: otherMembership.lastSeenMessage,
                    isTyping: otherMembership.isTyping ?? false
                },
                otherMembers: null
            }
        }
        else {
            const otherMembers = (await Promise.all(allConversationMemberships.filter(membership => membership.memberId !== currentUser._id)))

            return { ...conversation, otherMembers, otherMember: null }
        }
    },
});

export const createGroup = mutation({
    args: {
        members: v.array(v.id("users")),
        name: v.string()
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

        const conversationId = await ctx.db.insert("conversations", {
            isGroup: true,
            name: args.name
        })

        await Promise.all([...args.members, currentUser._id].map(async memberId => {
            await ctx.db.insert("conversationMembers", {
                memberId,
                conversationId,
                isTyping: false
            })
        }))

    }
})

export const addMembersToGroup = mutation({
    args: {
        conversationId: v.id("conversations"),
        members: v.array(v.id("users")),
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

        if (!conversation.isGroup) {
            throw new ConvexError("This is not a group conversation");
        }

        // Check if current user is a member of the group
        const membership = await ctx.db
            .query("conversationMembers")
            .withIndex("by_memberId_conversationId", (q) =>
                q.eq("memberId", currentUser._id).eq("conversationId", args.conversationId)
            )
            .unique();

        if (!membership) {
            throw new ConvexError("You are not a member of this group");
        }

        // Add new members
        const addedMembers = [];
        for (const memberId of args.members) {
            // Check if member is already in the group
            const existingMembership = await ctx.db
                .query("conversationMembers")
                .withIndex("by_memberId_conversationId", (q) =>
                    q.eq("memberId", memberId).eq("conversationId", args.conversationId)
                )
                .unique();

            if (!existingMembership) {
                await ctx.db.insert("conversationMembers", {
                    memberId,
                    conversationId: args.conversationId,
                    isTyping: false,
                });

                const addedUser = await ctx.db.get(memberId);
                if (addedUser) {
                    addedMembers.push(addedUser.username);
                }
            }
        }

        // Create a system message for each added member
        if (addedMembers.length > 0) {
            const membersList = addedMembers
                .map(name => capitalizeName(name))
                .join(", ");

            await ctx.db.insert("messages", {
                senderId: currentUser._id,
                conversationId: args.conversationId,
                type: "system",
                content: [`${capitalizeName(currentUser.username)} added ${membersList} to the group`],
                createdAt: Date.now(),
            });
        }

        return { addedCount: addedMembers.length };
    },
});

export const leaveGroup = mutation({
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

        if (!conversation.isGroup) {
            throw new ConvexError("This is not a group conversation");
        }

        // Find the current user's membership
        const membership = await ctx.db
            .query("conversationMembers")
            .withIndex("by_memberId_conversationId", (q) =>
                q.eq("memberId", currentUser._id).eq("conversationId", args.conversationId)
            )
            .unique();

        if (!membership) {
            throw new ConvexError("You are not a member of this group");
        }

        // Create a system message about the user leaving
        await ctx.db.insert("messages", {
            senderId: currentUser._id,
            conversationId: args.conversationId,
            type: "system",
            content: [`${capitalizeName(currentUser.username)} left the group`],
            createdAt: Date.now(),
        });

        // Remove the user's membership
        await ctx.db.delete(membership._id);

        // Check if there are any members left
        const remainingMembers = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
            .collect();

        // If no members left, delete the group and all its messages
        if (remainingMembers.length === 0) {
            const messages = await ctx.db
                .query("messages")
                .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
                .collect();

            await ctx.db.delete(args.conversationId);

            await Promise.all(
                messages.map(async (message) => {
                    await ctx.db.delete(message._id);
                })
            );
        }
    },
});

export const deleteConversation = mutation({
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
        if (!membership || membership.length <= 1) throw new ConvexError("Membership not found");


        const messages = await ctx.db.query("messages").withIndex("by_conversationId", q => { return q.eq("conversationId", args.conversationId) }).collect();
        await ctx.db.delete(args.conversationId)


        await Promise.all(membership.map(async memberships => {
            await ctx.db.delete(memberships._id)
        }))
        await Promise.all(messages.map(async message => {
            await ctx.db.delete(message._id)
        }))
    }
})

export const updateLastSeenMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized");
    const currentUser = await getUserByClerjId({ ctx, clerkId: identity.subject });
    if (!currentUser) throw new ConvexError("User not found");
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_memberId_conversationId", (q) =>
        q.eq("memberId", currentUser._id).eq("conversationId", args.conversationId)
      )
      .unique();
    if (!membership) throw new ConvexError("Membership not found");
    await ctx.db.patch(membership._id, { lastSeenMessage: args.messageId });
  },
});

export const setTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized");
    const currentUser = await getUserByClerjId({ ctx, clerkId: identity.subject });
    if (!currentUser) throw new ConvexError("User not found");
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_memberId_conversationId", (q) =>
        q.eq("memberId", currentUser._id).eq("conversationId", args.conversationId)
      )
      .unique();
    if (!membership) throw new ConvexError("Membership not found");
    await ctx.db.patch(membership._id, {
      isTyping: args.isTyping,
      lastTypingTime: args.isTyping ? Date.now() : undefined
    });
  },
});

export const startTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized");
    const currentUser = await getUserByClerjId({ ctx, clerkId: identity.subject });
    if (!currentUser) throw new ConvexError("User not found");
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_memberId_conversationId", (q) =>
        q.eq("memberId", currentUser._id).eq("conversationId", args.conversationId)
      )
      .unique();
    if (!membership) throw new ConvexError("Membership not found");
    await ctx.db.patch(membership._id, {
      isTyping: true,
      lastTypingTime: Date.now()
    });
  },
});

export const stopTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized");
    const currentUser = await getUserByClerjId({ ctx, clerkId: identity.subject });
    if (!currentUser) throw new ConvexError("User not found");
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_memberId_conversationId", (q) =>
        q.eq("memberId", currentUser._id).eq("conversationId", args.conversationId)
      )
      .unique();
    if (!membership) throw new ConvexError("Membership not found");
    await ctx.db.patch(membership._id, {
      isTyping: false,
      lastTypingTime: undefined
    });
  },
});

export const getTypingUsers = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const currentUser = await getUserByClerjId({ ctx, clerkId: identity.subject });
    if (!currentUser) return [];

    const now = Date.now();
    const typingThreshold = 5000; // 5 seconds

    const typingMembers = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) =>
        q.and(
          q.eq(q.field("isTyping"), true),
          q.neq(q.field("memberId"), currentUser._id)
        )
      )
      .collect();

    // Filter out stale typing indicators and get user details
    const activeTypingUsers = await Promise.all(
      typingMembers
        .filter(member =>
          member.lastTypingTime && (now - member.lastTypingTime < typingThreshold)
        )
        .map(async (member) => {
          const user = await ctx.db.get(member.memberId);
          return user ? {
            _id: user._id,
            username: user.username,
            imageUrl: user.imageUrl,
          } : null;
        })
    );

    return activeTypingUsers.filter(Boolean);
  },
});

export const getAvailableFriendsForGroup = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const currentUser = await getUserByClerjId({ ctx, clerkId: identity.subject });
    if (!currentUser) return [];

    // Get all members of the conversation
    const conversationMembers = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    const memberIds = conversationMembers.map((m) => m.memberId);

    // Get all friends of the current user
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

    // Filter friends who are not yet in the group
    const availableFriendIds = friendIds.filter((id) => !memberIds.includes(id));

    // Get user details for available friends
    const availableFriends = await Promise.all(
      availableFriendIds.map(async (id) => {
        const user = await ctx.db.get(id);
        return user
          ? {
              _id: user._id,
              username: user.username,
              imageUrl: user.imageUrl,
              email: user.email,
            }
          : null;
      })
    );

    return availableFriends.filter(Boolean);
  },
});