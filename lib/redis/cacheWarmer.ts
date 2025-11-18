/**
 * Cache Warming Utility
 *
 * Pre-populates Redis cache with frequently accessed data
 * Call this after user login to improve initial page load performance
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import {
  userCache,
  conversationCache,
  friendCache,
  presenceCache,
} from './convexCache';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Warm cache for a user after login
 */
export async function warmUserCache(clerkId: string) {
  try {
    console.log('[Cache Warmer] Starting cache warm for user:', clerkId);

    // 1. Warm user profile cache
    const user = await userCache.getByClerkId(clerkId, async () => {
      const userData = await convex.query(api.user.getCurrent);
      return userData;
    });

    if (!user) {
      console.warn('[Cache Warmer] User not found');
      return;
    }

    // 2. Warm conversation list cache
    await conversationCache.getList(user._id, async () => {
      return await convex.query(api.conversations.get);
    });

    // 3. Warm friend list cache
    await friendCache.getList(user._id, async () => {
      return await convex.query(api.friends.get);
    });

    // 4. Warm friend requests cache
    await friendCache.getRequests(user._id, async () => {
      return await convex.query(api.requests.get);
    });

    // 5. Warm presence status cache
    await presenceCache.getStatus(user._id, async () => {
      return await convex.query(api.presence.getUserStatus, {
        userId: user._id,
      });
    });

    console.log('[Cache Warmer] Cache warming completed successfully');
  } catch (error) {
    console.error('[Cache Warmer] Error warming cache:', error);
  }
}

/**
 * Warm cache for a specific conversation
 */
export async function warmConversationCache(conversationId: string) {
  try {
    const { conversationCache, messageCache } = await import('./convexCache');

    // Warm conversation details
    await conversationCache.getDetails(conversationId, async () => {
      return await convex.query(api.conversation.get, { id: conversationId });
    });

    // Warm recent messages (page 0)
    await messageCache.getMessages(conversationId, 0, async () => {
      return await convex.query(api.messages.get, { id: conversationId });
    });

    console.log('[Cache Warmer] Conversation cache warmed:', conversationId);
  } catch (error) {
    console.error('[Cache Warmer] Error warming conversation cache:', error);
  }
}

/**
 * Pre-warm multiple conversation caches in parallel
 */
export async function warmMultipleConversations(conversationIds: string[]) {
  await Promise.all(
    conversationIds.map((id) => warmConversationCache(id))
  );
}
