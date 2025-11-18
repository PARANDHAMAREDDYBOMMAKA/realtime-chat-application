import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { friendCache, userCache } from '@/lib/redis';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET /api/friends
 *
 * Get user's friend list with Redis caching
 * Cache TTL: 5 minutes
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

    // Cache friend list for 5 minutes
    const friends = await friendCache.getList(user._id, async () => {
      return await convex.query(api.friends.get);
    });

    return NextResponse.json(friends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
