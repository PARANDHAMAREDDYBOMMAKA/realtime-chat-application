import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Notification sounds - now using audio files for WhatsApp-like experience
const NOTIFICATION_SOUNDS = {
  default: "/sounds/notification.wav",
  ding: "/sounds/ding.wav",
  bell: "/sounds/bell.wav",
  chime: "/sounds/chime.wav",
  pop: "/sounds/pop.wav",
} as const;

export type NotificationSound = keyof typeof NOTIFICATION_SOUNDS;

// Fallback Web Audio API sound for browsers that don't support audio files
function createFallbackSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);

    // Clean up after sound finishes
    setTimeout(() => {
      audioContext.close();
    }, 250);
  } catch (error) {
    console.error("Error creating fallback sound:", error);
  }
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const settings = useQuery(api.notificationSettings.getSettings);
  const initializeSettings = useMutation(api.notificationSettings.initializeSettings);
  const updatePushEnabled = useMutation(api.notificationSettings.updatePushEnabled);
  const updateSoundEnabled = useMutation(api.notificationSettings.updateSoundEnabled);
  const updateCustomSound = useMutation(api.notificationSettings.updateCustomSound);
  const toggleMute = useMutation(api.notificationSettings.toggleMuteConversation);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    // Initialize settings if they don't exist
    if (settings === null) {
      initializeSettings();
    }
  }, [settings, initializeSettings]);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === "granted") {
      await updatePushEnabled({ enabled: true });
      return true;
    }
    return false;
  };

  const playNotificationSound = (soundName?: NotificationSound) => {
    console.log("🎵 playNotificationSound called:", {
      soundName,
      soundEnabled: settings?.soundEnabled,
      customSound: settings?.customSound,
    });

    if (!settings?.soundEnabled) {
      console.log("⏭️ Sound disabled in settings");
      return;
    }

    const sound = soundName || (settings.customSound as NotificationSound) || "default";
    const soundPath = NOTIFICATION_SOUNDS[sound];

    console.log("🎵 Attempting to play sound:", { sound, soundPath });

    try {
      // Create a new audio element each time to avoid conflicts
      const audio = new Audio(soundPath);
      audio.volume = 0.7; // Set volume to 70%

      // Play the sound
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("✅ Audio played successfully");
          })
          .catch((error) => {
            console.warn("⚠️ Audio playback failed, using fallback sound:", error);
            // Use fallback Web Audio API sound if file doesn't exist or can't play
            createFallbackSound();
          });
      }
    } catch (error) {
      console.error("❌ Error playing notification sound:", error);
      // Use fallback sound on error
      createFallbackSound();
    }
  };

  const showNotification = (
    title: string,
    options?: NotificationOptions & { sound?: NotificationSound }
  ) => {
    const { sound, ...notificationOptions } = options || {};

    // Always play sound if enabled (even if push notifications are disabled)
    if (settings?.soundEnabled) {
      playNotificationSound(sound);
    }

    // Only show browser notification if enabled and permission granted
    if (settings?.pushEnabled && permission === "granted") {
      new Notification(title, {
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        ...notificationOptions,
      });
    }
  };

  const togglePushNotifications = async (enabled: boolean) => {
    if (enabled && permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) return false;
    }
    await updatePushEnabled({ enabled });
    return true;
  };

  const toggleSound = async (enabled: boolean) => {
    await updateSoundEnabled({ enabled });
  };

  const changeSound = async (sound: string) => {
    await updateCustomSound({ sound });
  };

  const muteConversation = async (conversationId: Id<"conversations">) => {
    await toggleMute({ conversationId });
  };

  return {
    settings,
    permission,
    requestPermission,
    showNotification,
    playNotificationSound,
    togglePushNotifications,
    toggleSound,
    changeSound,
    muteConversation,
    sounds: Object.keys(NOTIFICATION_SOUNDS),
  };
}
