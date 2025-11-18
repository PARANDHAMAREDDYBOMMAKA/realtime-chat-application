import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { presenceCache } from '@/lib/redis';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET /api/presence/[userId]
 *
 * Get user's online status with Redis caching
 * Cache TTL: 45 seconds
 */
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Cache presence status for 45 seconds
    const status = await presenceCache.getStatus(params.userId, async () => {
      return await convex.query(api.presence.getUserStatus, {
        userId: params.userId,
      });
    });

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching presence:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
