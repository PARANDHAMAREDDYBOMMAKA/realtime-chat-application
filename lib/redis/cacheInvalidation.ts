/**
 * Cache Invalidation Helpers
 *
 * Call these functions after Convex mutations to invalidate relevant caches.
 * Import and use in your Convex mutation functions or API routes.
 */

import {
  userCache,
  conversationCache,
  messageCache,
  friendCache,
  presenceCache,
  typingCache,
  unreadCache,
  storyCache,
  roomCache,
  searchCache,
  supportCache,
  callCache,
} from './convexCache';

/**
 * User-related cache invalidation
 */
export const invalidateUserCaches = {
  /**
   * Call when user profile is updated
   */
  async onProfileUpdate(userId: string, clerkId?: string) {
    await Promise.all([
      userCache.invalidate(userId, clerkId),
      presenceCache.invalidate(userId),
      // Also invalidate friend lists where this user appears
      // Note: This would require knowing all friends, so you may want to
      // invalidate selectively or use a different pattern
    ]);
  },

  /**
   * Call when user status changes
   */
  async onStatusChange(userId: string) {
    await presenceCache.invalidate(userId);
  },

  /**
   * Call when user is deleted
   */
  async onUserDelete(userId: string, clerkId?: string) {
    await userCache.invalidate(userId, clerkId);
    // Cascade deletion would happen here
  },
};

/**
 * Conversation-related cache invalidation
 */
export const invalidateConversationCaches = {
  /**
   * Call when a conversation is created
   */
  async onCreate(conversationId: string, memberIds: string[]) {
    // Invalidate conversation lists for all members
    await Promise.all(
      memberIds.map((memberId) => conversationCache.invalidateUserList(memberId))
    );
  },

  /**
   * Call when conversation details are updated (name, settings, etc.)
   */
  async onUpdate(conversationId: string, memberIds: string[]) {
    await conversationCache.invalidate(conversationId, memberIds);
    // Invalidate member lists too
    await Promise.all(
      memberIds.map((memberId) => conversationCache.invalidateUserList(memberId))
    );
  },

  /**
   * Call when a member joins or leaves
   */
  async onMemberChange(conversationId: string, allMemberIds: string[]) {
    await conversationCache.invalidate(conversationId, allMemberIds);
    await Promise.all(
      allMemberIds.map((memberId) => conversationCache.invalidateUserList(memberId))
    );
  },

  /**
   * Call when conversation is deleted
   */
  async onDelete(conversationId: string, memberIds: string[]) {
    await Promise.all([
      conversationCache.invalidate(conversationId, memberIds),
      messageCache.invalidate(conversationId),
      ...memberIds.map((memberId) => conversationCache.invalidateUserList(memberId)),
    ]);
  },
};

/**
 * Message-related cache invalidation
 */
export const invalidateMessageCaches = {
  /**
   * Call when a new message is sent
   */
  async onMessageSent(
    conversationId: string,
    memberIds: string[],
    senderId: string
  ) {
    await Promise.all([
      // Invalidate only recent messages (page 0) for performance
      messageCache.invalidateRecent(conversationId),
      // Invalidate conversation lists to show new last message
      ...memberIds.map((memberId) => conversationCache.invalidateUserList(memberId)),
      // Increment unread counts for all members except sender
      ...memberIds
        .filter((id) => id !== senderId)
        .map((id) => unreadCache.increment(id, conversationId)),
    ]);
  },

  /**
   * Call when a message is edited
   */
  async onMessageEdit(messageId: string, conversationId: string) {
    await Promise.all([
      messageCache.invalidate(conversationId),
      // If reactions exist, they'll be reloaded
    ]);
  },

  /**
   * Call when a message is deleted
   */
  async onMessageDelete(messageId: string, conversationId: string, memberIds: string[]) {
    await Promise.all([
      messageCache.invalidate(conversationId),
      messageCache.invalidateReactions(messageId),
      // Update conversation lists in case deleted message was the last one
      ...memberIds.map((memberId) => conversationCache.invalidateUserList(memberId)),
    ]);
  },

  /**
   * Call when a user reads messages (updates lastSeenMessage)
   */
  async onMessagesRead(userId: string, conversationId: string) {
    await Promise.all([
      unreadCache.reset(userId, conversationId),
      conversationCache.invalidateUserList(userId),
    ]);
  },

  /**
   * Call when a reaction is added or removed
   */
  async onReactionChange(messageId: string) {
    await messageCache.invalidateReactions(messageId);
  },
};

/**
 * Friend-related cache invalidation
 */
export const invalidateFriendCaches = {
  /**
   * Call when a friend request is sent
   */
  async onRequestSent(senderId: string, receiverId: string) {
    await Promise.all([
      friendCache.invalidate(senderId),
      friendCache.invalidate(receiverId),
    ]);
  },

  /**
   * Call when a friend request is accepted
   */
  async onRequestAccepted(userId1: string, userId2: string) {
    await Promise.all([
      friendCache.invalidateBoth(userId1, userId2),
      // Story feeds may change based on new friendship
      storyCache.invalidateFeed(userId1),
      storyCache.invalidateFeed(userId2),
    ]);
  },

  /**
   * Call when a friend request is rejected or canceled
   */
  async onRequestRejected(userId1: string, userId2: string) {
    await friendCache.invalidateBoth(userId1, userId2);
  },

  /**
   * Call when a friendship is removed
   */
  async onFriendRemoved(userId1: string, userId2: string) {
    await Promise.all([
      friendCache.invalidateBoth(userId1, userId2),
      storyCache.invalidateFeed(userId1),
      storyCache.invalidateFeed(userId2),
    ]);
  },
};

/**
 * Presence/Typing cache invalidation
 */
export const invalidatePresenceCaches = {
  /**
   * Call when user presence heartbeat updates
   */
  async onHeartbeat(userId: string) {
    await presenceCache.updateStatus(userId, {
      lastSeen: Date.now(),
      isOnline: true,
    });
  },

  /**
   * Call when user goes offline
   */
  async onUserOffline(userId: string) {
    await presenceCache.invalidate(userId);
  },

  /**
   * Call when typing indicator changes
   */
  async onTypingChange(conversationId: string, typingUsers: any[]) {
    await typingCache.setTypingUsers(conversationId, typingUsers);
  },
};

/**
 * Story-related cache invalidation
 */
export const invalidateStoryCaches = {
  /**
   * Call when a new story is posted
   */
  async onStoryCreated(userId: string, friendIds: string[]) {
    // Invalidate the creator's feed
    await storyCache.invalidateFeed(userId);
    // Invalidate all friends' feeds
    await Promise.all(friendIds.map((friendId) => storyCache.invalidateFeed(friendId)));
  },

  /**
   * Call when a story is viewed
   */
  async onStoryViewed(storyId: string) {
    await storyCache.invalidateViews(storyId);
  },

  /**
   * Call when a story expires or is deleted
   */
  async onStoryDeleted(userId: string, friendIds: string[]) {
    await storyCache.invalidateFeed(userId);
    await Promise.all(friendIds.map((friendId) => storyCache.invalidateFeed(friendId)));
  },
};

/**
 * Room-related cache invalidation
 */
export const invalidateRoomCaches = {
  /**
   * Call when a room is created
   */
  async onCreate(roomId: string, ownerId: string, isPublic: boolean) {
    await roomCache.invalidateUserRooms(ownerId);
    if (isPublic) {
      await roomCache.invalidatePublic();
    }
  },

  /**
   * Call when room details are updated
   */
  async onUpdate(roomId: string, isPublic: boolean) {
    await roomCache.invalidateRoom(roomId);
    if (isPublic) {
      await roomCache.invalidatePublic();
    }
  },

  /**
   * Call when a user joins a room
   */
  async onUserJoin(roomId: string, userId: string, isPublic: boolean) {
    await Promise.all([
      roomCache.invalidateRoom(roomId),
      roomCache.invalidateUserRooms(userId),
    ]);
    if (isPublic) {
      await roomCache.invalidatePublic();
    }
  },

  /**
   * Call when a user leaves a room
   */
  async onUserLeave(roomId: string, userId: string, isPublic: boolean) {
    await Promise.all([
      roomCache.invalidateRoom(roomId),
      roomCache.invalidateUserRooms(userId),
    ]);
    if (isPublic) {
      await roomCache.invalidatePublic();
    }
  },

  /**
   * Call when a room is deleted
   */
  async onDelete(roomId: string, memberIds: string[], isPublic: boolean) {
    await roomCache.invalidateRoom(roomId);
    await Promise.all(memberIds.map((id) => roomCache.invalidateUserRooms(id)));
    if (isPublic) {
      await roomCache.invalidatePublic();
    }
  },
};

/**
 * Search cache invalidation
 */
export const invalidateSearchCaches = {
  /**
   * Call when messages in a conversation change (invalidates related searches)
   */
  async onConversationMessagesChange(conversationId: string, memberIds: string[]) {
    // Invalidate search caches for all members
    await Promise.all(memberIds.map((memberId) => searchCache.invalidate(memberId)));
  },
};

/**
 * Support ticket cache invalidation
 */
export const invalidateSupportCaches = {
  /**
   * Call when a ticket is created or updated
   */
  async onTicketChange(userId: string) {
    await supportCache.invalidate(userId);
  },
};

/**
 * Call-related cache invalidation
 */
export const invalidateCallCaches = {
  /**
   * Call when a call is started
   */
  async onCallStart(conversationId: string) {
    await callCache.invalidate(conversationId);
  },

  /**
   * Call when a call ends
   */
  async onCallEnd(conversationId: string) {
    await callCache.invalidate(conversationId);
  },

  /**
   * Call when call status changes
   */
  async onCallStatusChange(conversationId: string) {
    await callCache.invalidate(conversationId);
  },
};

/**
 * Batch invalidation for complex operations
 */
export const batchInvalidation = {
  /**
   * Invalidate all caches for a user (nuclear option)
   */
  async invalidateAllUserCaches(userId: string, clerkId?: string) {
    await Promise.all([
      userCache.invalidate(userId, clerkId),
      conversationCache.invalidateUserList(userId),
      friendCache.invalidate(userId),
      presenceCache.invalidate(userId),
      storyCache.invalidateFeed(userId),
      roomCache.invalidateUserRooms(userId),
      searchCache.invalidate(userId),
      supportCache.invalidate(userId),
    ]);
  },

  /**
   * Invalidate all conversation-related caches (when major changes happen)
   */
  async invalidateAllConversationCaches(conversationId: string, memberIds: string[]) {
    await Promise.all([
      conversationCache.invalidate(conversationId, memberIds),
      messageCache.invalidate(conversationId),
      typingCache.invalidate(conversationId),
      callCache.invalidate(conversationId),
      ...memberIds.map((id) => conversationCache.invalidateUserList(id)),
      ...memberIds.map((id) => searchCache.invalidate(id)),
    ]);
  },
};
