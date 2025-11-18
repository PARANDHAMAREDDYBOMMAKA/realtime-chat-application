import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { friendCache, userCache } from '@/lib/redis';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET /api/friends/requests
 *
 * Get user's friend requests with Redis caching
 * Cache TTL: 3 minutes
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from cache
    const user = await userCache.getByClerkId(clerkId, async () => {
      return await convex.query(api.user.getCurrent);
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Cache friend requests
    const requests = await friendCache.getRequests(user._id, async () => {
      return await convex.query(api.requests.get);
    });

    // Cache request count
    const count = await friendCache.getRequestCount(user._id, async () => {
      return await convex.query(api.requests.count);
    });

    return NextResponse.json({ requests, count });
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
