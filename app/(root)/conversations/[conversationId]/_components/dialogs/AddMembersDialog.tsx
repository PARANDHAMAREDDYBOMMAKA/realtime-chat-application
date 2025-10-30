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
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutationState } from "@/hooks/useMutationState";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { X } from "lucide-react";
import React, { Dispatch, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type Props = {
  conversationId: Id<"conversations">;
  open: boolean;
  setOpen: Dispatch<React.SetStateAction<boolean>>;
};

type Friend = {
  username: string;
  _id: string;
  imageUrl: string;
  email: string;
};

const addMembersFormSchema = z.object({
  members: z
    .string()
    .array()
    .min(1, { message: "You must select at least 1 friend" }),
});

const AddMembersDialog = ({ conversationId, open, setOpen }: Props) => {
  const availableFriends = useQuery(
    api.conversation.getAvailableFriendsForGroup,
    conversationId ? { conversationId } : "skip"
  ) as Friend[] | undefined;

  const { mutate: addMembers, pending } = useMutationState(
    api.conversation.addMembersToGroup
  );

  const form = useForm<z.infer<typeof addMembersFormSchema>>({
    resolver: zodResolver(addMembersFormSchema),
    defaultValues: {
      members: [],
    },
  });

  const members = form.watch("members", []);

  const unselectedFriends = useMemo(() => {
    return availableFriends
      ? availableFriends.filter((friend) => !members.includes(friend._id))
      : [];
  }, [members, availableFriends]);

  const handleSubmit = async (
    values: z.infer<typeof addMembersFormSchema>
  ) => {
    try {
      await addMembers({ conversationId, members: values.members });
      form.reset();
      setOpen(false);
      toast.success("Members added successfully");
    } catch (error) {
      toast.error(
        error instanceof ConvexError ? error.data : "Something went wrong"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="block">
        <DialogHeader>
          <DialogTitle>Add Members</DialogTitle>
          <DialogDescription>
            Add your friends to the group
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8"
          >
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
                            {unselectedFriends.length === 0
                              ? "No friends available to add"
                              : "Select"}
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
                                <div className="flex flex-col">
                                  <h4 className="truncate">
                                    {capitalizeName(friend.username)}
                                  </h4>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {friend.email}
                                  </p>
                                </div>
                              </DropdownMenuCheckboxItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            {members && members.length ? (
              <Card className="flex items-center gap-3 overflow-x-auto w-full h-24 p-2 no-scrollbar">
                {availableFriends
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
                Add Members
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMembersDialog;
