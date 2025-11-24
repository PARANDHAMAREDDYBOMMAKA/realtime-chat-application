import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { userCache } from '@/lib/redis';
import { getAuthenticatedConvexClient } from '@/lib/convex/serverClient';
import { api } from '@/convex/_generated/api';

/**
 * @swagger
 * /api/user/current:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieves the authenticated user's profile information with Redis caching (TTL 10 minutes)
 *     tags:
 *       - User
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: User ID
 *                 username:
 *                   type: string
 *                   description: User's username
 *                 email:
 *                   type: string
 *                   description: User's email
 *                 imageUrl:
 *                   type: string
 *                   description: User's profile image URL
 *                 status:
 *                   type: string
 *                   enum: [online, offline, away]
 *                 lastSeen:
 *                   type: number
 *                   description: Last seen timestamp
 *       401:
 *         description: Unauthorized - User not authenticated
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

    // Use Redis cache with automatic fallback to Convex
    const user = await userCache.getByClerkId(clerkId, async () => {
      const convex = await getAuthenticatedConvexClient();
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
