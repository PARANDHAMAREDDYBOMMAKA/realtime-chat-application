"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import StoryViewer from "./StoryViewer";
import CreateStoryDialog from "./CreateStoryDialog";
import { Id } from "@/convex/_generated/dataModel";

export default function StoriesBar() {
  const stories = useQuery(api.stories.getFriendsStories);
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const selectedUserStories = stories?.find((s) => s && s.userId === selectedUserId);

  // Always show the stories bar with at least the "Create Story" button
  return (
    <>
      <div className="w-full bg-card border-b border-border p-3 overflow-x-auto">
        <div className="flex gap-3">
          {/* Always show "Create Your Story" button first */}
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex flex-col items-center gap-2 flex-shrink-0 group"
          >
            <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-primary/50 to-primary/30 transition-all hover:from-primary/70 hover:to-primary/50">
              <div className="h-14 w-14 border-2 border-background rounded-full bg-muted flex items-center justify-center">
                <Plus className="h-6 w-6 text-primary" />
              </div>
            </div>
            <span className="text-xs max-w-[60px] truncate font-medium">
              Create Story
            </span>
          </button>

          {/* Show friend stories if available */}
          {stories && stories.length > 0 && stories.map((userStories) => {
            if (!userStories || userStories.isCurrentUser) return null;

            return (
              <button
                key={userStories.userId}
                onClick={() => setSelectedUserId(userStories.userId)}
                className="flex flex-col items-center gap-2 flex-shrink-0 group"
              >
                <div
                  className={cn(
                    "relative p-0.5 rounded-full transition-all",
                    userStories.hasUnviewed
                      ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500"
                      : "bg-border"
                  )}
                >
                  <Avatar className="h-14 w-14 border-2 border-background">
                    <AvatarImage src={userStories.userImage} />
                    <AvatarFallback>{userStories.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
                <span className="text-xs max-w-[60px] truncate">
                  {userStories.username}
                </span>
              </button>
            );
          })}

          {/* Show current user's stories if they exist */}
          {stories && stories.length > 0 && stories.map((userStories) => {
            if (!userStories || !userStories.isCurrentUser) return null;

            return (
              <button
                key={userStories.userId}
                onClick={() => setSelectedUserId(userStories.userId)}
                className="flex flex-col items-center gap-2 flex-shrink-0 group"
              >
                <div
                  className={cn(
                    "relative p-0.5 rounded-full transition-all",
                    userStories.hasUnviewed
                      ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500"
                      : "bg-gradient-to-tr from-primary/50 to-primary/30"
                  )}
                >
                  <Avatar className="h-14 w-14 border-2 border-background">
                    <AvatarImage src={userStories.userImage} />
                    <AvatarFallback>{userStories.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
                <span className="text-xs max-w-[60px] truncate">
                  Your Story
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Story Viewer */}
      {selectedUserStories && (
        <StoryViewer
          stories={selectedUserStories}
          onClose={() => setSelectedUserId(null)}
        />
      )}

      {/* Create Story Dialog */}
      <CreateStoryDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </>
  );
}
