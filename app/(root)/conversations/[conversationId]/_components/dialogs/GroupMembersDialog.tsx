"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { capitalizeName } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useMutationState } from "@/hooks/useMutationState";
import { Crown, Shield, User, UserCog } from "lucide-react";
import React, { Dispatch } from "react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
  conversationId: Id<"conversations">;
  open: boolean;
  setOpen: Dispatch<React.SetStateAction<boolean>>;
  isCreator: boolean;
  isAdmin: boolean;
};

const GroupMembersDialog = ({
  conversationId,
  open,
  setOpen,
  isCreator,
  isAdmin,
}: Props) => {
  const members = useQuery(api.conversation.getGroupMembers, {
    conversationId,
  });

  const { mutate: toggleAdmin, pending } = useMutationState(
    api.conversation.toggleAdmin
  );

  const handleToggleAdmin = async (memberId: Id<"users">) => {
    try {
      const result = await toggleAdmin({ conversationId, memberId });
      toast.success(
        result?.isAdmin
          ? "Member promoted to admin"
          : "Admin privileges removed"
      );
    } catch (error) {
      toast.error(
        error instanceof ConvexError ? error.data : "Something went wrong"
      );
    }
  };

  // Check if this is a legacy group (no creator/admin badges visible)
  const hasRoleSystem = members?.some(m => m.isCreator || m.isAdmin) || false;
  const canManageAdmins = hasRoleSystem && (isCreator || isAdmin);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="w-5 h-5" />
            Group Members
          </DialogTitle>
          <DialogDescription>
            {canManageAdmins
              ? "View and manage group members and admins"
              : "View group members"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {members?.map((member) => (
            <Card
              key={member._id}
              className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="h-12 w-12 ring-2 ring-border/20">
                  <AvatarImage src={member.imageUrl} />
                  <AvatarFallback>
                    {capitalizeName(member.username).substring(0, 1)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold truncate">
                      {capitalizeName(member.username)}
                    </h4>
                    {member.isCreator && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge
                            variant="default"
                            className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600"
                          >
                            <Crown className="w-3 h-3 mr-1" />
                            Creator
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>Group Creator</TooltipContent>
                      </Tooltip>
                    )}
                    {member.isAdmin && !member.isCreator && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge
                            variant="secondary"
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                          >
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>Group Admin</TooltipContent>
                      </Tooltip>
                    )}
                    {!member.isAdmin && !member.isCreator && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline" className="text-xs">
                            <User className="w-3 h-3 mr-1" />
                            Member
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>Group Member</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {member.email}
                  </p>
                </div>
              </div>

              {canManageAdmins && !member.isCreator && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={member.isAdmin ? "destructive" : "default"}
                      onClick={() => handleToggleAdmin(member._id)}
                      disabled={pending}
                      className="ml-2 shrink-0"
                    >
                      {member.isAdmin ? (
                        <>
                          <Shield className="w-4 h-4 mr-1" />
                          Remove Admin
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-1" />
                          Make Admin
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {member.isAdmin
                      ? "Remove admin privileges from this member"
                      : "Grant admin privileges to this member"}
                  </TooltipContent>
                </Tooltip>
              )}
            </Card>
          ))}

          {(!members || members.length === 0) && (
            <div className="text-center text-muted-foreground py-8">
              <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No members found</p>
            </div>
          )}
        </div>

        {canManageAdmins && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-2">
              <Shield className="w-5 h-5 text-primary mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">
                  Admin Privileges
                </p>
                <p>
                  Admins can delete the group and manage admin status for other
                  members. The group creator cannot have their admin privileges
                  removed.
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GroupMembersDialog;
