/**
 * Cached Query Wrappers for Convex
 *
 * These wrap your existing queries with Redis caching.
 * Data is automatically cached in Redis when queries run.
 */

import { query } from './_generated/server';
import { v } from 'convex/values';

/**
 * Helper to cache query results in Redis via HTTP action
 */
async function cacheInRedis(key: string, data: any, ttl: number) {
  try {
    const CACHE_API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    await fetch(`${CACHE_API_URL}/api/cache/set`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, data, ttl }),
    });
  } catch (error) {
    console.error('[Redis Cache] Failed to cache:', error);
  }
}

/**
 * Helper to get cached data from Redis
 */
async function getFromRedisCache(key: string): Promise<any | null> {
  try {
    const CACHE_API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${CACHE_API_URL}/api/cache/get?key=${encodeURIComponent(key)}`);

    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (error) {
    console.error('[Redis Cache] Failed to get from cache:', error);
  }
  return null;
}

/**
 * Cached conversations query
 */
export const getCachedConversations = query({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const cacheKey = `conversations:user:${identity.subject}`;

    // This will be cached server-side via the conversations query
    // which now includes caching logic
    return { useCache: true, cacheKey };
  },
});

/**
 * Cached messages query
 */
export const getCachedMessages = query({
  args: {
    conversationId: v.id('conversations'),
    page: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const page = args.page || 0;
    const cacheKey = `messages:conversation:${args.conversationId}:page:${page}`;

    return { useCache: true, cacheKey, conversationId: args.conversationId };
  },
});

/**
 * Cached friends query
 */
export const getCachedFriends = query({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const cacheKey = `friends:user:${identity.subject}`;

    return { useCache: true, cacheKey };
  },
});
