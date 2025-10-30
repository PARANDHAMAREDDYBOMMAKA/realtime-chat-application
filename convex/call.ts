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

    // Add the initiator as a participant
    await ctx.db.insert("callParticipants", {
      callId,
      userId: currentUser._id,
      joinedAt: Date.now(),
      status: "joined",
    });

    return callId;
  },
});

// Accept a call (change status from ringing to active and add participant)
export const accept = mutation({
  args: {
    callId: v.id("calls"),
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

    const call = await ctx.db.get(args.callId);
    if (!call) {
      throw new Error("Call not found");
    }

    if (call.status !== "ringing" && call.status !== "active") {
      throw new Error("Call is not available to join");
    }

    // Change call status to active if it's still ringing
    if (call.status === "ringing") {
      await ctx.db.patch(args.callId, {
        status: "active",
      });
    }

    // Check if user is already a participant
    const existingParticipant = await ctx.db
      .query("callParticipants")
      .withIndex("by_call_user", (q) =>
        q.eq("callId", args.callId).eq("userId", currentUser._id)
      )
      .first();

    // Add user as participant if not already joined
    if (!existingParticipant) {
      await ctx.db.insert("callParticipants", {
        callId: args.callId,
        userId: currentUser._id,
        joinedAt: Date.now(),
        status: "joined",
      });
    } else if (existingParticipant.status === "left") {
      // Rejoin if previously left
      await ctx.db.patch(existingParticipant._id, {
        status: "joined",
        joinedAt: Date.now(),
        leftAt: undefined,
      });
    }

    return call;
  },
});

// Leave a call (for individual participants)
export const leave = mutation({
  args: {
    callId: v.id("calls"),
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

    const call = await ctx.db.get(args.callId);
    if (!call) {
      throw new Error("Call not found");
    }

    // Find the current user's participant record
    const participant = await ctx.db
      .query("callParticipants")
      .withIndex("by_call_user", (q) =>
        q.eq("callId", args.callId).eq("userId", currentUser._id)
      )
      .first();

    if (participant && participant.status === "joined") {
      // Mark user as left
      await ctx.db.patch(participant._id, {
        status: "left",
        leftAt: Date.now(),
      });
    }

    // Check if there are any active participants left
    const activeParticipants = await ctx.db
      .query("callParticipants")
      .withIndex("by_call_status", (q) =>
        q.eq("callId", args.callId).eq("status", "joined")
      )
      .collect();

    // If no active participants left OR only 1 participant left, end the call
    // (no point in a call with just one person)
    if (activeParticipants.length <= 1) {
      await ctx.db.patch(args.callId, {
        status: "ended",
        endedAt: Date.now(),
      });

      // Mark the last remaining participant as left too
      if (activeParticipants.length === 1) {
        await ctx.db.patch(activeParticipants[0]._id, {
          status: "left",
          leftAt: Date.now(),
        });
      }
    }

    return call;
  },
});

// End a call (for ending the entire call)
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

    // Mark all participants as left
    const participants = await ctx.db
      .query("callParticipants")
      .withIndex("by_callId", (q) => q.eq("callId", args.callId))
      .collect();

    await Promise.all(
      participants.map(async (participant) => {
        if (participant.status === "joined") {
          await ctx.db.patch(participant._id, {
            status: "left",
            leftAt: Date.now(),
          });
        }
      })
    );

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

      // Check if current user is an active participant
      const currentUserParticipant = await ctx.db
        .query("callParticipants")
        .withIndex("by_call_user", (q) =>
          q.eq("callId", activeCall._id).eq("userId", currentUser._id)
        )
        .first();

      const isParticipant = currentUserParticipant?.status === "joined";
      const hasLeft = currentUserParticipant?.status === "left";

      return {
        ...activeCall,
        initiator,
        isInitiator: activeCall.initiatorId === currentUser._id,
        isParticipant,
        hasLeft,
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

      // For ringing calls, check if user is the initiator (they're automatically a participant)
      const currentUserParticipant = await ctx.db
        .query("callParticipants")
        .withIndex("by_call_user", (q) =>
          q.eq("callId", ringingCall._id).eq("userId", currentUser._id)
        )
        .first();

      const isParticipant = currentUserParticipant?.status === "joined";
      const hasLeft = currentUserParticipant?.status === "left";

      return {
        ...ringingCall,
        initiator,
        isInitiator: ringingCall.initiatorId === currentUser._id,
        isParticipant,
        hasLeft,
      };
    }

    return null;
  },
});
