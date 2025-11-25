"use client";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutationState } from "@/hooks/useMutationState";
import {
  AlertDialogAction,
  AlertDialogCancel,
} from "@radix-ui/react-alert-dialog";
import { ConvexError } from "convex/values";
import React, { Dispatch } from "react";
import { toast } from "sonner";

type Props = {
  conversationId: Id<"conversations">;
  open: boolean;
  setOpen: Dispatch<React.SetStateAction<boolean>>;
};

const DeleteGroupDialog = ({ conversationId, open, setOpen }: Props) => {
  const { mutate: deleteGroup, pending } = useMutationState(
    api.conversation.deleteConversation
  );

  const handleDeleteGroup = async () => {
    try {
      await deleteGroup({ conversationId });
      toast.success("Group deleted successfully");
    } catch (error) {
      toast.error(
        error instanceof ConvexError ? error.data : "Something went wrong"
      );
    }
  };
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Delete Group Permanently?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p className="font-medium text-foreground">
              This action cannot be undone. This will permanently:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Delete all messages in this group</li>
              <li>Remove all members from the group</li>
              <li>Delete the group conversation</li>
            </ul>
            <div className="mt-4 p-3 bg-destructive/10 rounded-md border border-destructive/20">
              <p className="text-sm text-destructive font-medium">
                Warning: This will affect all {" "}
                <span className="font-bold">group members</span>
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel
            disabled={pending}
            className="mt-0 sm:mt-0"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={handleDeleteGroup}
            className="bg-destructive hover:bg-destructive/90"
          >
            {pending ? "Deleting..." : "Delete Group"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteGroupDialog;
