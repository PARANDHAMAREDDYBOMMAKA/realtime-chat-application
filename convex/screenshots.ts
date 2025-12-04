import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserByClerjId } from "./_utils";

// Record a screenshot detection
export const recordScreenshot = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const currentUser = await getUserByClerjId({
      ctx,
      clerkId: identity.subject,
    });

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Check if user is a member of the conversation
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("memberId"), currentUser._id))
      .unique();

    if (!membership) {
      throw new Error("User is not a member of this conversation");
    }

    // Get other conversation members (to notify them)
    const otherMembers = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.neq(q.field("memberId"), currentUser._id))
      .collect();

    // Create a system message about screenshot
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: currentUser._id,
      type: "text",
      content: [`🔒 ${currentUser.username} took a screenshot`],
      createdAt: Date.now(),
    });

    return {
      success: true,
      messageId,
      notifiedUsers: otherMembers.length,
    };
  },
});

// Get screenshot events for a conversation
export const getConversationScreenshots = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const currentUser = await getUserByClerjId({
      ctx,
      clerkId: identity.subject,
    });

    if (!currentUser) {
      return [];
    }

    // Get all screenshot messages (contains the lock emoji)
    const allMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("type"), "text"))
      .order("desc")
      .take(200);

    // Filter for screenshot messages
    const screenshots = allMessages.filter(
      (msg) => msg.content[0]?.includes("🔒") && msg.content[0]?.includes("screenshot")
    );

    return screenshots.slice(0, 50);
  },
});
