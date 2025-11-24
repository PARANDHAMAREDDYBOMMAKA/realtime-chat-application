import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { userCache } from '@/lib/redis';
import { getAuthenticatedConvexClient } from '@/lib/convex/serverClient';
import { api } from '@/convex/_generated/api';
import { cacheService, CacheKeys, CacheTTL } from '@/lib/redis/cacheService';


/**
 * GET /api/rooms
 *
 * Get user's rooms with Redis caching
 * Cache TTL: 1 week
 */
export async function GET(request: Request) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const convex = await getAuthenticatedConvexClient();

    // Get user from cache first
    const user = await userCache.getByClerkId(clerkId, async () => {
      return await convex.query(api.user.getCurrent);
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if requesting public rooms or user's rooms
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'user';

    if (type === 'public') {
      // Cache public rooms list
      const cacheKey = CacheKeys.publicRooms();
      const rooms = await cacheService.getOrSet(
        cacheKey,
        async () => {
          return await convex.query(api.rooms.getPublicRooms, {
            limit: 20,
          });
        },
        CacheTTL.PUBLIC_ROOMS
      );

      return NextResponse.json(rooms);
    } else {
      // Cache user's rooms list
      const cacheKey = CacheKeys.roomList(user._id);
      const rooms = await cacheService.getOrSet(
        cacheKey,
        async () => {
          return await convex.query(api.rooms.getRooms, {});
        },
        CacheTTL.ROOM_LIST
      );

      return NextResponse.json(rooms);
    }
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
