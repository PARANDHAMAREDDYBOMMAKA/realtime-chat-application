import { useEffect, useCallback } from "react";

interface ScreenshotDetectionOptions {
  onScreenshotDetected: () => void;
  enabled?: boolean;
}

/**
 * Hook to detect potential screenshot activity
 * Monitors visibility changes and keyboard shortcuts commonly used for screenshots
 */
export function useScreenshotDetection({
  onScreenshotDetected,
  enabled = true,
}: ScreenshotDetectionOptions) {
  const handleVisibilityChange = useCallback(() => {
    if (!enabled) return;

    // Detect when page becomes hidden briefly (common screenshot behavior)
    if (document.hidden) {
      // Check if it was a brief hide (screenshot) vs actual tab switch
      const hiddenTime = Date.now();
      const visibilityHandler = () => {
        const visibleTime = Date.now();
        if (visibleTime - hiddenTime < 200) {
          // Quick return suggests screenshot
          onScreenshotDetected();
        }
        document.removeEventListener("visibilitychange", visibilityHandler);
      };
      setTimeout(() => {
        document.addEventListener("visibilitychange", visibilityHandler, {
          once: true,
        });
      }, 0);
    }
  }, [enabled, onScreenshotDetected]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Detect common screenshot shortcuts
      const isScreenshotShortcut =
        // Windows: Win + PrintScreen, PrintScreen, Alt + PrintScreen
        (event.key === "PrintScreen" ||
          // macOS: Cmd + Shift + 3, Cmd + Shift + 4, Cmd + Shift + 5
          (event.metaKey &&
            event.shiftKey &&
            (event.key === "3" || event.key === "4" || event.key === "5")) ||
          // Some Linux distros: Ctrl + Print
          (event.ctrlKey && event.key === "Print"));

      if (isScreenshotShortcut) {
        console.log("📸 Screenshot shortcut detected:", event.key);
        onScreenshotDetected();
      }
    },
    [enabled, onScreenshotDetected]
  );

  useEffect(() => {
    if (!enabled) return;

    // Listen for visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Listen for screenshot keyboard shortcuts
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleVisibilityChange, handleKeyDown]);
}
