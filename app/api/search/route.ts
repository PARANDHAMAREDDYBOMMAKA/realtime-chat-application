import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { userCache } from '@/lib/redis';
import { getAuthenticatedConvexClient } from '@/lib/convex/serverClient';
import { api } from '@/convex/_generated/api';
import { cacheService, CacheKeys, CacheTTL } from '@/lib/redis/cacheService';


/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search messages
 *     description: Search for messages across all conversations or within a specific conversation with Redis caching (TTL 1 week)
 *     tags:
 *       - Search
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *         example: "hello"
 *       - in: query
 *         name: conversationId
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional conversation ID to limit search
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   content:
 *                     type: string
 *                   senderId:
 *                     type: string
 *                   senderName:
 *                     type: string
 *                   conversationId:
 *                     type: string
 *                   createdAt:
 *                     type: number
 *                   type:
 *                     type: string
 *                     enum: [text, image, video, audio, file]
 *       400:
 *         description: Missing query parameter
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
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

    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const conversationId = url.searchParams.get('conversationId');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Cache search results
    const cacheKey = CacheKeys.searchMessages(user._id, query, conversationId || undefined);
    const results = await cacheService.getOrSet(
      cacheKey,
      async () => {
        return await convex.query(api.search.searchMessages, {
          query,
          conversationId: conversationId as any,
        });
      },
      CacheTTL.SEARCH_RESULTS
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
