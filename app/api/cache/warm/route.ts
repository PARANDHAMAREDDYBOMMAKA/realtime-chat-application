import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAuthenticatedConvexClient } from '@/lib/convex/serverClient';
import { api } from '@/convex/_generated/api';
import {
  userCache,
  conversationCache,
  friendCache,
  messageCache,
  presenceCache,
} from '@/lib/redis/convexCache';

/**
 * Cache warming endpoint
 * Pre-loads all critical data into Redis cache for optimal performance
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cache Warm] Starting comprehensive cache warming...');

    const convex = await getAuthenticatedConvexClient();

    // 1. Get user data and cache it
    const user = await userCache.getByClerkId(clerkUserId, async () => {
      return await convex.query(api.user.getCurrent);
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Warm all critical caches in parallel
    await Promise.all([
      // Conversations list
      conversationCache.getList(user._id, async () => {
        return await convex.query(api.conversations.get);
      }),

      // Friends list
      friendCache.getList(user._id, async () => {
        return await convex.query(api.friends.get);
      }),

      // Friend requests
      friendCache.getRequests(user._id, async () => {
        return await convex.query(api.requests.get);
      }),

      // User presence
      presenceCache.getStatus(user._id, async () => {
        return await convex.query(api.presence.getUserStatus, {
          userId: user._id,
        });
      }),

      // Stories
      (async () => {
        const { cacheService, CacheKeys, CacheTTL } = await import('@/lib/redis/cacheService');
        return await cacheService.getOrSet(
          CacheKeys.storyFeed(user._id),
          async () => await convex.query(api.stories.getFriendsStories, { limit: 20 }),
          CacheTTL.STORY_FEED
        );
      })(),

      // Rooms
      (async () => {
        const { cacheService, CacheKeys, CacheTTL } = await import('@/lib/redis/cacheService');
        return await cacheService.getOrSet(
          CacheKeys.roomList(user._id),
          async () => await convex.query(api.rooms.getRooms, {}),
          CacheTTL.ROOM_LIST
        );
      })(),

      // Support tickets
      (async () => {
        const { cacheService, CacheKeys, CacheTTL } = await import('@/lib/redis/cacheService');
        return await cacheService.getOrSet(
          CacheKeys.supportTickets(user._id),
          async () => await convex.query(api.support.getUserTickets),
          CacheTTL.SUPPORT_TICKETS
        );
      })(),
    ]);

    // 3. Get conversation list to warm individual conversation caches
    const conversations = await conversationCache.getList(user._id, async () => {
      return await convex.query(api.conversations.get);
    });

    // 4. Warm recent messages for top 5 conversations
    if (conversations && Array.isArray(conversations)) {
      const topConversations = conversations.slice(0, 5);
      await Promise.all(
        topConversations.map(async (conv: any) => {
          try {
            await messageCache.getMessages(conv.conversation._id, 0, async () => {
              return await convex.query(api.messages.get, {
                id: conv.conversation._id,
                limit: 50,
              });
            });
          } catch (error) {
            console.error('[Cache Warm] Error warming conversation:', error);
          }
        })
      );
    }

    console.log('[Cache Warm] Cache warming completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Cache warmed successfully',
      itemsCached: {
        user: true,
        conversations: true,
        friends: true,
        requests: true,
        presence: true,
        stories: true,
        rooms: true,
        supportTickets: true,
        messages: conversations?.length || 0,
      },
    });
  } catch (error) {
    console.error('[Cache Warm] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to warm cache',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
