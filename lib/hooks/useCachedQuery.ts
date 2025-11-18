import { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { FunctionReference } from 'convex/server';

/**
 * Custom hook that wraps Convex useQuery with client-side caching
 *
 * This provides an intermediate caching layer before data reaches the UI.
 * Convex handles real-time updates, while this hook provides instant initial loads.
 *
 * Usage:
 * const conversations = useCachedQuery(api.conversations.get, {}, 'conversations');
 */
export function useCachedQuery<T>(
  query: FunctionReference<'query'>,
  args: any,
  cacheKey: string,
  cacheDuration: number = 60000 // 1 minute default
) {
  const [cachedData, setCachedData] = useState<T | undefined>();
  const [isLoadingFromCache, setIsLoadingFromCache] = useState(true);

  // Real-time query from Convex
  const liveData = useQuery(query, args);

  // Load from cache on mount
  useEffect(() => {
    const loadFromCache = async () => {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;

          // Use cached data if it's still fresh
          if (age < cacheDuration) {
            setCachedData(data);
          }
        }
      } catch (error) {
        console.error('Error loading from cache:', error);
      } finally {
        setIsLoadingFromCache(false);
      }
    };

    loadFromCache();
  }, [cacheKey, cacheDuration]);

  // Update cache when live data changes
  useEffect(() => {
    if (liveData !== undefined) {
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: liveData,
            timestamp: Date.now(),
          })
        );
        setCachedData(liveData);
      } catch (error) {
        console.error('Error saving to cache:', error);
      }
    }
  }, [liveData, cacheKey]);

  // Return cached data if available, otherwise live data
  return {
    data: liveData !== undefined ? liveData : cachedData,
    isLoading: liveData === undefined && isLoadingFromCache,
    isCached: liveData === undefined && cachedData !== undefined,
  };
}
