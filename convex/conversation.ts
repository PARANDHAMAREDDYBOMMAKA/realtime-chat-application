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

        const membership = await ctx.db.query("conversationMembers").withIndex("by_memberId_conversationId", (q) => q.eq("memberId", currentUser._id).eq("conversationId", conversation._id)).first();

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
                otherMembers: null,
                isCreator: false,
                isAdmin: false
            }
        }
        else {
            const otherMembers = (await Promise.all(allConversationMemberships.filter(membership => membership.memberId !== currentUser._id)))

            // For legacy groups without a creator, allow everyone to manage
            // For new groups with creatorId, strictly enforce creator/admin rules
            const isCreator = conversation.creatorId === currentUser._id || !conversation.creatorId;
            const isAdmin = membership.isAdmin === true || !conversation.creatorId;

            return {
                ...conversation,
                otherMembers,
                otherMember: null,
                isCreator,
                isAdmin
            }
        }
    },
});

export const createGroup = mutation({
    args: {
        members: v.array(v.id("users")),
        name: v.string(),
        groupImageUrl: v.optional(v.string())
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
            name: args.name,
            creatorId: currentUser._id,
            groupImageUrl: args.groupImageUrl
        })

        // Remove duplicates from member list
        const uniqueMembers = Array.from(new Set([...args.members, currentUser._id]));

        await Promise.all(uniqueMembers.map(async memberId => {
            await ctx.db.insert("conversationMembers", {
                memberId,
                conversationId,
                isTyping: false,
                isAdmin: memberId === currentUser._id // Creator is automatically an admin
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
            .first();

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
                .first();

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
            .first();

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

        // Check if user is creator or admin for group conversations
        // Legacy groups (without creatorId) can be deleted by anyone
        if (conversation.isGroup && conversation.creatorId) {
            const currentUserMembership = await ctx.db
                .query("conversationMembers")
                .withIndex("by_memberId_conversationId", (q) =>
                    q.eq("memberId", currentUser._id).eq("conversationId", args.conversationId)
                )
                .first();

            const isCreator = conversation.creatorId === currentUser._id;
            const isAdmin = currentUserMembership?.isAdmin === true;

            if (!isCreator && !isAdmin) {
                throw new ConvexError("Only the group creator or admins can delete this group");
            }
        }

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
      .first();
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
      .first();
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
      .first();
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
      .first();
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

export const getGroupMembers = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const currentUser = await getUserByClerjId({ ctx, clerkId: identity.subject });
    if (!currentUser) return [];

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !conversation.isGroup) return [];

    // Get all members of the conversation
    const conversationMembers = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    // For legacy groups without creatorId, don't show admin badges
    const hasCreator = !!conversation.creatorId;

    // Get user details for each member
    const members = await Promise.all(
      conversationMembers.map(async (member) => {
        const user = await ctx.db.get(member.memberId);
        return user
          ? {
              _id: user._id,
              username: user.username,
              imageUrl: user.imageUrl,
              email: user.email,
              isAdmin: hasCreator ? (member.isAdmin || false) : false,
              isCreator: hasCreator ? (conversation.creatorId === user._id) : false,
            }
          : null;
      })
    );

    return members.filter(Boolean);
  },
});

export const toggleAdmin = mutation({
  args: {
    conversationId: v.id("conversations"),
    memberId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    const currentUser = await getUserByClerjId({ ctx, clerkId: identity.subject });
    if (!currentUser) {
      throw new ConvexError("User not found");
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new ConvexError("Conversation not found");

    if (!conversation.isGroup) {
      throw new ConvexError("This is not a group conversation");
    }

    // Only allow admin management for new groups with creatorId
    if (!conversation.creatorId) {
      throw new ConvexError("Admin management is not available for legacy groups");
    }

    // Check if current user is the creator or an admin
    const currentUserMembership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_memberId_conversationId", (q) =>
        q.eq("memberId", currentUser._id).eq("conversationId", args.conversationId)
      )
      .first();

    const isCreator = conversation.creatorId === currentUser._id;
    const isAdmin = currentUserMembership?.isAdmin === true;

    if (!isCreator && !isAdmin) {
      throw new ConvexError("Only the group creator or admins can manage admin privileges");
    }

    // Get the target member's membership
    const targetMembership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_memberId_conversationId", (q) =>
        q.eq("memberId", args.memberId).eq("conversationId", args.conversationId)
      )
      .first();

    if (!targetMembership) {
      throw new ConvexError("Member not found in this group");
    }

    // Prevent removing admin from creator
    if (conversation.creatorId === args.memberId && targetMembership.isAdmin) {
      throw new ConvexError("Cannot remove admin privileges from the group creator");
    }

    // Toggle admin status
    await ctx.db.patch(targetMembership._id, {
      isAdmin: !targetMembership.isAdmin,
    });

    return { success: true, isAdmin: !targetMembership.isAdmin };
  },
});

export const updateGroupImage = mutation({
  args: {
    conversationId: v.id("conversations"),
    groupImageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    const currentUser = await getUserByClerjId({ ctx, clerkId: identity.subject });
    if (!currentUser) {
      throw new ConvexError("User not found");
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new ConvexError("Conversation not found");

    if (!conversation.isGroup) {
      throw new ConvexError("This is not a group conversation");
    }

    // Check if current user is the creator or an admin
    const currentUserMembership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_memberId_conversationId", (q) =>
        q.eq("memberId", currentUser._id).eq("conversationId", args.conversationId)
      )
      .first();

    if (!currentUserMembership) {
      throw new ConvexError("You are not a member of this group");
    }

    // For legacy groups without creatorId, allow everyone to update
    // For new groups, only creator or admin can update
    if (conversation.creatorId) {
      const isCreator = conversation.creatorId === currentUser._id;
      const isAdmin = currentUserMembership.isAdmin === true;

      if (!isCreator && !isAdmin) {
        throw new ConvexError("Only the group creator or admins can update the group image");
      }
    }

    // Update group image
    await ctx.db.patch(args.conversationId, {
      groupImageUrl: args.groupImageUrl,
    });

    // Create a system message about the image update
    await ctx.db.insert("messages", {
      senderId: currentUser._id,
      conversationId: args.conversationId,
      type: "system",
      content: [`${capitalizeName(currentUser.username)} updated the group photo`],
      createdAt: Date.now(),
    });

    return { success: true };
  },
});