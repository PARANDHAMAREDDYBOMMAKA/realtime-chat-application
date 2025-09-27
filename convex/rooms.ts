import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./_utils";

export const createRoom = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isPrivate: v.boolean(),
    maxParticipants: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const currentUser = await getCurrentUser(ctx, identity);
    if (!currentUser) {
      throw new Error("User not found");
    }

    const now = Date.now();
    const roomId = await ctx.db.insert("rooms", {
      name: args.name,
      description: args.description,
      isPrivate: args.isPrivate,
      maxParticipants: args.maxParticipants || 50,
      ownerId: currentUser._id,
      createdAt: now,
      lastActivity: now,
    });

    // Add creator as owner
    await ctx.db.insert("roomMembers", {
      roomId,
      userId: currentUser._id,
      role: "owner",
      joinedAt: now,
      lastSeen: now,
    });

    return roomId;
  },
});

export const joinRoom = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const currentUser = await getCurrentUser(ctx, identity);
    if (!currentUser) {
      throw new Error("User not found");
    }

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    const existingMember = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_user", (q) => q.eq("roomId", args.roomId).eq("userId", currentUser._id))
      .first();

    if (existingMember) {
      // Update last seen
      await ctx.db.patch(existingMember._id, { lastSeen: Date.now() });
      return existingMember._id;
    }

    const memberCount = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    if (room.maxParticipants && memberCount.length >= room.maxParticipants) {
      throw new Error("Room is full");
    }

    const now = Date.now();
    const memberId = await ctx.db.insert("roomMembers", {
      roomId: args.roomId,
      userId: currentUser._id,
      role: "member",
      joinedAt: now,
      lastSeen: now,
    });

    // Update room activity
    await ctx.db.patch(args.roomId, { lastActivity: now });

    return memberId;
  },
});

export const leaveRoom = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const currentUser = await getCurrentUser(ctx, identity);
    if (!currentUser) {
      throw new Error("User not found");
    }

    const membership = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_user", (q) => q.eq("roomId", args.roomId).eq("userId", currentUser._id))
      .first();

    if (!membership) {
      throw new Error("Not a member of this room");
    }

    await ctx.db.delete(membership._id);

    // If owner leaves, transfer ownership to oldest admin or member
    if (membership.role === "owner") {
      const nextOwner = await ctx.db
        .query("roomMembers")
        .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
        .order("asc")
        .first();

      if (nextOwner) {
        await ctx.db.patch(nextOwner._id, { role: "owner" });
      } else {
        // No members left, delete room
        await ctx.db.delete(args.roomId);
      }
    }
  },
});

export const getRooms = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const currentUser = await getCurrentUser(ctx, identity);
    if (!currentUser) {
      return [];
    }

    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .collect();

    const rooms = await Promise.all(
      memberships.map(async (membership) => {
        const room = await ctx.db.get(membership.roomId);
        if (!room) return null;

        const memberCount = await ctx.db
          .query("roomMembers")
          .withIndex("by_room", (q) => q.eq("roomId", membership.roomId))
          .collect();

        const owner = await ctx.db.get(room.ownerId);

        return {
          ...room,
          memberCount: memberCount.length,
          userRole: membership.role,
          owner: owner ? { username: owner.username, imageUrl: owner.imageUrl } : null,
        };
      })
    );

    return rooms.filter(Boolean);
  },
});

export const getPublicRooms = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_private", (q) => q.eq("isPrivate", false))
      .order("desc")
      .take(args.limit || 20);

    const roomsWithDetails = await Promise.all(
      rooms.map(async (room) => {
        const memberCount = await ctx.db
          .query("roomMembers")
          .withIndex("by_room", (q) => q.eq("roomId", room._id))
          .collect();

        const owner = await ctx.db.get(room.ownerId);

        return {
          ...room,
          memberCount: memberCount.length,
          owner: owner ? { username: owner.username, imageUrl: owner.imageUrl } : null,
        };
      })
    );

    return roomsWithDetails;
  },
});

export const getRoomDetails = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const currentUser = await getCurrentUser(ctx, identity);
    if (!currentUser) {
      return null;
    }

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      return null;
    }

    const membership = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_user", (q) => q.eq("roomId", args.roomId).eq("userId", currentUser._id))
      .first();

    if (!membership && room.isPrivate) {
      return null;
    }

    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const membersWithUsers = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          ...member,
          user: user ? {
            username: user.username,
            imageUrl: user.imageUrl,
            status: user.status,
            lastSeen: user.lastSeen,
          } : null,
        };
      })
    );

    const owner = await ctx.db.get(room.ownerId);

    return {
      ...room,
      members: membersWithUsers.filter(m => m.user),
      userRole: membership?.role || null,
      owner: owner ? { username: owner.username, imageUrl: owner.imageUrl } : null,
    };
  },
});

export const updateUserStatus = mutation({
  args: {
    status: v.union(v.literal("online"), v.literal("offline"), v.literal("away")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const currentUser = await getCurrentUser(ctx, identity);
    if (!currentUser) {
      throw new Error("User not found");
    }

    await ctx.db.patch(currentUser._id, {
      status: args.status,
      lastSeen: Date.now(),
    });
  },
});