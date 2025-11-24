import { redisClient } from './client';

/**
 * Cache TTL strategies (in seconds)
 * Default: 1 week (604800 seconds)
 */
const ONE_WEEK = 604800; // 7 days in seconds

export const CacheTTL = {
  // User data - 1 week
  USER_PROFILE: ONE_WEEK,
  USER_BY_CLERK_ID: ONE_WEEK,

  // Conversations - 1 week
  CONVERSATION_LIST: ONE_WEEK,
  CONVERSATION_DETAILS: ONE_WEEK,

  // Messages - 1 week
  MESSAGES_RECENT: ONE_WEEK,
  MESSAGES_OLDER: ONE_WEEK,

  // Social relationships - 1 week
  FRIEND_LIST: ONE_WEEK,
  FRIEND_REQUESTS: ONE_WEEK,
  FRIEND_REQUEST_COUNT: ONE_WEEK,

  // Real-time features - very short TTL (keep these short for real-time accuracy)
  PRESENCE_STATUS: 45, // 45 seconds
  TYPING_INDICATOR: 5, // 5 seconds
  ONLINE_USERS: 60, // 1 minute

  // Counts and aggregations
  UNREAD_COUNT: 0, // No expiry, invalidate on read/new message
  MESSAGE_REACTIONS: ONE_WEEK,

  // Stories - short TTL, time-sensitive (24 hours max for stories)
  STORY_FEED: 86400, // 24 hours
  STORY_VIEWS: 86400, // 24 hours

  // Rooms
  ROOM_LIST: ONE_WEEK,
  ROOM_DETAILS: ONE_WEEK,
  PUBLIC_ROOMS: ONE_WEEK,

  // Search and misc
  SEARCH_RESULTS: ONE_WEEK,
  LINK_PREVIEW: ONE_WEEK,
  SUPPORT_TICKETS: ONE_WEEK,
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
      const client = redisClient.getClient();
      const data = await client.get(key);

      if (!data) {
        return null;
      }

      // Upstash Redis returns parsed JSON automatically for objects
      if (typeof data === 'string') {
        return JSON.parse(data) as T;
      }

      return data as T;
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
      const client = redisClient.getClient();
      const serialized = JSON.stringify(value);

      if (ttl && ttl > 0) {
        await client.setex(key, ttl, serialized);
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
      const client = redisClient.getClient();
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
      const client = redisClient.getClient();
      const keys = await client.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      await client.del(...keys);
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

      const client = redisClient.getClient();
      const values = await client.mget(...keys);

      return values.map((value: any) => {
        if (!value) return null;
        try {
          if (typeof value === 'string') {
            return JSON.parse(value) as T;
          }
          return value as T;
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
      const client = redisClient.getClient();

      // Group by TTL for batch operations
      const noTtlEntries = entries.filter((e) => !e.ttl || e.ttl === 0);
      const ttlEntries = entries.filter((e) => e.ttl && e.ttl > 0);

      // Set entries without TTL in batch
      if (noTtlEntries.length > 0) {
        const keyValueObj: Record<string, string> = {};
        noTtlEntries.forEach((entry) => {
          keyValueObj[entry.key] = JSON.stringify(entry.value);
        });
        await client.mset(keyValueObj);
      }

      // Set entries with TTL individually
      if (ttlEntries.length > 0) {
        await Promise.all(
          ttlEntries.map((entry) =>
            client.setex(entry.key, entry.ttl!, JSON.stringify(entry.value))
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
      const client = redisClient.getClient();
      return await client.incrby(key, amount);
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
      const client = redisClient.getClient();
      return await client.decrby(key, amount);
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
      const client = redisClient.getClient();
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
      const client = redisClient.getClient();
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
