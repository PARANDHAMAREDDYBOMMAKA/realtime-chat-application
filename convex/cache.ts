import { action } from './_generated/server';
import { v } from 'convex/values';

/**
 * Cache Invalidation Actions
 *
 * These actions are called from mutations to invalidate Redis cache.
 * They make HTTP requests to the cache invalidation API.
 */

const CACHE_API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Generic cache invalidation function
 */
async function invalidateCache(type: string, data: any) {
  try {
    const response = await fetch(`${CACHE_API_URL}/api/cache/invalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, ...data }),
    });

    if (!response.ok) {
      console.error('Cache invalidation failed:', await response.text());
    }
  } catch (error) {
    // Don't throw - cache invalidation failures shouldn't break the app
    console.error('Cache invalidation error:', error);
  }
}

/**
 * Invalidate message caches when a message is sent
 */
export const invalidateOnMessageSent = action({
  args: {
    conversationId: v.id('conversations'),
    memberIds: v.array(v.id('users')),
    senderId: v.id('users'),
  },
  handler: async (ctx, args) => {
    await invalidateCache('message.sent', args);
  },
});

/**
 * Invalidate when messages are read
 */
export const invalidateOnMessageRead = action({
  args: {
    userId: v.id('users'),
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    await invalidateCache('message.read', args);
  },
});

/**
 * Invalidate when a friend request is sent
 */
export const invalidateOnFriendRequest = action({
  args: {
    senderId: v.id('users'),
    receiverId: v.id('users'),
  },
  handler: async (ctx, args) => {
    await invalidateCache('friend.request.sent', args);
  },
});

/**
 * Invalidate when a friend request is accepted
 */
export const invalidateOnFriendAccepted = action({
  args: {
    userId1: v.id('users'),
    userId2: v.id('users'),
  },
  handler: async (ctx, args) => {
    await invalidateCache('friend.request.accepted', args);
  },
});

/**
 * Invalidate when user profile is updated
 */
export const invalidateOnUserUpdate = action({
  args: {
    userId: v.id('users'),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await invalidateCache('user.update', args);
  },
});

/**
 * Invalidate when a conversation is created
 */
export const invalidateOnConversationCreated = action({
  args: {
    conversationId: v.id('conversations'),
    memberIds: v.array(v.id('users')),
  },
  handler: async (ctx, args) => {
    await invalidateCache('conversation.created', args);
  },
});

/**
 * Invalidate when a conversation is updated
 */
export const invalidateOnConversationUpdated = action({
  args: {
    conversationId: v.id('conversations'),
    memberIds: v.array(v.id('users')),
  },
  handler: async (ctx, args) => {
    await invalidateCache('conversation.updated', args);
  },
});

/**
 * Invalidate when a story is created
 */
export const invalidateOnStoryCreated = action({
  args: {
    userId: v.id('users'),
    friendIds: v.array(v.id('users')),
  },
  handler: async (ctx, args) => {
    await invalidateCache('story.created', args);
  },
});

/**
 * Invalidate when presence/heartbeat updates
 */
export const invalidateOnPresenceUpdate = action({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    await invalidateCache('presence.heartbeat', args);
  },
});

/**
 * Invalidate when a reaction is added/removed
 */
export const invalidateOnReactionChange = action({
  args: {
    messageId: v.id('messages'),
  },
  handler: async (ctx, args) => {
    await invalidateCache('reaction.change', args);
  },
});
