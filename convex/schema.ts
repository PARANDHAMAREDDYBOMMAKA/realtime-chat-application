import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        username: v.string(),
        imageUrl: v.string(),
        clerkId: v.string(),
        email: v.string(),
        lastSeen: v.optional(v.number()),
        status: v.optional(v.union(v.literal("online"), v.literal("offline"), v.literal("away"))),
    }).index("by_email", ["email"]).index("by_clerkId", ["clerkId"]).index("by_status", ["status"]),

    requests: defineTable({
        sender: v.id("users"),
        receiver: v.id("users"),
    }).index("by_receiver", ["receiver"]).index("by_reciever_sender", ["receiver", "sender"]),

    friends: defineTable({
        user1: v.id("users"),
        user2: v.id("users"),
        conversationId: v.id("conversations"),
    }).index("by_user1", ["user1"]).index("by_user2", ["user2"]).index("by_conversationId", ["conversationId"]),

    rooms: defineTable({
        name: v.string(),
        description: v.optional(v.string()),
        isPrivate: v.boolean(),
        maxParticipants: v.optional(v.number()),
        ownerId: v.id("users"),
        createdAt: v.number(),
        lastActivity: v.number(),
    }).index("by_owner", ["ownerId"]).index("by_private", ["isPrivate"]).index("by_activity", ["lastActivity"]),

    roomMembers: defineTable({
        roomId: v.id("rooms"),
        userId: v.id("users"),
        role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
        joinedAt: v.number(),
        lastSeen: v.optional(v.number()),
    }).index("by_room", ["roomId"]).index("by_user", ["userId"]).index("by_room_user", ["roomId", "userId"]),

    conversations: defineTable({
        name: v.optional(v.string()),
        isGroup: v.boolean(),
        lastMessageId: v.optional(v.id("messages")),
        roomId: v.optional(v.id("rooms")),
    }).index("by_room", ["roomId"]),

    conversationMembers: defineTable({
        memberId: v.id("users"),
        conversationId: v.id("conversations"),
        lastSeenMessage: v.optional(v.id("messages")),
        isTyping: v.optional(v.boolean()),
        lastTypingTime: v.optional(v.number()),
    }).index("by_memberId", ["memberId"]).index("by_conversationId", ["conversationId"]).index("by_memberId_conversationId", ["memberId", "conversationId"]).index("by_typing", ["isTyping"]),

    messages: defineTable({
        senderId: v.id("users"),
        conversationId: v.id("conversations"),
        roomId: v.optional(v.id("rooms")),
        type: v.string(),
        content: v.array(v.string()),
        createdAt: v.optional(v.number()),
        editedAt: v.optional(v.number()),
        replyTo: v.optional(v.id("messages")),
    }).index("by_conversationId", ["conversationId"]).index("by_senderId_conversationId", ["senderId", "conversationId"]).index("by_room", ["roomId"]).index("by_created", ["createdAt"]),

    calls: defineTable({
        roomId: v.optional(v.id("rooms")),
        conversationId: v.optional(v.id("conversations")),
        initiatorId: v.id("users"),
        type: v.union(v.literal("audio"), v.literal("video")),
        status: v.union(v.literal("ringing"), v.literal("active"), v.literal("ended"), v.literal("missed")),
        startedAt: v.number(),
        endedAt: v.optional(v.number()),
        duration: v.optional(v.number()),
    }).index("by_room", ["roomId"]).index("by_conversation", ["conversationId"]).index("by_initiator", ["initiatorId"]).index("by_status", ["status"]),

    callParticipants: defineTable({
        callId: v.id("calls"),
        userId: v.id("users"),
        joinedAt: v.optional(v.number()),
        leftAt: v.optional(v.number()),
        status: v.union(v.literal("invited"), v.literal("joined"), v.literal("left"), v.literal("declined")),
        mediaState: v.optional(v.object({
            audio: v.boolean(),
            video: v.boolean(),
        })),
    }).index("by_call", ["callId"]).index("by_user", ["userId"]).index("by_call_user", ["callId", "userId"]),

    peerConnections: defineTable({
        callId: v.id("calls"),
        fromUserId: v.id("users"),
        toUserId: v.id("users"),
        offer: v.optional(v.string()),
        answer: v.optional(v.string()),
        iceCandidates: v.array(v.string()),
        status: v.union(v.literal("pending"), v.literal("connected"), v.literal("failed"), v.literal("closed")),
        createdAt: v.number(),
    }).index("by_call", ["callId"]).index("by_from_user", ["fromUserId"]).index("by_to_user", ["toUserId"]).index("by_call_users", ["callId", "fromUserId", "toUserId"]),

})