import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserByClerjId } from "./_utils";

// Update user's presence status (online, offline, away)
export const updatePresence = mutation({
  args: {
    status: v.union(v.literal("online"), v.literal("offline"), v.literal("away")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await getUserByClerjId({
      ctx,
      clerkId: identity.subject,
    });

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      status: args.status,
      lastSeen: Date.now(),
    });

    return { success: true };
  },
});

// Heartbeat to keep user online
export const heartbeat = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false };
    }

    const user = await getUserByClerjId({
      ctx,
      clerkId: identity.subject,
    });

    if (!user) {
      return { success: false };
    }

    await ctx.db.patch(user._id, {
      status: "online",
      lastSeen: Date.now(),
    });

    return { success: true };
  },
});

// Get user's online status
export const getUserStatus = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    const now = Date.now();
    const lastSeen = user.lastSeen || 0;
    const timeDiff = now - lastSeen;

    // If last seen is more than 10 minutes ago, consider offline
    if (timeDiff > 10 * 60 * 1000) {
      return {
        status: "offline" as const,
        lastSeen: user.lastSeen,
      };
    }

    // If last seen is more than 5 minutes ago but less than 10, consider away
    if (timeDiff > 5 * 60 * 1000) {
      return {
        status: "away" as const,
        lastSeen: user.lastSeen,
      };
    }

    return {
      status: user.status || "offline",
      lastSeen: user.lastSeen,
    };
  },
});

// Get multiple users' statuses (for efficiency)
export const getUsersStatuses = query({
  args: {
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const statuses = await Promise.all(
      args.userIds.map(async (userId) => {
        const user = await ctx.db.get(userId);
        if (!user) {
          return { userId, status: "offline" as const, lastSeen: 0 };
        }

        const lastSeen = user.lastSeen || 0;
        const timeDiff = now - lastSeen;

        let status: "online" | "offline" | "away" = "offline";

        if (timeDiff <= 5 * 60 * 1000) {
          status = user.status || "offline";
        } else if (timeDiff <= 10 * 60 * 1000) {
          status = "away";
        }

        return {
          userId,
          status,
          lastSeen: user.lastSeen,
        };
      })
    );

    return statuses;
  },
});
