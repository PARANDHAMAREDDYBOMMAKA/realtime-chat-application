'use client';

import { useEffect } from 'react';
import { useConvexAuth, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

/**
 * Cache Provider
 *
 * Automatically caches frequently accessed data to Redis
 * when the user loads the application
 */
export function CacheProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useConvexAuth();

  // Fetch and cache conversations
  const conversations = useQuery(
    api.conversations.get,
    isAuthenticated ? {} : 'skip'
  );

  // Fetch and cache friends
  const friends = useQuery(
    api.friends.get,
    isAuthenticated ? {} : 'skip'
  );

  // Fetch and cache friend requests
  const requests = useQuery(
    api.requests.get,
    isAuthenticated ? {} : 'skip'
  );

  // Cache conversations in Redis when they load
  useEffect(() => {
    if (conversations && isAuthenticated) {
      cacheData('conversations:list', conversations, 60); // 1 minute TTL
      console.log('[Cache] Cached conversations:', conversations.length);
    }
  }, [conversations, isAuthenticated]);

  // Cache friends in Redis when they load
  useEffect(() => {
    if (friends && isAuthenticated) {
      cacheData('friends:list', friends, 300); // 5 minutes TTL
      console.log('[Cache] Cached friends:', friends.length);
    }
  }, [friends, isAuthenticated]);

  // Cache friend requests in Redis when they load
  useEffect(() => {
    if (requests && isAuthenticated) {
      cacheData('friend_requests:list', requests, 180); // 3 minutes TTL
      console.log('[Cache] Cached friend requests:', requests.length);
    }
  }, [requests, isAuthenticated]);

  return <>{children}</>;
}

/**
 * Helper to cache data in Redis via API
 */
async function cacheData(key: string, data: any, ttl: number) {
  try {
    await fetch('/api/cache/set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, data, ttl }),
    });
  } catch (error) {
    console.error('[Cache] Failed to cache:', key, error);
  }
}
