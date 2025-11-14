"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, Loader2, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageId: Id<"messages">;
  messageType: string;
  messageContent: string[];
};

const ForwardMessageDialog = ({ open, onOpenChange, messageId, messageType, messageContent }: Props) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversations, setSelectedConversations] = useState<Set<Id<"conversations">>>(new Set());
  const [isForwarding, setIsForwarding] = useState(false);

  const conversations = useQuery(api.conversations.get);
  const createMessage = useMutation(api.message.create);

  const filteredConversations = useMemo(() => {
    if (!conversations || !searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      if (conv.conversation.isGroup) {
        return conv.conversation.name?.toLowerCase().includes(query);
      }
      return conv.otherMember?.username?.toLowerCase().includes(query);
    });
  }, [conversations, searchQuery]);

  const toggleConversation = (conversationId: Id<"conversations">) => {
    const newSelected = new Set(selectedConversations);
    if (newSelected.has(conversationId)) {
      newSelected.delete(conversationId);
    } else {
      newSelected.add(conversationId);
    }
    setSelectedConversations(newSelected);
  };

  const handleForward = async () => {
    if (selectedConversations.size === 0) {
      toast.error("Please select at least one conversation");
      return;
    }

    setIsForwarding(true);
    try {
      const promises = Array.from(selectedConversations).map((conversationId) =>
        createMessage({
          conversationId,
          type: messageType,
          content: messageContent,
        })
      );

      await Promise.all(promises);

      toast.success(`Message forwarded to ${selectedConversations.size} conversation${selectedConversations.size > 1 ? 's' : ''}`);
      setSelectedConversations(new Set());
      setSearchQuery("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error forwarding message:", error);
      toast.error("Failed to forward message");
    } finally {
      setIsForwarding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Forward Message</DialogTitle>
          <DialogDescription>
            Select conversations to forward this message to
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Conversations List */}
          <ScrollArea className="h-[400px] pr-4">
            {filteredConversations && filteredConversations.length > 0 ? (
              <div className="space-y-2">
                {filteredConversations.map((conv) => {
                  const isSelected = selectedConversations.has(conv.conversation._id);
                  const conversationName = conv.conversation.isGroup
                    ? conv.conversation.name || "Group Chat"
                    : conv.otherMember?.username || "Unknown";
                  const conversationImage = conv.conversation.isGroup
                    ? undefined
                    : conv.otherMember?.imageUrl;

                  return (
                    <div
                      key={conv.conversation._id}
                      onClick={() => toggleConversation(conv.conversation._id)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/10 border-2 border-primary"
                          : "hover:bg-muted border-2 border-transparent"
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          {conversationImage ? (
                            <AvatarImage src={conversationImage} alt={conversationName} />
                          ) : (
                            <AvatarFallback className="bg-primary/10">
                              {conv.conversation.isGroup ? (
                                <Users className="h-5 w-5" />
                              ) : (
                                conversationName[0]?.toUpperCase()
                              )}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 bg-primary rounded-full p-1">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{conversationName}</p>
                        {conv.conversation.isGroup && (
                          <p className="text-xs text-muted-foreground">Group</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <Search className="h-12 w-12 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "No conversations found" : "No conversations available"}
                </p>
              </div>
            )}
          </ScrollArea>

          {/* Selected Count */}
          {selectedConversations.size > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedConversations.size} conversation{selectedConversations.size > 1 ? 's' : ''} selected
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedConversations(new Set());
                setSearchQuery("");
                onOpenChange(false);
              }}
              disabled={isForwarding}
            >
              Cancel
            </Button>
            <Button
              onClick={handleForward}
              disabled={selectedConversations.size === 0 || isForwarding}
            >
              {isForwarding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Forwarding...
                </>
              ) : (
                `Forward to ${selectedConversations.size || ''}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ForwardMessageDialog;
