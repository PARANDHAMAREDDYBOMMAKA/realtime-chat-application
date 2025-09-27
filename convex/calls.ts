import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./_utils";

export const initiateCall = mutation({
  args: {
    roomId: v.optional(v.id("rooms")),
    conversationId: v.optional(v.id("conversations")),
    type: v.union(v.literal("audio"), v.literal("video")),
    participantIds: v.array(v.id("users")),
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

    if (!args.roomId && !args.conversationId) {
      throw new Error("Either roomId or conversationId must be provided");
    }

    const now = Date.now();
    const callId = await ctx.db.insert("calls", {
      roomId: args.roomId,
      conversationId: args.conversationId,
      initiatorId: currentUser._id,
      type: args.type,
      status: "ringing",
      startedAt: now,
    });

    // Add initiator as participant - they start as "invited" until connection is established
    await ctx.db.insert("callParticipants", {
      callId,
      userId: currentUser._id,
      status: "invited",
      joinedAt: now,
      mediaState: {
        audio: true,
        video: args.type === "video",
      },
    });

    // Add other participants
    for (const participantId of args.participantIds) {
      if (participantId !== currentUser._id) {
        await ctx.db.insert("callParticipants", {
          callId,
          userId: participantId,
          status: "invited",
        });
      }
    }

    return callId;
  },
});

export const joinCall = mutation({
  args: {
    callId: v.id("calls"),
    mediaState: v.object({
      audio: v.boolean(),
      video: v.boolean(),
    }),
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

    const call = await ctx.db.get(args.callId);
    if (!call) {
      throw new Error("Call not found");
    }

    if (call.status === "ended") {
      throw new Error("Call has ended");
    }

    const participant = await ctx.db
      .query("callParticipants")
      .withIndex("by_call_user", (q) => q.eq("callId", args.callId).eq("userId", currentUser._id))
      .first();

    if (!participant) {
      throw new Error("Not invited to this call");
    }

    const now = Date.now();
    await ctx.db.patch(participant._id, {
      status: "joined",
      joinedAt: now,
      mediaState: args.mediaState,
    });

    // Update call status to active and mark caller as joined when recipient answers
    if (call.status === "ringing") {
      await ctx.db.patch(args.callId, { status: "active" });

      // Find and update the caller's status from "calling" to "joined"
      const callerParticipant = await ctx.db
        .query("callParticipants")
        .withIndex("by_call_user", (q) => q.eq("callId", args.callId).eq("userId", call.initiatorId))
        .first();

      if (callerParticipant && callerParticipant.status === "invited") {
        await ctx.db.patch(callerParticipant._id, {
          status: "joined",
        });
      }
    }

    return participant._id;
  },
});

export const leaveCall = mutation({
  args: {
    callId: v.id("calls"),
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

    const participant = await ctx.db
      .query("callParticipants")
      .withIndex("by_call_user", (q) => q.eq("callId", args.callId).eq("userId", currentUser._id))
      .first();

    if (!participant) {
      throw new Error("Not in this call");
    }

    const now = Date.now();
    await ctx.db.patch(participant._id, {
      status: "left",
      leftAt: now,
    });

    // Check if call should end - end if no participants are active (calling, joined, or invited)
    const activeParticipants = await ctx.db
      .query("callParticipants")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .filter((q) => q.or(
        q.eq(q.field("status"), "joined"),
        q.eq(q.field("status"), "invited")
      ))
      .collect();

    if (activeParticipants.length === 0) {
      const call = await ctx.db.get(args.callId);
      if (call) {
        const duration = now - call.startedAt;
        await ctx.db.patch(args.callId, {
          status: "ended",
          endedAt: now,
          duration,
        });
      }
    }
  },
});

export const declineCall = mutation({
  args: {
    callId: v.id("calls"),
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

    const participant = await ctx.db
      .query("callParticipants")
      .withIndex("by_call_user", (q) => q.eq("callId", args.callId).eq("userId", currentUser._id))
      .first();

    if (!participant) {
      throw new Error("Not invited to this call");
    }

    await ctx.db.patch(participant._id, {
      status: "declined",
    });
  },
});

export const updateMediaState = mutation({
  args: {
    callId: v.id("calls"),
    mediaState: v.object({
      audio: v.boolean(),
      video: v.boolean(),
    }),
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

    const participant = await ctx.db
      .query("callParticipants")
      .withIndex("by_call_user", (q) => q.eq("callId", args.callId).eq("userId", currentUser._id))
      .first();

    if (!participant || participant.status !== "joined") {
      throw new Error("Not in this call");
    }

    await ctx.db.patch(participant._id, {
      mediaState: args.mediaState,
    });
  },
});

export const getActiveCall = query({
  args: {
    roomId: v.optional(v.id("rooms")),
    conversationId: v.optional(v.id("conversations")),
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

    // First, check if the user is a participant in any active calls
    const userParticipations = await ctx.db
      .query("callParticipants")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .filter((q) => q.or(q.eq(q.field("status"), "invited"), q.eq(q.field("status"), "joined")))
      .collect();

    for (const participation of userParticipations) {
      const call = await ctx.db.get(participation.callId);
      if (call && (call.status === "ringing" || call.status === "active")) {
        // Check if this call matches the conversation/room filter
        if (args.conversationId && call.conversationId !== args.conversationId) {
          continue;
        }
        if (args.roomId && call.roomId !== args.roomId) {
          continue;
        }

        const participants = await ctx.db
          .query("callParticipants")
          .withIndex("by_call", (q) => q.eq("callId", call._id))
          .collect();

        const participantsWithUsers = await Promise.all(
          participants.map(async (participant) => {
            const user = await ctx.db.get(participant.userId);
            return {
              ...participant,
              user: user ? {
                _id: user._id,
                username: user.username,
                imageUrl: user.imageUrl,
              } : null,
            };
          })
        );

        const initiator = await ctx.db.get(call.initiatorId);

        return {
          ...call,
          participants: participantsWithUsers.filter(p => p.user),
          initiator: initiator ? {
            _id: initiator._id,
            username: initiator.username,
            imageUrl: initiator.imageUrl,
          } : null,
          currentUserParticipation: participation,
        };
      }
    }

    return null;
  },
});

// New query to get any incoming calls for the current user
export const getIncomingCall = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const currentUser = await getCurrentUser(ctx, identity);
    if (!currentUser) {
      return null;
    }

    // Look for incoming calls where the user is invited but hasn't joined yet
    const incomingParticipation = await ctx.db
      .query("callParticipants")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .filter((q) => q.eq(q.field("status"), "invited"))
      .order("desc")
      .first();

    if (!incomingParticipation) {
      return null;
    }

    const call = await ctx.db.get(incomingParticipation.callId);
    if (!call || call.status !== "ringing") {
      return null;
    }

    const initiator = await ctx.db.get(call.initiatorId);

    return {
      ...call,
      initiator: initiator ? {
        _id: initiator._id,
        username: initiator.username,
        imageUrl: initiator.imageUrl,
      } : null,
      currentUserParticipation: incomingParticipation,
    };
  },
});

export const getCallHistory = query({
  args: {
    roomId: v.optional(v.id("rooms")),
    conversationId: v.optional(v.id("conversations")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const currentUser = await getCurrentUser(ctx, identity);
    if (!currentUser) {
      return [];
    }

    let calls: any[] = [];

    if (args.roomId) {
      calls = await ctx.db
        .query("calls")
        .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
        .filter((q) => q.eq(q.field("status"), "ended"))
        .order("desc")
        .take(args.limit || 10);
    } else if (args.conversationId) {
      calls = await ctx.db
        .query("calls")
        .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
        .filter((q) => q.eq(q.field("status"), "ended"))
        .order("desc")
        .take(args.limit || 10);
    }

    const callsWithDetails = await Promise.all(
      calls.map(async (call) => {
        const participants = await ctx.db
          .query("callParticipants")
          .withIndex("by_call", (q) => q.eq("callId", call._id))
          .collect();

        const participantsWithUsers = await Promise.all(
          participants.map(async (participant) => {
            const user = await ctx.db.get(participant.userId);
            return {
              ...participant,
              user: user ? {
                username: user.username,
                imageUrl: user.imageUrl,
              } : null,
            };
          })
        );

        const initiator = await ctx.db.get(call.initiatorId);

        return {
          ...call,
          participants: participantsWithUsers.filter(p => p.user),
          initiator: initiator && 'username' in initiator ? {
            username: initiator.username,
            imageUrl: initiator.imageUrl,
          } : null,
        };
      })
    );

    return callsWithDetails;
  },
});

// WebRTC signaling
export const createPeerConnection = mutation({
  args: {
    callId: v.id("calls"),
    toUserId: v.id("users"),
    offer: v.optional(v.string()),
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

    const connectionId = await ctx.db.insert("peerConnections", {
      callId: args.callId,
      fromUserId: currentUser._id,
      toUserId: args.toUserId,
      offer: args.offer,
      iceCandidates: [],
      status: "pending",
      createdAt: Date.now(),
    });

    return connectionId;
  },
});

export const updatePeerConnection = mutation({
  args: {
    connectionId: v.id("peerConnections"),
    answer: v.optional(v.string()),
    iceCandidate: v.optional(v.string()),
    status: v.optional(v.union(v.literal("connected"), v.literal("failed"), v.literal("closed"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      throw new Error("Connection not found");
    }

    const updates: any = {};

    if (args.answer) {
      updates.answer = args.answer;
    }

    if (args.iceCandidate) {
      updates.iceCandidates = [...connection.iceCandidates, args.iceCandidate];
    }

    if (args.status) {
      updates.status = args.status;
    }

    await ctx.db.patch(args.connectionId, updates);
  },
});

export const getPeerConnections = query({
  args: {
    callId: v.id("calls"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const currentUser = await getCurrentUser(ctx, identity);
    if (!currentUser) {
      return [];
    }

    const connections = await ctx.db
      .query("peerConnections")
      .withIndex("by_call", (q) => q.eq("callId", args.callId))
      .filter((q) =>
        q.or(
          q.eq(q.field("fromUserId"), currentUser._id),
          q.eq(q.field("toUserId"), currentUser._id)
        )
      )
      .collect();

    return connections;
  },
});