/**
 * Redis Cache Library - Main Entry Point
 *
 * Import from this file to use Redis caching in your application.
 *
 * Example usage:
 * ```typescript
 * import { userCache, messageCache, cacheService } from '@/lib/redis';
 * ```
 */

// Core Redis client
export { default as redisClient } from './client';

// Cache service with low-level operations
export { cacheService, CacheTTL, CacheKeys } from './cacheService';

// High-level cache wrappers for Convex queries
export {
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
  linkPreviewCache,
  supportCache,
  callCache,
} from './convexCache';

// Cache invalidation helpers
export {
  invalidateUserCaches,
  invalidateConversationCaches,
  invalidateMessageCaches,
  invalidateFriendCaches,
  invalidatePresenceCaches,
  invalidateStoryCaches,
  invalidateRoomCaches,
  invalidateSearchCaches,
  invalidateSupportCaches,
  invalidateCallCaches,
  batchInvalidation,
} from './cacheInvalidation';
