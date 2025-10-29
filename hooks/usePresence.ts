import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Hook to track user presence with automatic heartbeat
 * Sends heartbeat every 60 seconds to keep user online
 */
export const usePresence = () => {
  const heartbeat = useMutation(api.presence.heartbeat);
  const updatePresence = useMutation(api.presence.updatePresence);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Set initial online status
    updatePresence({ status: "online" });

    // Send heartbeat every 60 seconds
    intervalRef.current = setInterval(() => {
      heartbeat();
    }, 60 * 1000);

    // Handle page visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence({ status: "away" });
      } else {
        updatePresence({ status: "online" });
      }
    };

    // Handle before unload
    const handleBeforeUnload = () => {
      updatePresence({ status: "offline" });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      updatePresence({ status: "offline" });
    };
  }, [heartbeat, updatePresence]);
};
