"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface AudioPlayerProps {
  audioUrl: string;
  fromCurrentUser: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, fromCurrentUser }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-2 min-w-[240px] max-w-[280px]">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play/Pause Button */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          onClick={togglePlayPause}
          size="icon"
          variant="ghost"
          className={`h-10 w-10 rounded-full flex-shrink-0 ${
            fromCurrentUser
              ? "hover:bg-primary-foreground/20 text-primary-foreground"
              : "hover:bg-primary/10 text-primary"
          }`}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 fill-current" />
          ) : (
            <Play className="h-5 w-5 fill-current ml-0.5" />
          )}
        </Button>
      </motion.div>

      {/* Waveform / Progress Bar Container */}
      <div className="flex-1 flex flex-col gap-1">
        {/* Progress Bar */}
        <div className="relative h-1.5 bg-background/20 rounded-full overflow-hidden">
          <motion.div
            className={`absolute left-0 top-0 h-full rounded-full ${
              fromCurrentUser ? "bg-primary-foreground/70" : "bg-primary/70"
            }`}
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Waveform Visual (Decorative) */}
        <div className="flex items-center gap-0.5 h-8">
          {[...Array(32)].map((_, i) => {
            const height = Math.random() * 60 + 40;
            const isActive = (i / 32) * 100 < progress;
            return (
              <motion.div
                key={i}
                className={`flex-1 rounded-full transition-all duration-150 ${
                  isActive
                    ? fromCurrentUser
                      ? "bg-primary-foreground/80"
                      : "bg-primary/80"
                    : fromCurrentUser
                    ? "bg-primary-foreground/30"
                    : "bg-foreground/30"
                }`}
                style={{
                  height: `${height}%`,
                  maxHeight: "24px",
                }}
                initial={{ scaleY: 0.5 }}
                animate={{ scaleY: isPlaying ? [1, 1.2, 1] : 1 }}
                transition={{
                  duration: 0.6,
                  repeat: isPlaying ? Infinity : 0,
                  delay: i * 0.02,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Duration */}
      <span
        className={`text-xs font-mono flex-shrink-0 min-w-[40px] ${
          fromCurrentUser ? "text-primary-foreground/80" : "text-muted-foreground"
        }`}
      >
        {formatTime(isPlaying ? currentTime : duration)}
      </span>
    </div>
  );
};

export default AudioPlayer;
