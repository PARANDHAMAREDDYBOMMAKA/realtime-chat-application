import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { unreadCache, userCache } from '@/lib/redis';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET /api/unread/[conversationId]
 *
 * Get unread count for a conversation
 * No expiry - manually invalidated on read/new message
 */
export async function GET(
  request: Request,
  { params }: { params: { conversationId: string } }
) {
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

    // Get unread count from Redis
    const count = await unreadCache.getCount(user._id, params.conversationId);

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/unread/[conversationId]
 *
 * Mark messages as read (reset unread count)
 */
export async function POST(
  request: Request,
  { params }: { params: { conversationId: string } }
) {
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

    // Reset unread count
    await unreadCache.reset(user._id, params.conversationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
