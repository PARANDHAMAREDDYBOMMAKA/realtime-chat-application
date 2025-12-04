import { useEffect, useState, useCallback } from "react";
import { Id } from "@/convex/_generated/dataModel";

/**
 * Hook to manage message drafts in localStorage
 * Auto-saves drafts per conversation and restores them on mount
 */
export function useDrafts(conversationId: Id<"conversations">) {
  const DRAFT_KEY = `draft_${conversationId}`;
  const DEBOUNCE_DELAY = 500; // ms

  const [draft, setDraft] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        setDraft(savedDraft);
      }
    } catch (error) {
      console.error("Error loading draft:", error);
    } finally {
      setIsInitialized(true);
    }
  }, [DRAFT_KEY]);

  // Save draft to localStorage (debounced)
  useEffect(() => {
    if (!isInitialized) return;

    const timeoutId = setTimeout(() => {
      try {
        if (draft.trim()) {
          localStorage.setItem(DRAFT_KEY, draft);
        } else {
          localStorage.removeItem(DRAFT_KEY);
        }
      } catch (error) {
        console.error("Error saving draft:", error);
      }
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [draft, DRAFT_KEY, isInitialized]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      setDraft("");
    } catch (error) {
      console.error("Error clearing draft:", error);
    }
  }, [DRAFT_KEY]);

  // Update draft
  const updateDraft = useCallback((newDraft: string) => {
    setDraft(newDraft);
  }, []);

  return {
    draft,
    updateDraft,
    clearDraft,
    isInitialized,
  };
}
