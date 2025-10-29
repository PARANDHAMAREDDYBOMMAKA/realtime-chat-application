import { ConvexError } from "convex/values";
import { getUserByClerjId } from "./_utils";
import { query } from "./_generated/server";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const get = query({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    const currentUser = await getUserByClerjId({
      ctx,
      clerkId: identity.subject,
    });

    if (!currentUser) {
      throw new ConvexError("User not found");
    }

    const conversationMemberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_memberId", (q) => q.eq("memberId", currentUser._id))
      .collect();

    if (!conversationMemberships || conversationMemberships.length === 0) {
      return [];
    }

    const conversations = await Promise.all(
      conversationMemberships?.map(async (membership) => {
        const conversation = await ctx.db.get(membership.conversationId);

        if (!conversation) {
          throw new ConvexError("Conversation not found");
        }
        return conversation;
      })
    );

    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conversation, index) => {
        const allConversationMemberships = await ctx.db
          .query("conversationMembers")
          .withIndex("by_conversationId", (q) =>
            q.eq("conversationId", conversation?._id)
          )
          .collect();

        const lastMessage = await getLastMessageDetails({
          ctx,
          id: conversation.lastMessageId,
        });

        if (conversation.isGroup) {
          return { conversation, lastMessage };
        } else {
          const otherMembership = allConversationMemberships.filter(
            (membership) => membership.memberId !== currentUser._id
          )[0];

          const otherMember = await ctx.db.get(otherMembership.memberId);

          let userStatus: "online" | "offline" | "away" = "offline";
          if (otherMember) {
            const now = Date.now();
            const lastSeen = otherMember.lastSeen || 0;
            const timeDiff = now - lastSeen;

            if (timeDiff <= 5 * 60 * 1000) {
              userStatus = otherMember.status || "offline";
            } else if (timeDiff <= 10 * 60 * 1000) {
              userStatus = "away";
            }
          }

          return {
            conversation,
            otherMember,
            lastMessage,
            userStatus,
          };
        }
      })
    );

    const sortedConversations = conversationsWithDetails.sort((a, b) => {
      const timeA = a.lastMessage?.timestamp ?? 0;
      const timeB = b.lastMessage?.timestamp ?? 0;
      return timeB - timeA;
    });

    return sortedConversations;
  },
});

const getLastMessageDetails = async ({
  ctx,
  id,
}: {
  ctx: QueryCtx | MutationCtx;
  id: Id<"messages"> | undefined;
}) => {
  if (!id) return null;
  const message = await ctx.db.get(id);
  if (!message) return null;

  const sender = await ctx.db.get(message.senderId);
  if (!sender) return null;

  const content = getMessageContent(
    message.type,
    message.content as unknown as string
  );

  return {
    content,
    sender: sender.username,
    timestamp: message.createdAt ?? message._creationTime,
  };
};

const getMessageContent = (type: string, content: string) => {
  switch (type) {
    case "text":
      return content;
    default:
      return "[Non-text]";
  }
};
