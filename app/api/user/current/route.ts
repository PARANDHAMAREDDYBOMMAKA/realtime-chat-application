import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { userCache } from '@/lib/redis';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET /api/user/current
 *
 * Get current user profile with Redis caching
 * Cache TTL: 10 minutes
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

    // Use Redis cache with automatic fallback to Convex
    const user = await userCache.getByClerkId(clerkId, async () => {
      const userData = await convex.query(api.user.getCurrent);
      return userData;
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
