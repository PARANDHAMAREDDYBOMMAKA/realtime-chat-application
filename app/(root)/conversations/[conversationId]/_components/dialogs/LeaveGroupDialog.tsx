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
import { useRouter } from "next/navigation";
import React, { Dispatch } from "react";
import { toast } from "sonner";

type Props = {
  conversationId: Id<"conversations">;
  open: boolean;
  setOpen: Dispatch<React.SetStateAction<boolean>>;
};

const LeaveGroupDialog = ({ conversationId, open, setOpen }: Props) => {
  const router = useRouter();
  const { mutate: leaveGroup, pending } = useMutationState(
    api.conversation.leaveGroup
  );

  const handleLeaveGroup = async () => {
    try {
      await leaveGroup({ conversationId });
      toast.success("Left group successfully");
      router.push("/conversations");
    } catch (error) {
      toast.error(
        error instanceof ConvexError ? error.data : "Something went wrong"
      );
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave Group?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to leave this group? You will need to be added back by another member to rejoin.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={handleLeaveGroup}>
            Leave
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LeaveGroupDialog;
