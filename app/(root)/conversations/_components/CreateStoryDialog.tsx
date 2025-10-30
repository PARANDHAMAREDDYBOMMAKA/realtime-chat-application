"use client";

import React, { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Image, Type, Video, Upload } from "lucide-react";

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateStoryDialog({ open, onOpenChange }: CreateStoryDialogProps) {
  const [storyType, setStoryType] = useState<"text" | "image" | "video" | null>(null);
  const [textContent, setTextContent] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#6366f1");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const createStory = useMutation(api.stories.create);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 50MB");
      return;
    }

    // Check file type
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error("Please select an image or video file");
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

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
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create story");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateMediaStory = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setIsCreating(true);
    try {
      // Generate upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      const { storageId } = await result.json();

      // Get the URL for the uploaded file
      const fileUrl = `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${storageId}`;

      // Create story
      await createStory({
        type: storyType as "image" | "video",
        content: [storageId],
      });

      toast.success("Story created!");
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create story");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setStoryType(null);
    setTextContent("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setBackgroundColor("#6366f1");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
          <div className="grid grid-cols-3 gap-3">
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
              onClick={() => {
                setStoryType("image");
                fileInputRef.current?.click();
              }}
            >
              <Image className="h-8 w-8" />
              <span>Image Story</span>
            </Button>
            <Button
              variant="outline"
              className="h-32 flex flex-col gap-2"
              onClick={() => {
                setStoryType("video");
                fileInputRef.current?.click();
              }}
            >
              <Video className="h-8 w-8" />
              <span>Video Story</span>
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
        ) : storyType === "image" || storyType === "video" ? (
          <div className="space-y-4">
            {!selectedFile ? (
              <div
                className="w-full h-64 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to upload {storyType === "image" ? "an image" : "a video"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Max size: 50MB
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-full h-64 rounded-lg overflow-hidden bg-black flex items-center justify-center">
                  {storyType === "image" && previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  )}
                  {storyType === "video" && previewUrl && (
                    <video
                      src={previewUrl}
                      className="max-w-full max-h-full object-contain"
                      controls
                    />
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetForm();
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateMediaStory}
                    disabled={isCreating}
                    className="flex-1"
                  >
                    {isCreating ? "Creating..." : "Create Story"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={storyType === "image" ? "image/*" : storyType === "video" ? "video/*" : "image/*,video/*"}
          onChange={handleFileSelect}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
}
