import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

/**
 * Custom hook to fetch and cache messages
 *
 * This hook fetches messages from Convex and automatically
 * caches them in Redis for faster subsequent loads
 */
export function useMessages(conversationId: Id<'conversations'> | undefined) {
  const messages = useQuery(
    api.messages.get,
    conversationId ? { id: conversationId } : 'skip'
  );

  // Auto-cache messages in Redis when they load
  useEffect(() => {
    if (messages && conversationId) {
      cacheMessages(conversationId, messages);
    }
  }, [messages, conversationId]);

  return messages;
}

/**
 * Cache messages in Redis
 */
async function cacheMessages(conversationId: string, messages: any) {
  try {
    const cacheKey = `messages:conversation:${conversationId}:page:0`;

    await fetch('/api/cache/set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: cacheKey,
        data: messages,
        ttl: 180, // 3 minutes for recent messages
      }),
    });

    console.log(`[Cache] Cached ${messages.length} messages for conversation ${conversationId}`);
  } catch (error) {
    console.error('[Cache] Failed to cache messages:', error);
  }
}
