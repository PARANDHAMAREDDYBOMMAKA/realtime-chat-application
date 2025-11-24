"use client";

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';

/**
 * Hook to initialize and warm cache when app opens
 * This ensures all data is cached for optimal performance
 */
export function useCacheInitializer() {
  const { user } = useUser();
  const hasWarmedCache = useRef(false);

  useEffect(() => {
    // Only warm cache once per session when user is logged in
    if (!user?.id || hasWarmedCache.current) {
      return;
    }

    const warmCache = async () => {
      try {
        console.log('[Cache Initializer] Warming cache for user:', user.id);

        // Call cache warming endpoint
        await fetch('/api/cache/warm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
          }),
        });

        hasWarmedCache.current = true;
        console.log('[Cache Initializer] Cache warmed successfully');
      } catch (error) {
        console.error('[Cache Initializer] Failed to warm cache:', error);
      }
    };

    warmCache();
  }, [user?.id]);

  // Handle visibility change - refresh cache when app becomes visible
  useEffect(() => {
    if (!user?.id) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('[Cache Initializer] App became visible, refreshing critical cache');

        try {
          // Refresh critical real-time data
          await fetch('/api/cache/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
            }),
          });
        } catch (error) {
          console.error('[Cache Initializer] Failed to refresh cache:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id]);
}
