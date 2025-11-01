"use client";

import React, { useState } from "react";
import { MoreVertical, Trash2, Smile, Reply } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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

type Props = {
  onDelete: () => void;
  onReact: () => void;
  onReply?: () => void;
  fromCurrentUser: boolean;
};

const MessageActions = ({ onDelete, onReact, onReply, fromCurrentUser }: Props) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    onDelete();
    setShowDeleteDialog(false);
  };

  const handleReact = () => {
    setOpen(false);
    // Small delay to ensure dropdown is closed before opening reaction picker
    setTimeout(() => {
      onReact();
    }, 100);
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {onReply && (
            <DropdownMenuItem onClick={onReply} className="cursor-pointer">
              <Reply className="h-4 w-4 mr-2" />
              Reply
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleReact} className="cursor-pointer">
            <Smile className="h-4 w-4 mr-2" />
            Add Reaction
          </DropdownMenuItem>
          {fromCurrentUser && (
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Message
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
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
    </>
  );
};

export default MessageActions;
