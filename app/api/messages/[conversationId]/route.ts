import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { messageCache } from '@/lib/redis';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET /api/messages/[conversationId]
 *
 * Get messages for a conversation with Redis caching
 * Cache TTL: 3 minutes for recent (page 0), 10 minutes for older pages
 * Query params: ?page=0 (optional, defaults to 0)
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0', 10);

    // Cache messages with pagination
    // Recent messages (page 0) have shorter TTL for freshness
    const messages = await messageCache.getMessages(
      params.conversationId,
      page,
      async () => {
        return await convex.query(api.messages.get, {
          id: params.conversationId,
        });
      }
    );

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
