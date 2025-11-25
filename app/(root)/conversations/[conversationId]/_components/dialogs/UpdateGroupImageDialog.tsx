"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutationState } from "@/hooks/useMutationState";
import { ImagePlus, Loader2 } from "lucide-react";
import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";

type Props = {
  conversationId: Id<"conversations">;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentImageUrl?: string;
};

const UpdateGroupImageDialog = ({
  conversationId,
  open,
  setOpen,
  currentImageUrl,
}: Props) => {
  const [groupImage, setGroupImage] = useState<string | null>(currentImageUrl || null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: updateGroupImage, pending } = useMutationState(
    api.conversation.updateGroupImage
  );

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/cloudinary?type=group', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      setGroupImage(data.data.url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!groupImage) {
      toast.error('Please select a group image');
      return;
    }

    try {
      await updateGroupImage({
        conversationId,
        groupImageUrl: groupImage,
      });
      setOpen(false);
      toast.success('Group photo updated successfully');
    } catch (error) {
      toast.error(
        error instanceof ConvexError ? error.data : 'Failed to update group photo'
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Group Photo</DialogTitle>
          <DialogDescription>
            Change the group profile picture
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative">
            <Avatar className="w-32 h-32">
              <AvatarImage src={groupImage || undefined} />
              <AvatarFallback className="text-2xl">
                <ImagePlus className="w-12 h-12" />
              </AvatarFallback>
            </Avatar>
            {uploadingImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
          >
            {groupImage ? 'Change Photo' : 'Upload Photo'}
          </Button>

          {groupImage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setGroupImage(null)}
            >
              Remove Photo
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={pending || uploadingImage || !groupImage}
          >
            {pending ? 'Updating...' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateGroupImageDialog;
