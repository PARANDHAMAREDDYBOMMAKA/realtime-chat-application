"use client";

import React, { useState, useEffect } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { RoomOptions, VideoPresets } from "livekit-client";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface VideoCallProps {
  roomName: string;
  participantName: string;
  onLeave: () => void;
  audioOnly?: boolean;
}

export default function VideoCall({
  roomName,
  participantName,
  onLeave,
  audioOnly = false,
}: VideoCallProps) {
  const [token, setToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configure room options for better video/audio quality
  const roomOptions: RoomOptions = {
    adaptiveStream: true,
    dynacast: true,
    publishDefaults: {
      videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h216],
      screenShareSimulcastLayers: [VideoPresets.h1080, VideoPresets.h720],
      stopMicTrackOnMute: false,
    },
    videoCaptureDefaults: {
      resolution: VideoPresets.h720.resolution,
    },
  };

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch("/api/livekit/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomName,
            participantName,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch token");
        }

        const data = await response.json();
        setToken(data.token);
      } catch (err) {
        console.error("Error fetching token:", err);
        setError("Failed to connect to call");
      } finally {
        setIsLoading(false);
      }
    };

    fetchToken();
  }, [roomName, participantName]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Connecting to call...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={onLeave} variant="outline">
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50">
      <div className="h-full w-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <div>
            <h2 className="text-lg font-semibold">Video Call</h2>
            <p className="text-sm text-muted-foreground">{roomName}</p>
          </div>
          <Button
            onClick={onLeave}
            variant="ghost"
            size="icon"
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Video Conference */}
        <div className="flex-1 overflow-hidden">
          <LiveKitRoom
            video={!audioOnly}
            audio={true}
            token={token}
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
            connect={true}
            options={roomOptions}
            data-lk-theme="default"
            style={{ height: "100%" }}
            onDisconnected={onLeave}
            onError={(error) => {
              console.error("LiveKit error:", error);
              setError("Connection error occurred");
            }}
          >
            {audioOnly ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-primary animate-pulse" />
                    </div>
                  </div>
                  <p className="text-lg font-medium">Audio Call</p>
                  <p className="text-sm text-muted-foreground">Connected to {roomName}</p>
                </div>
                <RoomAudioRenderer />
                <div className="mt-8">
                  <ControlBar variation="verbose" />
                </div>
              </div>
            ) : (
              <>
                <VideoConference />
                <RoomAudioRenderer />
              </>
            )}
          </LiveKitRoom>
        </div>
      </div>
    </div>
  );
}
