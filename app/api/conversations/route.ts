import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { conversationCache, userCache } from '@/lib/redis';
import { getAuthenticatedConvexClient } from '@/lib/convex/serverClient';
import { api } from '@/convex/_generated/api';

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Get user's conversations
 *     description: Retrieves all conversations for the authenticated user with Redis caching (TTL 1 minute)
 *     tags:
 *       - Conversations
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   conversation:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       isGroup:
 *                         type: boolean
 *                       lastMessageId:
 *                         type: string
 *                   otherMember:
 *                     type: object
 *                     description: Other user in DM conversation
 *                     properties:
 *                       username:
 *                         type: string
 *                       imageUrl:
 *                         type: string
 *                   lastMessage:
 *                     type: object
 *                     properties:
 *                       content:
 *                         type: string
 *                       sender:
 *                         type: string
 *                       timestamp:
 *                         type: number
 *                   unreadCount:
 *                     type: number
 *                   userStatus:
 *                     type: string
 *                     enum: [online, offline, away]
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

    // Cache conversation list for 1 week
    const conversations = await conversationCache.getList(user._id, async () => {
      return await convex.query(api.conversations.get);
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
