"use client";

import { ConvexReactClient } from "convex/react";
import { FunctionReference, getFunctionName } from "convex/server";

/**
 * Cached Convex Client Wrapper
 *
 * This extends the Convex client to add automatic Redis caching
 * for all queries through the API routes
 */

const CACHE_BYPASS_QUERIES = [
  // Real-time queries that should bypass cache
  "conversation.getTypingUsers",
  "presence.getUserStatus",
  "conversation.updateLastSeenMessage",
];

const CACHE_ENABLED_QUERIES: Record<string, string> = {
  "user.getCurrent": "/api/user/current",
  "conversations.get": "/api/conversations",
  "messages.get": "/api/messages",
  "friends.get": "/api/friends",
  "requests.get": "/api/friends/requests",
  "presence.getUserStatus": "/api/presence",
};

class CachedConvexClient extends ConvexReactClient {
  private cacheMap = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 604800000; // 1 week in milliseconds

  /**
   * Override query method to add caching logic
   */
  async query<Query extends FunctionReference<"query">>(
    query: Query,
    ...args: any[]
  ): Promise<any> {
    const queryName = getFunctionName(query);

    // Check if this query should use API route caching
    const apiRoute = CACHE_ENABLED_QUERIES[queryName];

    if (apiRoute && !CACHE_BYPASS_QUERIES.includes(queryName)) {
      try {
        // Try to use cached API route
        const response = await fetch(apiRoute, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          return data;
        }
      } catch (error) {
        console.error(`[Cached Convex] API route failed for ${queryName}, falling back to direct query:`, error);
      }
    }

    // Fall back to direct Convex query
    return super.query(query, ...args);
  }

  /**
   * Get cached value from memory
   */
  private getCached(key: string): any | null {
    const cached = this.cacheMap.get(key);

    if (!cached) {
      return null;
    }

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cacheMap.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cached value in memory
   */
  private setCache(key: string, data: any): void {
    this.cacheMap.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cacheMap.clear();
  }

  /**
   * Clear cache for specific query
   */
  clearQueryCache(queryName: string): void {
    for (const key of this.cacheMap.keys()) {
      if (key.startsWith(queryName)) {
        this.cacheMap.delete(key);
      }
    }
  }
}

// Singleton instance
let cachedConvexClient: CachedConvexClient | null = null;

export function getCachedConvexClient(url: string): CachedConvexClient {
  if (!cachedConvexClient) {
    cachedConvexClient = new CachedConvexClient(url) as unknown as CachedConvexClient;
  }
  return cachedConvexClient;
}

export { CachedConvexClient };
