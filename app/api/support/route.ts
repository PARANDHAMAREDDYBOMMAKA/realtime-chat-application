import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { userCache } from '@/lib/redis';
import { getAuthenticatedConvexClient } from '@/lib/convex/serverClient';
import { api } from '@/convex/_generated/api';
import { cacheService, CacheKeys, CacheTTL } from '@/lib/redis/cacheService';


/**
 * @swagger
 * /api/support:
 *   get:
 *     summary: Get support tickets
 *     description: Retrieves all support tickets for the authenticated user with Redis caching (TTL 1 week)
 *     tags:
 *       - Support
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: Support tickets retrieved successfully
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
 *                   subject:
 *                     type: string
 *                   description:
 *                     type: string
 *                   status:
 *                     type: string
 *                     enum: [open, in_progress, closed]
 *                   priority:
 *                     type: string
 *                     enum: [low, medium, high, urgent]
 *                   createdAt:
 *                     type: number
 *                   updatedAt:
 *                     type: number
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

    // Cache support tickets
    const cacheKey = CacheKeys.supportTickets(user._id);
    const tickets = await cacheService.getOrSet(
      cacheKey,
      async () => {
        return await convex.query(api.support.getUserTickets);
      },
      CacheTTL.SUPPORT_TICKETS
    );

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
