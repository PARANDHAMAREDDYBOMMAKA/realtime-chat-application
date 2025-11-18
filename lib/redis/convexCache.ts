/**
 * Convex Cache Wrappers
 *
 * These functions provide caching layer for Convex queries.
 * Use these in your Next.js API routes or server components.
 */

import { cacheService, CacheKeys, CacheTTL } from './cacheService';

/**
 * User Profile Caching
 */
export const userCache = {
  /**
   * Get user by Clerk ID with caching
   */
  async getByClerkId(clerkId: string, fetchFn: () => Promise<any>) {
    const cacheKey = CacheKeys.userByClerkId(clerkId);
    return await cacheService.getOrSet(cacheKey, fetchFn, CacheTTL.USER_BY_CLERK_ID);
  },

  /**
   * Get user profile by user ID with caching
   */
  async getProfile(userId: string, fetchFn: () => Promise<any>) {
    const cacheKey = CacheKeys.userProfile(userId);
    return await cacheService.getOrSet(cacheKey, fetchFn, CacheTTL.USER_PROFILE);
  },

  /**
   * Invalidate user caches
   */
  async invalidate(userId: string, clerkId?: string) {
    const promises = [cacheService.delete(CacheKeys.userProfile(userId))];
    if (clerkId) {
      promises.push(cacheService.delete(CacheKeys.userByClerkId(clerkId)));
    }
    await Promise.all(promises);
  },
};

/**
 * Conversation Caching
 */
export const conversationCache = {
  /**
   * Get user's conversation list with caching
   */
  async getList(userId: string, fetchFn: () => Promise<any>) {
    const cacheKey = CacheKeys.conversations(userId);
    return await cacheService.getOrSet(cacheKey, fetchFn, CacheTTL.CONVERSATION_LIST);
  },

  /**
   * Get conversation details with caching
   */
  async getDetails(conversationId: string, fetchFn: () => Promise<any>) {
    const cacheKey = CacheKeys.conversation(conversationId);
    return await cacheService.getOrSet(cacheKey, fetchFn, CacheTTL.CONVERSATION_DETAILS);
  },

  /**
   * Get conversation members with caching
   */
  async getMembers(conversationId: string, fetchFn: () => Promise<any>) {
    const cacheKey = CacheKeys.conversationMembers(conversationId);
    return await cacheService.getOrSet(cacheKey, fetchFn, CacheTTL.CONVERSATION_DETAILS);
  },

  /**
   * Invalidate conversation caches
   */
  async invalidate(conversationId: string, memberIds?: string[]) {
    await cacheService.invalidateConversation(conversationId, memberIds);
  },

  /**
   * Invalidate user's conversation list
   */
  async invalidateUserList(userId: string) {
    await cacheService.delete(CacheKeys.conversations(userId));
  },
};

/**
 * Message Caching
 */
export const messageCache = {
  /**
   * Get messages with pagination caching
   */
  async getMessages(conversationId: string, page: number, fetchFn: () => Promise<any>) {
    const cacheKey = CacheKeys.messages(conversationId, page);
    // Recent messages (page 0) have shorter TTL
    const ttl = page === 0 ? CacheTTL.MESSAGES_RECENT : CacheTTL.MESSAGES_OLDER;
    return await cacheService.getOrSet(cacheKey, fetchFn, ttl);
  },

  /**
   * Get message reactions with caching
   */
  async getReactions(messageId: string, fetchFn: () => Promise<any>) {
    const cacheKey = CacheKeys.messageReactions(messageId);
    return await cacheService.getOrSet(cacheKey, fetchFn, CacheTTL.MESSAGE_REACTIONS);
  },

  /**
   * Invalidate message caches for a conversation
   */
  async invalidate(conversationId: string) {
    await cacheService.invalidateMessages(conversationId);
  },

  /**
   * Invalidate specific message reactions
   */
  async invalidateReactions(messageId: string) {
    await cacheService.delete(CacheKeys.messageReactions(messageId));
  },

  /**
   * Invalidate only the first page (recent messages)
   */
  async invalidateRecent(conversationId: string) {
    await cacheService.delete(CacheKeys.messages(conversationId, 0));
  },
};

/**
 * Friend List Caching
 */
export const friendCache = {
  /**
   * Get user's friend list with caching
   */
  async getList(userId: string, fetchFn: () => Promise<any>) {
    const cacheKey = CacheKeys.friends(userId);
    return await cacheService.getOrSet(cacheKey, fetchFn, CacheTTL.FRIEND_LIST);
  },

  /**
   * Get friend requests with caching
   */
  async getRequests(userId: string, fetchFn: () => Promise<any>) {
    const cacheKey = CacheKeys.friendRequests(userId);
    return await cacheService.getOrSet(cacheKey, fetchFn, CacheTTL.FRIEND_REQUESTS);
  },

  /**
   * Get friend request count with caching
   */
  async getRequestCount(userId: string, fetchFn: () => Promise<number>) {
    const cacheKey = CacheKeys.friendRequestCount(userId);
    return await cacheService.getOrSet(cacheKey, fetchFn, CacheTTL.FRIEND_REQUEST_COUNT);
  },

  /**
   * Invalidate friend caches
   */
  async invalidate(userId: string) {
    await Promise.all([
      cacheService.delete(CacheKeys.friends(userId)),
      cacheService.delete(CacheKeys.friendRequests(userId)),
      cacheService.delete(CacheKeys.friendRequestCount(userId)),
    ]);
  },

  /**
   * Invalidate for both users in a friendship
   */
  async invalidateBoth(userId1: string, userId2: string) {
    await Promise.all([this.invalidate(userId1), this.invalidate(userId2)]);
  },
};

/**
 * Presence/Online Status Caching
 */
export const presenceCache = {
  /**
   * Get user's online status with caching
   */
  async getStatus(userId: string, fetchFn: () => Promise<any>) {
    const cacheKey = CacheKeys.presence(userId);
    return await cacheService.getOrSet(cacheKey, fetchFn, CacheTTL.PRESENCE_STATUS);
  },

  /**
   * Get multiple users' status with batch caching
   */
  async getMultipleStatus(userIds: string[], fetchFn: () => Promise<any[]>) {
    const cacheKeys = CacheKeys.presenceBatch(userIds);
    const cached = await cacheService.mget<any>(cacheKeys);

    // Find which users need to be fetched
    const missingIndexes: number[] = [];
    cached.forEach((status, index) => {
      if (status === null) {
        missingIndexes.push(index);
      }
    });

    // If all cached, return
    if (missingIndexes.length === 0) {
      return cached as any[];
    }

    // Fetch missing users
    const freshData = await fetchFn();

    // Cache the fresh data
    const cacheEntries = freshData.map((status, index) => ({
      key: cacheKeys[index],
      value: status,
      ttl: CacheTTL.PRESENCE_STATUS,
    }));
    await cacheService.mset(cacheEntries);

    // Merge cached and fresh data
    const result = [...cached];
    missingIndexes.forEach((index) => {
      result[index] = freshData[index];
    });

    return result;
  },

  /**
   * Update user presence in cache
   */
  async updateStatus(userId: string, status: any) {
    const cacheKey = CacheKeys.presence(userId);
    await cacheService.set(cacheKey, status, CacheTTL.PRESENCE_STATUS);
  },

  /**
   * Invalidate user presence
   */
  async invalidate(userId: string) {
    await cacheService.delete(CacheKeys.presence(userId));
  },
};

/**
 * Typing Indicator Caching
 */
export const typingCache = {
  /**
   * Get typing users for a conversation
   */
  async getTypingUsers(conversationId: string, fetchFn: () => Promise<any>) {
    const cacheKey = CacheKeys.typingUsers(conversationId);
    return await cacheService.getOrSet(cacheKey, fetchFn, CacheTTL.TYPING_INDICATOR);
  },

  /**
   * Set typing users directly (for real-time updates)
   */
  async setTypingUsers(conversationId: string, typingUsers: any) {
    const cacheKey = CacheKeys.typingUsers(conversationId);
    await cacheService.set(cacheKey, typingUsers, CacheTTL.TYPING_INDICATOR);
  },

  /**
   * Invalidate typing cache
   */
  async invalidate(conversationId: string) {
    await cacheService.delete(CacheKeys.typingUsers(conversationId));
  },
};

/**
 * Unread Count Caching
 */
export const unreadCache = {
  /**
   * Get unread count for a conversation
   */
  async getCount(userId: string, conversationId: string): Promise<number> {
    const cacheKey = CacheKeys.unreadCount(userId, conversationId);
    const cached = await cacheService.get<number>(cacheKey);
    return cached ?? 0;
  },

  /**
   * Set unread count
   */
  async setCount(userId: string, conversationId: string, count: number) {
    const cacheKey = CacheKeys.unreadCount(userId, conversationId);
    await cacheService.set(cacheKey, count, CacheTTL.UNREAD_COUNT);
  },

  /**
   * Increment unread count (when new message arrives)
   */
  async increment(userId: string, conversationId: string) {
    const cacheKey = CacheKeys.unreadCount(userId, conversationId);
    const newCount = await cacheService.increment(cacheKey, 1);
    return newCount;
  },

  /**
   * Reset unread count (when user reads messages)
   */
  async reset(userId: string, conversationId: string) {
    const cacheKey = CacheKeys.unreadCount(userId, conversationId);
    await cacheService.set(cacheKey, 0, CacheTTL.UNREAD_COUNT);
  },

  /**
   * Get total unread count across all conversations
   */
  async getTotalCount(userId: string): Promise<number> {
    const cacheKey = CacheKeys.unreadTotal(userId);
    const cached = await cacheService.get<number>(cacheKey);
    return cached ?? 0;
  },

  /**
   * Update total unread count
   */
  async updateTotalCount(userId: string, count: number) {
    const cacheKey = CacheKeys.unreadTotal(userId);
    await cacheService.set(cacheKey, count, CacheTTL.UNREAD_COUNT);
  },
};

/**
 * Story Caching
 */
export const storyCache = {
  /**
   * Get user's story feed with caching
   */
  async getFeed(userId: string, fetchFn: () => Promise<any>) {
    const cacheKey = CacheKeys.storyFeed(userId);
    return await cacheService.getOrSet(cacheKey, fetchFn, CacheTTL.STORY_FEED);
  },

  /**
   * Get story views with caching
   */
  async getViews(storyId: string, fetchFn: () => Promise<any>) {
    const cacheKey = CacheKeys.storyViews(storyId);
    return await cacheService.getOrSet(cacheKey, fetchFn, CacheTTL.STORY_VIEWS);
  },

  /**
   * Invalidate story feed
   */
  async invalidateFeed(userId: string) {
    await cacheService.delete(CacheKeys.storyFeed(userId));
  },

  /**
   * Invalidate story views
   */
  async invalidateViews(storyId: string) {
    await cacheService.delete(CacheKeys.storyViews(storyId));
  },
};

/**
 * Room Caching
 */
export const roomCache = {
  /**
   * Get public rooms list with caching
   */
  async getPublicRooms(fetchFn: () => Promise<any>) {
    const cacheKey = CacheKeys.publicRooms();
    return await cacheService.getOrSet(cacheKey, fetchFn, CacheTTL.PUBLIC_ROOMS);
  },

  /**
   * Get room details with caching
   */
  async getDetails(roomId: string, fetchFn: () => Promise<any>) {
    const cacheKey = CacheKeys.roomDetails(roomId);
    return await cacheService.getOrSet(cacheKey, fetchFn, CacheTTL.ROOM_DETAILS);
  },

  /**
   * Get user's room list with caching
   */
  async getUserRooms(userId: string, fetchFn: () => Promise<any>) {
    const cacheKey = CacheKeys.roomList(userId);
    return await cacheService.getOrSet(cacheKey, fetchFn, CacheTTL.ROOM_LIST);
  },

  /**
   * Invalidate public rooms cache
   */
  async invalidatePublic() {
    await cacheService.delete(CacheKeys.publicRooms());
  },

  /**
   * Invalidate room details
   */
  async invalidateRoom(roomId: string) {
    await cacheService.delete(CacheKeys.roomDetails(roomId));
  },

  /**
   * Invalidate user's rooms
   */
  async invalidateUserRooms(userId: string) {
    await cacheService.delete(CacheKeys.roomList(userId));
  },
};

/**
 * Search Caching
 */
export const searchCache = {
  /**
   * Get search results with caching
   */
  async searchMessages(userId: string, query: string, conversationId: string | undefined, fetchFn: () => Promise<any>) {
    const cacheKey = CacheKeys.searchMessages(userId, query, conversationId);
    return await cacheService.getOrSet(cacheKey, fetchFn, CacheTTL.SEARCH_RESULTS);
  },

  /**
   * Invalidate all search caches for a user
   */
  async invalidate(userId: string) {
    await cacheService.deletePattern(`search:${userId}:*`);
  },
};

/**
 * Link Preview Caching
 */
export const linkPreviewCache = {
  /**
   * Get link preview with long-term caching
   */
  async getPreview(url: string, fetchFn: () => Promise<any>) {
    const cacheKey = CacheKeys.linkPreview(url);
    return await cacheService.getOrSet(cacheKey, fetchFn, CacheTTL.LINK_PREVIEW);
  },
};

/**
 * Support Ticket Caching
 */
export const supportCache = {
  /**
   * Get user's support tickets with caching
   */
  async getUserTickets(userId: string, fetchFn: () => Promise<any>) {
    const cacheKey = CacheKeys.supportTickets(userId);
    return await cacheService.getOrSet(cacheKey, fetchFn, CacheTTL.SUPPORT_TICKETS);
  },

  /**
   * Invalidate user's tickets
   */
  async invalidate(userId: string) {
    await cacheService.delete(CacheKeys.supportTickets(userId));
  },
};

/**
 * Call State Caching
 */
export const callCache = {
  /**
   * Get active call state with caching
   */
  async getActiveCall(conversationId: string, fetchFn: () => Promise<any>) {
    const cacheKey = CacheKeys.activeCall(conversationId);
    return await cacheService.getOrSet(cacheKey, fetchFn, CacheTTL.PRESENCE_STATUS);
  },

  /**
   * Invalidate call state
   */
  async invalidate(conversationId: string) {
    await cacheService.delete(CacheKeys.activeCall(conversationId));
  },
};
