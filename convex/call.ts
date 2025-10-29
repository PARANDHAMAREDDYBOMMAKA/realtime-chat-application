import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Start a new call
export const start = mutation({
  args: {
    conversationId: v.id("conversations"),
    type: v.union(v.literal("video"), v.literal("audio")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Check if there's already an active call
    const existingCall = await ctx.db
      .query("calls")
      .withIndex("by_conversation_status", (q) =>
        q.eq("conversationId", args.conversationId).eq("status", "active")
      )
      .first();

    if (existingCall) {
      throw new Error("There is already an active call in this conversation");
    }

    // Check for ringing calls
    const ringingCall = await ctx.db
      .query("calls")
      .withIndex("by_conversation_status", (q) =>
        q.eq("conversationId", args.conversationId).eq("status", "ringing")
      )
      .first();

    if (ringingCall) {
      throw new Error("There is already a ringing call in this conversation");
    }

    // Create a new call
    const callId = await ctx.db.insert("calls", {
      conversationId: args.conversationId,
      initiatorId: currentUser._id,
      type: args.type,
      status: "ringing",
      roomName: args.conversationId,
      startedAt: Date.now(),
    });

    return callId;
  },
});

// Accept a call (change status from ringing to active)
export const accept = mutation({
  args: {
    callId: v.id("calls"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const call = await ctx.db.get(args.callId);
    if (!call) {
      throw new Error("Call not found");
    }

    if (call.status !== "ringing") {
      throw new Error("Call is not in ringing state");
    }

    await ctx.db.patch(args.callId, {
      status: "active",
    });

    return call;
  },
});

// End a call
export const end = mutation({
  args: {
    callId: v.id("calls"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const call = await ctx.db.get(args.callId);
    if (!call) {
      throw new Error("Call not found");
    }

    await ctx.db.patch(args.callId, {
      status: "ended",
      endedAt: Date.now(),
    });

    return call;
  },
});

// Reject a call
export const reject = mutation({
  args: {
    callId: v.id("calls"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const call = await ctx.db.get(args.callId);
    if (!call) {
      throw new Error("Call not found");
    }

    await ctx.db.patch(args.callId, {
      status: "ended",
      endedAt: Date.now(),
    });

    return call;
  },
});

// Get active or ringing call for a conversation
export const getActiveCall = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser) {
      return null;
    }

    // Check for active call
    const activeCall = await ctx.db
      .query("calls")
      .withIndex("by_conversation_status", (q) =>
        q.eq("conversationId", args.conversationId).eq("status", "active")
      )
      .first();

    if (activeCall) {
      const initiator = await ctx.db.get(activeCall.initiatorId);
      return {
        ...activeCall,
        initiator,
        isInitiator: activeCall.initiatorId === currentUser._id,
      };
    }

    // Check for ringing call
    const ringingCall = await ctx.db
      .query("calls")
      .withIndex("by_conversation_status", (q) =>
        q.eq("conversationId", args.conversationId).eq("status", "ringing")
      )
      .first();

    if (ringingCall) {
      const initiator = await ctx.db.get(ringingCall.initiatorId);
      return {
        ...ringingCall,
        initiator,
        isInitiator: ringingCall.initiatorId === currentUser._id,
      };
    }

    return null;
  },
});
