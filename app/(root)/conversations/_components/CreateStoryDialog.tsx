"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Image, Type } from "lucide-react";

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateStoryDialog({ open, onOpenChange }: CreateStoryDialogProps) {
  const [storyType, setStoryType] = useState<"text" | "image" | null>(null);
  const [textContent, setTextContent] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#6366f1");
  const [isCreating, setIsCreating] = useState(false);

  const createStory = useMutation(api.stories.create);

  const handleCreateTextStory = async () => {
    if (!textContent.trim()) {
      toast.error("Please enter some text");
      return;
    }

    setIsCreating(true);
    try {
      await createStory({
        type: "text",
        content: [textContent],
        backgroundColor,
        textColor: "#ffffff",
      });

      toast.success("Story created!");
      setTextContent("");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create story");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const colors = [
    "#6366f1", // indigo
    "#ec4899", // pink
    "#8b5cf6", // purple
    "#f59e0b", // amber
    "#10b981", // emerald
    "#3b82f6", // blue
    "#ef4444", // red
    "#06b6d4", // cyan
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Story</DialogTitle>
        </DialogHeader>

        {!storyType ? (
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-32 flex flex-col gap-2"
              onClick={() => setStoryType("text")}
            >
              <Type className="h-8 w-8" />
              <span>Text Story</span>
            </Button>
            <Button
              variant="outline"
              className="h-32 flex flex-col gap-2"
              onClick={() => toast.info("Image stories coming soon!")}
            >
              <Image className="h-8 w-8" />
              <span>Image Story</span>
            </Button>
          </div>
        ) : storyType === "text" ? (
          <div className="space-y-4">
            <div
              className="w-full h-48 rounded-lg flex items-center justify-center p-6"
              style={{ backgroundColor }}
            >
              <p className="text-white text-lg font-bold text-center break-words">
                {textContent || "Your text here..."}
              </p>
            </div>

            <Textarea
              placeholder="What's on your mind?"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="min-h-[80px]"
              maxLength={200}
            />

            <div>
              <p className="text-sm text-muted-foreground mb-2">Background Color</p>
              <div className="flex gap-2 flex-wrap">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setBackgroundColor(color)}
                    className={`w-10 h-10 rounded-full transition-all ${
                      backgroundColor === color
                        ? "ring-2 ring-primary ring-offset-2"
                        : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStoryType(null);
                  setTextContent("");
                }}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleCreateTextStory}
                disabled={isCreating || !textContent.trim()}
                className="flex-1"
              >
                {isCreating ? "Creating..." : "Create Story"}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
