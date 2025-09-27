import { useCallback, useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface UseTypingOptions {
  conversationId: Id<"conversations">;
  debounceMs?: number;
}

export const useTyping = ({ conversationId, debounceMs = 1000 }: UseTypingOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // We'll need to add these mutations to the conversation.ts file
  const startTyping = useMutation(api.conversation.startTyping);
  const stopTyping = useMutation(api.conversation.stopTyping);

  // Get typing users for this conversation
  const typingUsers = useQuery(api.conversation.getTypingUsers, { conversationId });

  const handleStartTyping = useCallback(async () => {
    try {
      await startTyping({ conversationId });

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout to stop typing
      timeoutRef.current = setTimeout(async () => {
        try {
          await stopTyping({ conversationId });
        } catch (error) {
          console.error('Error stopping typing:', error);
        }
      }, debounceMs);
    } catch (error) {
      console.error('Error starting typing:', error);
    }
  }, [conversationId, startTyping, stopTyping, debounceMs]);

  const handleStopTyping = useCallback(async () => {
    try {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      await stopTyping({ conversationId });
    } catch (error) {
      console.error('Error stopping typing:', error);
    }
  }, [conversationId, stopTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Stop typing when component unmounts
      stopTyping({ conversationId }).catch(console.error);
    };
  }, [conversationId, stopTyping]);

  return {
    startTyping: handleStartTyping,
    stopTyping: handleStopTyping,
    typingUsers: typingUsers || [],
  };
};