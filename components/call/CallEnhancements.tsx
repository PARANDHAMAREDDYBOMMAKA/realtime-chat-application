"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Circle,
  Square,
  Image as ImageIcon,
  Subtitles,
  Monitor
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CallEnhancementsProps {
  roomName: string;
  isRecording?: boolean;
  onToggleRecording?: () => void;
  onToggleVirtualBackground?: (enabled: boolean) => void;
  onToggleCaptions?: (enabled: boolean) => void;
  className?: string;
}

export default function CallEnhancements({
  roomName,
  isRecording = false,
  onToggleRecording,
  onToggleVirtualBackground,
  onToggleCaptions,
  className,
}: CallEnhancementsProps) {
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [virtualBgEnabled, setVirtualBgEnabled] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState<string>("blur");

  // Virtual Background Options
  const backgroundOptions = [
    { id: "none", name: "None", type: "none" },
    { id: "blur", name: "Blur", type: "blur" },
    { id: "office", name: "Office", type: "image", preview: "/backgrounds/office.jpg" },
    { id: "nature", name: "Nature", type: "image", preview: "/backgrounds/nature.jpg" },
    { id: "gradient", name: "Gradient", type: "image", preview: "/backgrounds/gradient.jpg" },
  ];

  const handleToggleRecording = () => {
    if (onToggleRecording) {
      onToggleRecording();
    }
  };

  const handleToggleCaptions = () => {
    const newState = !captionsEnabled;
    setCaptionsEnabled(newState);
    if (onToggleCaptions) {
      onToggleCaptions(newState);
    }
  };

  const handleBackgroundSelect = (bgId: string) => {
    setSelectedBackground(bgId);
    const enabled = bgId !== "none";
    setVirtualBgEnabled(enabled);
    if (onToggleVirtualBackground) {
      onToggleVirtualBackground(enabled);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Call Recording */}
      {onToggleRecording && (
        <Button
          variant={isRecording ? "destructive" : "outline"}
          size="sm"
          onClick={handleToggleRecording}
          className="gap-2"
        >
          {isRecording ? (
            <>
              <Square className="h-4 w-4 fill-current" />
              <span className="hidden sm:inline">Stop Recording</span>
            </>
          ) : (
            <>
              <Circle className="h-4 w-4" />
              <span className="hidden sm:inline">Record</span>
            </>
          )}
        </Button>
      )}

      {/* Virtual Background Selector */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={virtualBgEnabled ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Background</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Virtual Background</h4>
            <div className="grid grid-cols-3 gap-2">
              {backgroundOptions.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => handleBackgroundSelect(bg.id)}
                  className={cn(
                    "relative aspect-video rounded-lg border-2 overflow-hidden transition-all hover:scale-105",
                    selectedBackground === bg.id
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {bg.type === "blur" ? (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-xl flex items-center justify-center">
                      <span className="text-xs font-medium">Blur</span>
                    </div>
                  ) : bg.type === "none" ? (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <VideoOff className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                      <span className="text-xs font-medium">{bg.name}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Select a background to apply during the call
            </p>
          </div>
        </PopoverContent>
      </Popover>

      {/* Live Captions Toggle */}
      <Button
        variant={captionsEnabled ? "default" : "outline"}
        size="sm"
        onClick={handleToggleCaptions}
        className="gap-2"
      >
        <Subtitles className="h-4 w-4" />
        <span className="hidden sm:inline">Captions</span>
      </Button>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 border border-destructive/20 rounded-full animate-pulse">
          <Circle className="h-2 w-2 fill-destructive text-destructive" />
          <span className="text-xs font-medium text-destructive">Recording</span>
        </div>
      )}
    </div>
  );
}

/**
 * Live Captions Display Component
 * Shows real-time transcription during calls
 */
export function LiveCaptions({ captions }: { captions: string[] }) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 max-w-2xl w-full px-4 sm:px-6 lg:px-8 z-50">
      <div className="bg-black/80 backdrop-blur-md text-white px-4 py-3 rounded-lg shadow-xl border border-white/10">
        <div className="flex items-start gap-2">
          <Subtitles className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
          <div className="flex-1 min-w-0">
            {captions.length > 0 ? (
              <p className="text-sm sm:text-base leading-relaxed">
                {captions[captions.length - 1]}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Listening...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
