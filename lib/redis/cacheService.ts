import { redisClient } from './client';

/**
 * Cache TTL strategies (in seconds)
 */
export const CacheTTL = {
  // User data - moderate TTL, updated on profile changes
  USER_PROFILE: 300, // 5 minutes
  USER_BY_CLERK_ID: 600, // 10 minutes (clerk ID lookups are frequent)

  // Conversations - short TTL, updated frequently
  CONVERSATION_LIST: 60, // 1 minute
  CONVERSATION_DETAILS: 120, // 2 minutes

  // Messages - tiered caching
  MESSAGES_RECENT: 180, // 3 minutes for recent messages
  MESSAGES_OLDER: 600, // 10 minutes for older messages

  // Social relationships - moderate TTL
  FRIEND_LIST: 300, // 5 minutes
  FRIEND_REQUESTS: 180, // 3 minutes
  FRIEND_REQUEST_COUNT: 120, // 2 minutes

  // Real-time features - very short TTL
  PRESENCE_STATUS: 45, // 45 seconds
  TYPING_INDICATOR: 5, // 5 seconds
  ONLINE_USERS: 60, // 1 minute

  // Counts and aggregations
  UNREAD_COUNT: 0, // No expiry, invalidate on read/new message
  MESSAGE_REACTIONS: 180, // 3 minutes

  // Stories - short TTL, time-sensitive
  STORY_FEED: 90, // 1.5 minutes
  STORY_VIEWS: 120, // 2 minutes

  // Rooms
  ROOM_LIST: 300, // 5 minutes
  ROOM_DETAILS: 240, // 4 minutes
  PUBLIC_ROOMS: 600, // 10 minutes

  // Search and misc
  SEARCH_RESULTS: 300, // 5 minutes
  LINK_PREVIEW: 86400, // 24 hours
  SUPPORT_TICKETS: 180, // 3 minutes
} as const;

/**
 * Cache key builders - consistent key naming
 */
export const CacheKeys = {
  // User keys
  user: (userId: string) => `user:${userId}`,
  userByClerkId: (clerkId: string) => `user:clerkId:${clerkId}`,
  userProfile: (userId: string) => `user:profile:${userId}`,

  // Conversation keys
  conversations: (userId: string) => `conversations:user:${userId}`,
  conversation: (conversationId: string) => `conversation:${conversationId}`,
  conversationMembers: (conversationId: string) => `conversation:${conversationId}:members`,
  typingUsers: (conversationId: string) => `typing:conversation:${conversationId}`,

  // Message keys
  messages: (conversationId: string, page = 0) => `messages:conversation:${conversationId}:page:${page}`,
  messageReactions: (messageId: string) => `reactions:message:${messageId}`,

  // Friend keys
  friends: (userId: string) => `friends:user:${userId}`,
  friendRequests: (userId: string) => `requests:user:${userId}`,
  friendRequestCount: (userId: string) => `requests:count:user:${userId}`,

  // Presence keys
  presence: (userId: string) => `presence:user:${userId}`,
  presenceBatch: (userIds: string[]) => userIds.map(id => `presence:user:${id}`),
  onlineUsers: () => `presence:online:all`,

  // Unread count keys
  unreadCount: (userId: string, conversationId: string) => `unread:user:${userId}:conversation:${conversationId}`,
  unreadTotal: (userId: string) => `unread:user:${userId}:total`,

  // Story keys
  storyFeed: (userId: string) => `stories:user:${userId}:feed`,
  storyViews: (storyId: string) => `story:${storyId}:views`,

  // Room keys
  roomList: (userId: string) => `rooms:user:${userId}`,
  publicRooms: () => `rooms:public:list`,
  roomDetails: (roomId: string) => `room:${roomId}:details`,

  // Search keys
  searchMessages: (userId: string, query: string, conversationId?: string) =>
    `search:${userId}:${conversationId || 'all'}:${Buffer.from(query).toString('base64').slice(0, 32)}`,

  // Misc keys
  linkPreview: (url: string) => `linkpreview:${Buffer.from(url).toString('base64').slice(0, 50)}`,
  supportTickets: (userId: string) => `tickets:user:${userId}`,
  activeCall: (conversationId: string) => `call:conversation:${conversationId}:active`,
} as const;

/**
 * Main Cache Service
 */
class CacheService {
  /**
   * Get a cached value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = await redisClient.getClient();
      const data = await client.get(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a cached value with optional TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const client = await redisClient.getClient();
      const serialized = JSON.stringify(value);

      if (ttl && ttl > 0) {
        await client.setEx(key, ttl, serialized);
      } else {
        await client.set(key, serialized);
      }

      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete a cached value
   */
  async delete(key: string): Promise<boolean> {
    try {
      const client = await redisClient.getClient();
      await client.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const client = await redisClient.getClient();
      const keys = await client.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      await client.del(keys);
      return keys.length;
    } catch (error) {
      console.error(`Cache deletePattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Get multiple cached values
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (keys.length === 0) {
        return [];
      }

      const client = await redisClient.getClient();
      const values = await client.mGet(keys);

      return values.map((value) => {
        if (!value) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple cached values
   */
  async mset(entries: Array<{ key: string; value: any; ttl?: number }>): Promise<boolean> {
    try {
      const client = await redisClient.getClient();

      // Group by TTL for batch operations
      const noTtlEntries = entries.filter((e) => !e.ttl || e.ttl === 0);
      const ttlEntries = entries.filter((e) => e.ttl && e.ttl > 0);

      // Set entries without TTL in batch
      if (noTtlEntries.length > 0) {
        const keyValuePairs: string[] = [];
        noTtlEntries.forEach((entry) => {
          keyValuePairs.push(entry.key, JSON.stringify(entry.value));
        });
        await client.mSet(keyValuePairs);
      }

      // Set entries with TTL individually (Redis doesn't support batch setEx)
      if (ttlEntries.length > 0) {
        await Promise.all(
          ttlEntries.map((entry) =>
            client.setEx(entry.key, entry.ttl!, JSON.stringify(entry.value))
          )
        );
      }

      return true;
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }

  /**
   * Increment a numeric value
   */
  async increment(key: string, amount = 1): Promise<number> {
    try {
      const client = await redisClient.getClient();
      return await client.incrBy(key, amount);
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Decrement a numeric value
   */
  async decrement(key: string, amount = 1): Promise<number> {
    try {
      const client = await redisClient.getClient();
      return await client.decrBy(key, amount);
    } catch (error) {
      console.error(`Cache decrement error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const client = await redisClient.getClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set expiration time for a key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const client = await redisClient.getClient();
      await client.expire(key, ttl);
      return true;
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const fresh = await fetchFn();

    // Cache the result
    await this.set(key, fresh, ttl);

    return fresh;
  }

  /**
   * Invalidate all caches for a user
   */
  async invalidateUser(userId: string): Promise<void> {
    await Promise.all([
      this.delete(CacheKeys.user(userId)),
      this.delete(CacheKeys.userProfile(userId)),
      this.delete(CacheKeys.conversations(userId)),
      this.delete(CacheKeys.friends(userId)),
      this.delete(CacheKeys.friendRequests(userId)),
      this.delete(CacheKeys.friendRequestCount(userId)),
      this.delete(CacheKeys.presence(userId)),
      this.delete(CacheKeys.storyFeed(userId)),
      this.deletePattern(`unread:user:${userId}:*`),
      this.deletePattern(`search:${userId}:*`),
    ]);
  }

  /**
   * Invalidate conversation-related caches
   */
  async invalidateConversation(conversationId: string, memberIds?: string[]): Promise<void> {
    const deletePromises = [
      this.delete(CacheKeys.conversation(conversationId)),
      this.delete(CacheKeys.conversationMembers(conversationId)),
      this.delete(CacheKeys.typingUsers(conversationId)),
      this.deletePattern(`messages:conversation:${conversationId}:*`),
    ];

    // Invalidate conversation lists for all members
    if (memberIds && memberIds.length > 0) {
      memberIds.forEach((memberId) => {
        deletePromises.push(this.delete(CacheKeys.conversations(memberId)));
      });
    }

    await Promise.all(deletePromises);
  }

  /**
   * Invalidate message caches
   */
  async invalidateMessages(conversationId: string): Promise<void> {
    await this.deletePattern(`messages:conversation:${conversationId}:*`);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    return await redisClient.ping();
  }
}

export const cacheService = new CacheService();
export default cacheService;
