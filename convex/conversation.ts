import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserByClerjId } from "./_utils";

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