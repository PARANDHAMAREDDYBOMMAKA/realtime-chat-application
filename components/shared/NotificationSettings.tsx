"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Volume2 } from "lucide-react";
import { useNotifications, NotificationSound } from "@/hooks/useNotifications";

export default function NotificationSettings() {
  const {
    settings,
    permission,
    requestPermission,
    togglePushNotifications,
    toggleSound,
    changeSound,
    playNotificationSound,
    sounds,
  } = useNotifications();

  const [open, setOpen] = useState(false);

  const handlePushToggle = async (enabled: boolean) => {
    await togglePushNotifications(enabled);
  };

  const handleSoundToggle = async (enabled: boolean) => {
    await toggleSound(enabled);
  };

  const handleSoundChange = async (sound: string) => {
    await changeSound(sound);
    playNotificationSound(sound as NotificationSound);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Notification Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Push Notifications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive browser notifications for new messages
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={settings?.pushEnabled || false}
                onCheckedChange={handlePushToggle}
              />
            </div>

            {permission === "denied" && (
              <p className="text-sm text-destructive">
                Browser notifications are blocked. Please enable them in your browser settings.
              </p>
            )}

            {permission === "default" && !settings?.pushEnabled && (
              <Button
                variant="outline"
                size="sm"
                onClick={requestPermission}
                className="w-full"
              >
                Enable Notifications
              </Button>
            )}
          </div>

          {/* Sound Notifications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound-notifications">Sound</Label>
                <p className="text-sm text-muted-foreground">
                  Play a sound for new messages
                </p>
              </div>
              <Switch
                id="sound-notifications"
                checked={settings?.soundEnabled || false}
                onCheckedChange={handleSoundToggle}
              />
            </div>

            {settings?.soundEnabled && (
              <div className="space-y-2">
                <Label htmlFor="notification-sound">Notification Sound</Label>
                <div className="flex gap-2">
                  <Select
                    value={settings.customSound || "default"}
                    onValueChange={handleSoundChange}
                  >
                    <SelectTrigger id="notification-sound" className="flex-1">
                      <SelectValue placeholder="Select sound" />
                    </SelectTrigger>
                    <SelectContent>
                      {sounds.map((sound) => (
                        <SelectItem key={sound} value={sound}>
                          {sound.charAt(0).toUpperCase() + sound.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => playNotificationSound(settings.customSound as NotificationSound)}
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground">
              You can mute individual conversations from the conversation settings menu.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
