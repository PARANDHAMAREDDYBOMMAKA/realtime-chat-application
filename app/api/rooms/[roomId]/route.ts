import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getAuthenticatedConvexClient } from '@/lib/convex/serverClient';
import { api } from '@/convex/_generated/api';
import { cacheService, CacheKeys, CacheTTL } from '@/lib/redis/cacheService';


/**
 * GET /api/rooms/[roomId]
 *
 * Get room details with Redis caching
 * Cache TTL: 1 week
 */
export async function GET(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const convex = await getAuthenticatedConvexClient();
    const { roomId } = params;

    // Cache room details
    const cacheKey = CacheKeys.roomDetails(roomId);
    const room = await cacheService.getOrSet(
      cacheKey,
      async () => {
        return await convex.query(api.rooms.getRoomDetails, {
          roomId: roomId as any,
        });
      },
      CacheTTL.ROOM_DETAILS
    );

    return NextResponse.json(room);
  } catch (error) {
    console.error('Error fetching room details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
