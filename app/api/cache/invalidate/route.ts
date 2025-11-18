import { NextResponse } from 'next/server';
import {
  invalidateUserCaches,
  invalidateConversationCaches,
  invalidateMessageCaches,
  invalidateFriendCaches,
  invalidatePresenceCaches,
  invalidateStoryCaches,
  invalidateRoomCaches,
} from '@/lib/redis';

/**
 * POST /api/cache/invalidate
 *
 * Webhook to invalidate caches after mutations
 *
 * Body examples:
 * - Message sent: { type: 'message.sent', conversationId, memberIds, senderId }
 * - Message read: { type: 'message.read', userId, conversationId }
 * - Friend request: { type: 'friend.request', senderId, receiverId }
 * - Profile update: { type: 'user.update', userId, clerkId }
 * - Conversation update: { type: 'conversation.update', conversationId, memberIds }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    switch (type) {
      // Message events
      case 'message.sent':
        await invalidateMessageCaches.onMessageSent(
          data.conversationId,
          data.memberIds,
          data.senderId
        );
        break;

      case 'message.read':
        await invalidateMessageCaches.onMessagesRead(
          data.userId,
          data.conversationId
        );
        break;

      case 'message.edit':
        await invalidateMessageCaches.onMessageEdit(
          data.messageId,
          data.conversationId
        );
        break;

      case 'message.delete':
        await invalidateMessageCaches.onMessageDelete(
          data.messageId,
          data.conversationId,
          data.memberIds
        );
        break;

      case 'reaction.change':
        await invalidateMessageCaches.onReactionChange(data.messageId);
        break;

      // Friend events
      case 'friend.request.sent':
        await invalidateFriendCaches.onRequestSent(
          data.senderId,
          data.receiverId
        );
        break;

      case 'friend.request.accepted':
        await invalidateFriendCaches.onRequestAccepted(
          data.userId1,
          data.userId2
        );
        break;

      case 'friend.request.rejected':
        await invalidateFriendCaches.onRequestRejected(
          data.userId1,
          data.userId2
        );
        break;

      case 'friend.removed':
        await invalidateFriendCaches.onFriendRemoved(
          data.userId1,
          data.userId2
        );
        break;

      // User events
      case 'user.update':
        await invalidateUserCaches.onProfileUpdate(data.userId, data.clerkId);
        break;

      case 'user.status.change':
        await invalidateUserCaches.onStatusChange(data.userId);
        break;

      // Conversation events
      case 'conversation.created':
        await invalidateConversationCaches.onCreate(
          data.conversationId,
          data.memberIds
        );
        break;

      case 'conversation.updated':
        await invalidateConversationCaches.onUpdate(
          data.conversationId,
          data.memberIds
        );
        break;

      case 'conversation.member.change':
        await invalidateConversationCaches.onMemberChange(
          data.conversationId,
          data.memberIds
        );
        break;

      case 'conversation.deleted':
        await invalidateConversationCaches.onDelete(
          data.conversationId,
          data.memberIds
        );
        break;

      // Presence events
      case 'presence.heartbeat':
        await invalidatePresenceCaches.onHeartbeat(data.userId);
        break;

      case 'presence.offline':
        await invalidatePresenceCaches.onUserOffline(data.userId);
        break;

      case 'typing.change':
        await invalidatePresenceCaches.onTypingChange(
          data.conversationId,
          data.typingUsers
        );
        break;

      // Story events
      case 'story.created':
        await invalidateStoryCaches.onStoryCreated(
          data.userId,
          data.friendIds
        );
        break;

      case 'story.viewed':
        await invalidateStoryCaches.onStoryViewed(data.storyId);
        break;

      case 'story.deleted':
        await invalidateStoryCaches.onStoryDeleted(
          data.userId,
          data.friendIds
        );
        break;

      // Room events
      case 'room.created':
        await invalidateRoomCaches.onCreate(
          data.roomId,
          data.ownerId,
          data.isPublic
        );
        break;

      case 'room.updated':
        await invalidateRoomCaches.onUpdate(data.roomId, data.isPublic);
        break;

      case 'room.user.join':
        await invalidateRoomCaches.onUserJoin(
          data.roomId,
          data.userId,
          data.isPublic
        );
        break;

      case 'room.user.leave':
        await invalidateRoomCaches.onUserLeave(
          data.roomId,
          data.userId,
          data.isPublic
        );
        break;

      case 'room.deleted':
        await invalidateRoomCaches.onDelete(
          data.roomId,
          data.memberIds,
          data.isPublic
        );
        break;

      default:
        console.warn('Unknown cache invalidation type:', type);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
