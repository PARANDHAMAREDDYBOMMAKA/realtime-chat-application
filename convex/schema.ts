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
        conversationId: v.id("conversations"),
        initiatorId: v.id("users"),
        type: v.union(v.literal("video"), v.literal("audio")),
        status: v.union(v.literal("ringing"), v.literal("active"), v.literal("ended")),
        roomName: v.string(),
        startedAt: v.number(),
        endedAt: v.optional(v.number()),
    }).index("by_conversationId", ["conversationId"]).index("by_status", ["status"]).index("by_conversation_status", ["conversationId", "status"]),

    reactions: defineTable({
        messageId: v.id("messages"),
        userId: v.id("users"),
        emoji: v.string(),
        createdAt: v.number(),
    }).index("by_messageId", ["messageId"]).index("by_userId", ["userId"]).index("by_message_user", ["messageId", "userId"]),

})