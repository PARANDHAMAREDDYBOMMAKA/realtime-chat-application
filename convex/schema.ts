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
        publicKey: v.optional(v.string()),
        keyFingerprint: v.optional(v.string()),
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
        isEncrypted: v.optional(v.boolean()),
        encryptedContent: v.optional(v.string()),
        iv: v.optional(v.string()),
        encryptedKeys: v.optional(v.array(v.object({
            userId: v.id("users"),
            encryptedSymmetricKey: v.string(),
        }))),
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

    callParticipants: defineTable({
        callId: v.id("calls"),
        userId: v.id("users"),
        joinedAt: v.number(),
        leftAt: v.optional(v.number()),
        status: v.union(v.literal("joined"), v.literal("left")),
    }).index("by_callId", ["callId"]).index("by_userId", ["userId"]).index("by_call_user", ["callId", "userId"]).index("by_call_status", ["callId", "status"]),

    reactions: defineTable({
        messageId: v.id("messages"),
        userId: v.id("users"),
        emoji: v.string(),
        createdAt: v.number(),
    }).index("by_messageId", ["messageId"]).index("by_userId", ["userId"]).index("by_message_user", ["messageId", "userId"]),

    // Link previews for messages
    linkPreviews: defineTable({
        messageId: v.id("messages"),
        url: v.string(),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        image: v.optional(v.string()),
        siteName: v.optional(v.string()),
        createdAt: v.number(),
    }).index("by_messageId", ["messageId"]).index("by_url", ["url"]),

    // User mentions in messages
    mentions: defineTable({
        messageId: v.id("messages"),
        userId: v.id("users"),
        mentionedUserId: v.id("users"),
        createdAt: v.number(),
    }).index("by_messageId", ["messageId"]).index("by_mentionedUserId", ["mentionedUserId"]).index("by_message_user", ["messageId", "mentionedUserId"]),

    // Push notification preferences
    notificationSettings: defineTable({
        userId: v.id("users"),
        pushEnabled: v.boolean(),
        soundEnabled: v.boolean(),
        customSound: v.optional(v.string()),
        mutedConversations: v.array(v.id("conversations")),
    }).index("by_userId", ["userId"]),

    // User stories/status updates
    stories: defineTable({
        userId: v.id("users"),
        type: v.union(v.literal("text"), v.literal("image"), v.literal("video")),
        content: v.array(v.string()), // [storageId/text, caption]
        backgroundColor: v.optional(v.string()),
        textColor: v.optional(v.string()),
        createdAt: v.number(),
        expiresAt: v.number(), // 24 hours from creation
        viewers: v.array(v.id("users")),
    }).index("by_userId", ["userId"]).index("by_expiresAt", ["expiresAt"]).index("by_userId_expiresAt", ["userId", "expiresAt"]),

    // Story views tracking
    storyViews: defineTable({
        storyId: v.id("stories"),
        viewerId: v.id("users"),
        viewedAt: v.number(),
    }).index("by_storyId", ["storyId"]).index("by_viewerId", ["viewerId"]).index("by_story_viewer", ["storyId", "viewerId"]),

    // Support tickets
    supportTickets: defineTable({
        userId: v.id("users"),
        subject: v.string(),
        description: v.string(),
        status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved"), v.literal("closed")),
        priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_userId", ["userId"]).index("by_status", ["status"]).index("by_createdAt", ["createdAt"]),

    // Ticket replies
    ticketReplies: defineTable({
        ticketId: v.id("supportTickets"),
        userId: v.id("users"),
        message: v.string(),
        isAdminReply: v.boolean(),
        createdAt: v.number(),
    }).index("by_ticketId", ["ticketId"]).index("by_userId", ["userId"]),

})