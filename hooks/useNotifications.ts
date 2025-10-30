import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Notification sounds using Web Audio API
const NOTIFICATION_SOUNDS = {
  default: { frequency: 800, duration: 0.15, type: "sine" as OscillatorType },
  ding: { frequency: 1200, duration: 0.2, type: "sine" as OscillatorType },
  bell: { frequency: 650, duration: 0.25, type: "triangle" as OscillatorType },
  chime: { frequency: 1000, duration: 0.3, type: "sine" as OscillatorType },
  pop: { frequency: 600, duration: 0.1, type: "square" as OscillatorType },
} as const;

export type NotificationSound = keyof typeof NOTIFICATION_SOUNDS;

// Function to create a notification sound using Web Audio API
function createNotificationSound(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine"
) {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);

    // Clean up after sound finishes
    setTimeout(() => {
      audioContext.close();
    }, duration * 1000 + 100);
  } catch (error) {
    console.error("Error creating notification sound:", error);
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
    if (!settings?.soundEnabled) return;

    const sound = soundName || (settings.customSound as NotificationSound) || "default";
    const soundConfig = NOTIFICATION_SOUNDS[sound];

    createNotificationSound(
      soundConfig.frequency,
      soundConfig.duration,
      soundConfig.type
    );
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
