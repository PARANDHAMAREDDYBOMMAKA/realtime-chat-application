"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Trash2, Eye } from "lucide-react";
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

  const markAsViewed = useMutation(api.stories.markAsViewed);
  const deleteStory = useMutation(api.stories.deleteStory);

  const currentStory = stories.stories[currentStoryIndex];

  // Get viewers list for current story (only if user owns the story)
  const viewers = useQuery(
    api.stories.getStoryViewers,
    stories.isCurrentUser && currentStory ? { storyId: currentStory.id } : "skip"
  );

  useEffect(() => {
    if (currentStory && !currentStory.hasViewed) {
      markAsViewed({ storyId: currentStory.id });
    }
  }, [currentStory, markAsViewed]);

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
                  className={`h-full bg-white transition-all duration-300 ${
                    index < currentStoryIndex
                      ? "w-full"
                      : index === currentStoryIndex
                      ? "w-full"
                      : "w-0"
                  }`}
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
            <img
              src={currentStory.content[0]}
              alt="Story"
              className="w-full h-full object-contain"
            />
          )}

          {currentStory.type === "video" && (
            <video
              src={currentStory.content[0]}
              className="w-full h-full object-contain"
              autoPlay
              controls={false}
              onEnded={handleNext}
            />
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
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Viewed by</h3>
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
