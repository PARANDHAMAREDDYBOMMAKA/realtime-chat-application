import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getAuthenticatedConvexClient } from '@/lib/convex/serverClient';
import { api } from '@/convex/_generated/api';
import { cacheService, CacheKeys, CacheTTL } from '@/lib/redis/cacheService';


/**
 * GET /api/reactions/[messageId]
 *
 * Get message reactions with Redis caching
 * Cache TTL: 1 week
 */
export async function GET(
  request: Request,
  { params }: { params: { messageId: string } }
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
    const { messageId } = params;

    // Cache message reactions
    const cacheKey = CacheKeys.messageReactions(messageId);
    const reactions = await cacheService.getOrSet(
      cacheKey,
      async () => {
        return await convex.query(api.reactions.getMessageReactions, {
          messageId: messageId as any,
        });
      },
      CacheTTL.MESSAGE_REACTIONS
    );

    return NextResponse.json(reactions);
  } catch (error) {
    console.error('Error fetching reactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
