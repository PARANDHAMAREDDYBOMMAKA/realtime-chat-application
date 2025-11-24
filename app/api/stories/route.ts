import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { userCache } from '@/lib/redis';
import { getAuthenticatedConvexClient } from '@/lib/convex/serverClient';
import { api } from '@/convex/_generated/api';
import { cacheService, CacheKeys, CacheTTL } from '@/lib/redis/cacheService';

/**
 * @swagger
 * /api/stories:
 *   get:
 *     summary: Get friends' stories
 *     description: Retrieves stories from user's friends with Redis caching (TTL 24 hours)
 *     tags:
 *       - Stories
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: Stories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   userName:
 *                     type: string
 *                   userImage:
 *                     type: string
 *                   content:
 *                     type: string
 *                     description: Story media URL
 *                   type:
 *                     type: string
 *                     enum: [image, video]
 *                   createdAt:
 *                     type: number
 *                   expiresAt:
 *                     type: number
 *                   views:
 *                     type: array
 *                     items:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
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

    // Cache stories feed
    const cacheKey = CacheKeys.storyFeed(user._id);
    const stories = await cacheService.getOrSet(
      cacheKey,
      async () => {
        return await convex.query(api.stories.getFriendsStories, {
          limit: 20, // Use pagination
        });
      },
      CacheTTL.STORY_FEED
    );

    return NextResponse.json(stories);
  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
