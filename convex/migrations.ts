import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Migration to add creatorId and isAdmin fields to existing groups
 * Run this once to migrate existing groups to the new schema
 */
export const migrateExistingGroups = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all group conversations
    const conversations = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("isGroup"), true))
      .collect();

    let updatedConversations = 0;
    let updatedMembers = 0;

    for (const conversation of conversations) {
      // If conversation doesn't have a creatorId, set the first member as creator
      if (!conversation.creatorId) {
        const members = await ctx.db
          .query("conversationMembers")
          .withIndex("by_conversationId", (q) =>
            q.eq("conversationId", conversation._id)
          )
          .collect();

        if (members.length > 0) {
          // Set the first member as the creator
          const firstMember = members[0];
          await ctx.db.patch(conversation._id, {
            creatorId: firstMember.memberId,
          });
          updatedConversations++;

          // Update all members to have isAdmin field
          for (const member of members) {
            if (member.isAdmin === undefined) {
              await ctx.db.patch(member._id, {
                isAdmin: member.memberId === firstMember.memberId, // First member becomes admin
              });
              updatedMembers++;
            }
          }
        }
      } else {
        // If creatorId exists but members don't have isAdmin, update them
        const members = await ctx.db
          .query("conversationMembers")
          .withIndex("by_conversationId", (q) =>
            q.eq("conversationId", conversation._id)
          )
          .collect();

        for (const member of members) {
          if (member.isAdmin === undefined) {
            await ctx.db.patch(member._id, {
              isAdmin: member.memberId === conversation.creatorId,
            });
            updatedMembers++;
          }
        }
      }
    }

    return {
      success: true,
      updatedConversations,
      updatedMembers,
    };
  },
});
