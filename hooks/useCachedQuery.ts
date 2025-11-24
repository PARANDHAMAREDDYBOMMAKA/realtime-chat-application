"use client";

import { useQuery as useConvexQuery } from "convex/react";
import { FunctionReference } from "convex/server";
import useSWR from "swr";

/**
 * Custom hook that uses SWR for caching with API routes
 * Falls back to Convex useQuery for real-time updates
 */

const fetcher = (url: string) => fetch(url, {
  credentials: 'include',
}).then(res => {
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
});

type UseCachedQueryOptions = {
  /** Use cached API route (default: true) */
  useCache?: boolean;
  /** Refresh interval in milliseconds (default: 0 - no automatic refresh) */
  refreshInterval?: number;
  /** Dedupe requests within this interval (default: 2000ms) */
  dedupingInterval?: number;
};

/**
 * Use cached query - automatically routes through API with Redis cache
 */
export function useCachedConversations(options: UseCachedQueryOptions = {}) {
  const { useCache = true, refreshInterval = 0, dedupingInterval = 2000 } = options;

  return useSWR(
    useCache ? '/api/conversations' : null,
    fetcher,
    {
      refreshInterval,
      dedupingInterval,
      revalidateOnFocus: true, // Refresh when tab becomes active
      revalidateOnReconnect: true, // Refresh when network reconnects
    }
  );
}

/**
 * Use cached current user
 */
export function useCachedCurrentUser(options: UseCachedQueryOptions = {}) {
  const { useCache = true, refreshInterval = 0, dedupingInterval = 5000 } = options;

  return useSWR(
    useCache ? '/api/user/current' : null,
    fetcher,
    {
      refreshInterval,
      dedupingInterval,
      revalidateOnFocus: true,
    }
  );
}

/**
 * Use cached friends list
 */
export function useCachedFriends(options: UseCachedQueryOptions = {}) {
  const { useCache = true, refreshInterval = 0, dedupingInterval = 3000 } = options;

  return useSWR(
    useCache ? '/api/friends' : null,
    fetcher,
    {
      refreshInterval,
      dedupingInterval,
      revalidateOnFocus: true,
    }
  );
}

/**
 * Use cached friend requests
 */
export function useCachedFriendRequests(options: UseCachedQueryOptions = {}) {
  const { useCache = true, refreshInterval = 0, dedupingInterval = 2000 } = options;

  return useSWR(
    useCache ? '/api/friends/requests' : null,
    fetcher,
    {
      refreshInterval,
      dedupingInterval,
      revalidateOnFocus: true,
    }
  );
}

/**
 * Use cached messages for a conversation
 */
export function useCachedMessages(
  conversationId: string | undefined,
  options: UseCachedQueryOptions = {}
) {
  const { useCache = true, refreshInterval = 0, dedupingInterval = 1000 } = options;

  return useSWR(
    useCache && conversationId ? `/api/messages/${conversationId}` : null,
    fetcher,
    {
      refreshInterval,
      dedupingInterval,
      revalidateOnFocus: true,
    }
  );
}

/**
 * Use cached presence status
 */
export function useCachedPresence(
  userId: string | undefined,
  options: UseCachedQueryOptions = {}
) {
  const { useCache = true, refreshInterval = 30000, dedupingInterval = 1000 } = options;

  return useSWR(
    useCache && userId ? `/api/presence/${userId}` : null,
    fetcher,
    {
      refreshInterval, // Refresh every 30s for presence
      dedupingInterval,
      revalidateOnFocus: true,
    }
  );
}

/**
 * Use cached stories
 */
export function useCachedStories(options: UseCachedQueryOptions = {}) {
  const { useCache = true, refreshInterval = 0, dedupingInterval = 5000 } = options;

  return useSWR(
    useCache ? '/api/stories' : null,
    fetcher,
    {
      refreshInterval,
      dedupingInterval,
      revalidateOnFocus: true,
    }
  );
}

/**
 * Use cached rooms
 */
export function useCachedRooms(type: 'user' | 'public' = 'user', options: UseCachedQueryOptions = {}) {
  const { useCache = true, refreshInterval = 0, dedupingInterval = 3000 } = options;

  return useSWR(
    useCache ? `/api/rooms?type=${type}` : null,
    fetcher,
    {
      refreshInterval,
      dedupingInterval,
      revalidateOnFocus: true,
    }
  );
}

/**
 * Use cached room details
 */
export function useCachedRoomDetails(
  roomId: string | undefined,
  options: UseCachedQueryOptions = {}
) {
  const { useCache = true, refreshInterval = 0, dedupingInterval = 3000 } = options;

  return useSWR(
    useCache && roomId ? `/api/rooms/${roomId}` : null,
    fetcher,
    {
      refreshInterval,
      dedupingInterval,
      revalidateOnFocus: true,
    }
  );
}

/**
 * Use cached support tickets
 */
export function useCachedSupportTickets(options: UseCachedQueryOptions = {}) {
  const { useCache = true, refreshInterval = 0, dedupingInterval = 5000 } = options;

  return useSWR(
    useCache ? '/api/support' : null,
    fetcher,
    {
      refreshInterval,
      dedupingInterval,
      revalidateOnFocus: true,
    }
  );
}

/**
 * Use cached message reactions
 */
export function useCachedReactions(
  messageId: string | undefined,
  options: UseCachedQueryOptions = {}
) {
  const { useCache = true, refreshInterval = 0, dedupingInterval = 2000 } = options;

  return useSWR(
    useCache && messageId ? `/api/reactions/${messageId}` : null,
    fetcher,
    {
      refreshInterval,
      dedupingInterval,
      revalidateOnFocus: true,
    }
  );
}

/**
 * Use cached search results
 */
export function useCachedSearch(
  query: string | undefined,
  conversationId?: string,
  options: UseCachedQueryOptions = {}
) {
  const { useCache = true, refreshInterval = 0, dedupingInterval = 3000 } = options;

  const url = query
    ? `/api/search?q=${encodeURIComponent(query)}${conversationId ? `&conversationId=${conversationId}` : ''}`
    : null;

  return useSWR(
    useCache && url ? url : null,
    fetcher,
    {
      refreshInterval,
      dedupingInterval,
      revalidateOnFocus: false, // Don't auto-refresh search results
    }
  );
}

/**
 * Generic cached query hook
 * Falls back to Convex's useQuery if API route not available
 */
export function useCachedQuery<T>(
  apiRoute: string | null,
  convexQuery?: FunctionReference<"query">,
  convexArgs?: any,
  options: UseCachedQueryOptions = {}
) {
  const { useCache = true, refreshInterval = 0, dedupingInterval = 2000 } = options;

  // Try SWR with API route first
  const { data: swrData, error: swrError, isLoading: swrLoading, mutate } = useSWR(
    useCache && apiRoute ? apiRoute : null,
    fetcher,
    {
      refreshInterval,
      dedupingInterval,
      revalidateOnFocus: true,
      shouldRetryOnError: false, // Don't retry if API fails
    }
  );

  // Fallback to Convex useQuery
  const convexData = useConvexQuery(
    (!useCache || swrError) && convexQuery ? convexQuery : null as any,
    convexArgs
  );

  // Return cached data if available, otherwise fallback to Convex
  return {
    data: swrData || convexData,
    error: swrError,
    isLoading: swrLoading || convexData === undefined,
    mutate, // Expose mutate for manual cache updates
  };
}
