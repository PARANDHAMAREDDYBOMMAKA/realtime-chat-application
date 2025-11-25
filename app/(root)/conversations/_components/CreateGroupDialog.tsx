"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { capitalizeName } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import { useMutationState } from "@/hooks/useMutationState";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { CirclePlus, X, ImagePlus, Loader2 } from "lucide-react";
import React, { useMemo, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

 // eslint-disable-next-line @typescript-eslint/no-unused-vars
type Props = Record<string, never>;

type Friend = {
  username: string;
  _id: string;
  imageUrl: string;
};

const createGroupFormSchema = z.object({
  name: z.string().min(1, { message: "This field can't be empty" }),
  members: z
    .string()
    .array()
    .min(1, { message: "You must select at least 1 friend" }),
});

const CreateGroupDialog = () => {
  const [open, setOpen] = useState(false);
  const [groupImage, setGroupImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const friends = useQuery(api.friends.get) as Friend[] | null;

  const { mutate: createGroup, pending } = useMutationState(
    api.conversation.createGroup
  );

  const form = useForm<z.infer<typeof createGroupFormSchema>>({
    resolver: zodResolver(createGroupFormSchema),
    defaultValues: {
      name: "",
      members: [],
    },
  });

  const members = form.watch("members", []);

  const unselectedFriends = useMemo(() => {
    return friends
      ? friends.filter((friend) => !members.includes(friend._id))
      : [];
  }, [members, friends]);

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

  const handleSubmit = async (
    values: z.infer<typeof createGroupFormSchema>
  ) => {
    try {
      await createGroup({
        name: values.name,
        members: values.members,
        groupImageUrl: groupImage || undefined
      });
      form.reset();
      setGroupImage(null);
      setOpen(false);
      toast.success("Group created successfully");
    } catch (error) {
      toast.error(
        error instanceof ConvexError ? error.data : "Something went wrong"
      );
    }
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="outline" onClick={() => setOpen(true)}>
            <CirclePlus />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Create Group</p>
        </TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="block">
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
            <DialogDescription>
              Add your friends to get started
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-8"
            >
              {/* Group Image Upload */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={groupImage || undefined} />
                    <AvatarFallback className="text-2xl">
                      <ImagePlus className="w-8 h-8" />
                    </AvatarFallback>
                  </Avatar>
                  {uploadingImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
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
                  size="sm"
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

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Group name..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="members"
                render={() => {
                  return (
                    <FormItem>
                      <FormLabel>Friends</FormLabel>
                      <FormControl>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            disabled={unselectedFriends.length === 0}
                          >
                            <Button className="w-full" variant="outline">
                              Select
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-full">
                            {unselectedFriends.map((friend) => {
                              return (
                                <DropdownMenuCheckboxItem
                                  key={friend._id}
                                  className="flex items-center gap-2 w-full p-2"
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      form.setValue("members", [
                                        ...members,
                                        friend._id,
                                      ]);
                                    }
                                  }}
                                >
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={friend.imageUrl} />
                                    <AvatarFallback>
                                      {capitalizeName(friend.username).substring(0, 1)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <h4 className="truncate">
                                    {capitalizeName(friend.username)}
                                  </h4>
                                </DropdownMenuCheckboxItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </FormControl>
                    </FormItem>
                  );
                }}
              />
              {members && members.length ? (
                <Card className="flex items-center gap-3 overflow-x-auto w-full h-24 p-2 no-scrollbar">
                  {friends
                    ?.filter((friend) => members.includes(friend._id))
                    .map((friend) => {
                      return (
                        <div
                          key={friend._id}
                          className="flex flex-col items-center gap-1"
                        >
                          <div className="relative">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={friend.imageUrl} />
                              <AvatarFallback>
                                {capitalizeName(friend.username).substring(0, 1)}
                              </AvatarFallback>
                            </Avatar>
                            <X
                              className="text-muted-foreground w-4 h-4 absolute bottom-8 left-7 bg-muted rounded-full cursor-pointer"
                              onClick={() => {
                                form.setValue(
                                  "members",
                                  members.filter((id) => id !== friend._id)
                                );
                              }}
                            />
                          </div>
                          <p className="truncate text-sm">
                            {capitalizeName(friend.username.split(" ")[0])}
                          </p>
                        </div>
                      );
                    })}
                </Card>
              ) : null}
              <DialogFooter>
                <Button disabled={pending} type="submit">
                  Create
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateGroupDialog;
