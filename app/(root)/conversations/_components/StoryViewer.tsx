"use client";

import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Trash2, Eye, Volume2, VolumeX } from "lucide-react";
import { format } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Story = {
  id: Id<"stories">;
  type: "text" | "image" | "video";
  content: string[];
  backgroundColor?: string;
  textColor?: string;
  createdAt: number;
  expiresAt: number;
  viewersCount: number;
  hasViewed: boolean;
};

type UserStories = {
  userId: Id<"users">;
  username: string;
  userImage: string;
  isCurrentUser: boolean;
  stories: Story[];
};

interface StoryViewerProps {
  stories: UserStories;
  onClose: () => void;
}

export default function StoryViewer({ stories, onClose }: StoryViewerProps) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewersDialog, setShowViewersDialog] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const markAsViewed = useMutation(api.stories.markAsViewed);
  const deleteStory = useMutation(api.stories.deleteStory);

  const currentStory = stories.stories[currentStoryIndex];

  // Duration for each story type (in milliseconds)
  const STORY_DURATION = {
    text: 7000, // 7 seconds for text
    image: 20000,
    video: 10000,
  };

  // Get viewers list for current story (only if user owns the story)
  const viewers = useQuery(
    api.stories.getStoryViewers,
    stories.isCurrentUser && currentStory ? { storyId: currentStory.id } : "skip"
  );

  // Mark story as viewed
  useEffect(() => {
    if (currentStory && !currentStory.hasViewed) {
      markAsViewed({ storyId: currentStory.id });
    }
  }, [currentStory, markAsViewed]);

  // Auto-advance for text and image stories
  useEffect(() => {
    if (!currentStory) return;

    // Reset progress
    setProgress(0);

    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // Don't auto-advance for video stories (they have their own onEnded handler)
    if (currentStory.type === "video") return;

    const duration = STORY_DURATION[currentStory.type] || 5000;
    const startTime = Date.now();

    // Update progress bar
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min((elapsed / duration) * 100, 100);
      setProgress(progressPercent);

      if (elapsed >= duration) {
        handleNext();
      }
    }, 50);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentStory, currentStoryIndex]);

  // Handle video mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleNext = () => {
    if (currentStoryIndex < stories.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteStory({ storyId: currentStory.id });
      toast.success("Story deleted");

      // If this was the last story, close the viewer
      if (stories.stories.length === 1) {
        onClose();
      } else if (currentStoryIndex === stories.stories.length - 1) {
        // If deleting the last story in the list, go to previous
        setCurrentStoryIndex(currentStoryIndex - 1);
      }
      // Otherwise, stay on the same index (which will now show the next story)

      setShowDeleteDialog(false);
    } catch (error) {
      toast.error("Failed to delete story");
      console.error(error);
    }
  };

  if (!currentStory) return null;

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md h-[80vh] p-0 bg-black border-0 [&>button]:hidden">
        <VisuallyHidden>
          <DialogTitle>Story from {stories.username}</DialogTitle>
        </VisuallyHidden>
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-white/20">
                <AvatarImage src={stories.userImage} />
                <AvatarFallback>{stories.username.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white font-semibold text-sm">{stories.username}</p>
                <p className="text-white/70 text-xs">
                  {format(currentStory.createdAt, "h:mm a")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Delete button - only for story owner */}
              {stories.isCurrentUser && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-white hover:bg-white/10"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Progress bars */}
          <div className="flex gap-1">
            {stories.stories.map((_, index) => (
              <div
                key={index}
                className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-all"
                  style={{
                    width:
                      index < currentStoryIndex
                        ? "100%"
                        : index === currentStoryIndex
                        ? `${progress}%`
                        : "0%",
                    transitionDuration: index === currentStoryIndex ? "50ms" : "300ms",
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Story Content */}
        <div className="relative w-full h-full flex items-center justify-center">
          {currentStory.type === "text" && (
            <div
              className="w-full h-full flex items-center justify-center p-8"
              style={{
                backgroundColor: currentStory.backgroundColor || "#000",
              }}
            >
              <p
                className="text-2xl font-bold text-center break-words"
                style={{
                  color: currentStory.textColor || "#fff",
                }}
              >
                {currentStory.content[0]}
              </p>
            </div>
          )}

          {currentStory.type === "image" && (
            <ImageContent storageId={currentStory.content[0]} />
          )}

          {currentStory.type === "video" && (
            <>
              <VideoContent
                storageId={currentStory.content[0]}
                videoRef={videoRef}
                isMuted={isMuted}
                onEnded={handleNext}
              />
              {/* Mute/Unmute button */}
              <div className="absolute top-20 right-4 z-20">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-white hover:bg-white/10 rounded-full bg-black/30"
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="absolute inset-0 flex items-center justify-between px-4">
            {currentStoryIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                className="text-white hover:bg-white/10 rounded-full"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}
            <div className="flex-1" />
            {currentStoryIndex < stories.stories.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="text-white hover:bg-white/10 rounded-full"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}
          </div>
        </div>

        {/* Viewers count - only for story owner */}
        {stories.isCurrentUser && (
          <div className="absolute bottom-4 left-4 right-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowViewersDialog(true)}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <Eye className="h-4 w-4 mr-2" />
              {currentStory.viewersCount} {currentStory.viewersCount === 1 ? "view" : "views"}
            </Button>
          </div>
        )}
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Story?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this story? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Viewers Dialog */}
      <Dialog open={showViewersDialog} onOpenChange={setShowViewersDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-lg font-semibold">Viewed by</DialogTitle>
          <div className="space-y-4">
            {viewers && viewers.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {viewers.map((viewer) => (
                  <div key={viewer.id} className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={viewer.imageUrl} />
                      <AvatarFallback>{viewer.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{viewer.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(viewer.viewedAt, "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No views yet</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

// Helper component to load and display images from Convex storage
function ImageContent({ storageId }: { storageId: string }) {
  const imageUrl = useQuery(api.files.getUrl, { storageId });

  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt="Story"
      className="w-full h-full object-contain"
    />
  );
}

// Helper component to load and display videos from Convex storage
function VideoContent({
  storageId,
  videoRef,
  isMuted,
  onEnded,
}: {
  storageId: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isMuted: boolean;
  onEnded: () => void;
}) {
  const videoUrl = useQuery(api.files.getUrl, { storageId });

  if (!videoUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={videoUrl}
      className="w-full h-full object-contain"
      autoPlay
      muted={isMuted}
      playsInline
      controls={false}
      onEnded={onEnded}
    />
  );
}
