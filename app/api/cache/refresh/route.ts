import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAuthenticatedConvexClient } from '@/lib/convex/serverClient';
import { api } from '@/convex/_generated/api';
import {
  userCache,
  conversationCache,
  friendCache,
  presenceCache,
} from '@/lib/redis/convexCache';

/**
 * Cache refresh endpoint
 * Invalidates and refreshes critical real-time data when app becomes visible
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cache Refresh] Refreshing critical cache data...');

    const convex = await getAuthenticatedConvexClient();

    // 1. Get user data
    const user = await userCache.getByClerkId(clerkUserId, async () => {
      return await convex.query(api.user.getCurrent);
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Invalidate and refresh critical real-time data
    await Promise.all([
      // Refresh conversations (invalidate and fetch fresh)
      (async () => {
        await conversationCache.invalidateUserList(user._id);
        return await conversationCache.getList(user._id, async () => {
          return await convex.query(api.conversations.get);
        });
      })(),

      // Refresh friend requests
      (async () => {
        await friendCache.invalidateRequests(user._id);
        return await friendCache.getRequests(user._id, async () => {
          return await convex.query(api.requests.get);
        });
      })(),

      // Refresh presence
      presenceCache.getStatus(user._id, async () => {
        return await convex.query(api.presence.getUserStatus, {
          userId: user._id,
        });
      }),
    ]);

    console.log('[Cache Refresh] Cache refreshed successfully');

    return NextResponse.json({
      success: true,
      message: 'Cache refreshed successfully',
    });
  } catch (error) {
    console.error('[Cache Refresh] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to refresh cache',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
