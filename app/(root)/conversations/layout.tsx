"use client";

import ItemList from "@/components/shared/item-list/ItemList";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Loader2, Search } from "lucide-react";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import DMConversationItem from "./_components/DMConversationItem";
import CreateGroupDialog from "./_components/CreateGroupDialog";
import GroupConversationItem from "./_components/GroupConversationItem";
import StoriesBar from "./_components/StoriesBar";

type Props = React.PropsWithChildren<object>;

const ConversationsLayout = ({ children }: Props) => {
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Prevent hydration mismatch by waiting until the client mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  const conversations = useQuery(api.conversations.get);

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!conversations || !searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      // Search in group name
      if (conv.conversation.isGroup) {
        return conv.conversation.name?.toLowerCase().includes(query);
      }
      // Search in username for DMs
      return conv.otherMember?.username?.toLowerCase().includes(query);
    });
  }, [conversations, searchQuery]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <>
      <ItemList title="Conversations" action={<CreateGroupDialog />} onSearch={handleSearch}>
        {!searchQuery && <StoriesBar />}

        {filteredConversations ? (
          filteredConversations.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center p-8">
              <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center">
                <Search className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {searchQuery ? "No conversations found" : "No conversations yet"}
                </p>
                {searchQuery && (
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Try a different search term
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full space-y-1">
              {filteredConversations.map((conv) =>
                conv.conversation.isGroup ? (
                  <GroupConversationItem
                    key={conv.conversation._id}
                    id={conv.conversation._id}
                    name={conv.conversation.name || ""}
                    lstMsgContent={conv.lastMessage?.content}
                    lstMsgSender={conv.lastMessage?.sender}
                    lstMsgType={conv.lastMessage?.type}
                    unreadCount={(conv as any).unreadCount || 0}
                    groupImageUrl={conv.conversation.groupImageUrl}
                  />
                ) : (
                  <DMConversationItem
                    key={conv.conversation._id}
                    id={conv.conversation._id}
                    imageUrl={conv.otherMember?.imageUrl || ""}
                    username={conv.otherMember?.username || ""}
                    lstMsgContent={conv.lastMessage?.content}
                    lstMsgSender={conv.lastMessage?.sender}
                    lstMsgType={conv.lastMessage?.type}
                    userStatus={(conv as any).userStatus}
                    unreadCount={(conv as any).unreadCount || 0}
                  />
                )
              )}
            </div>
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        )}
      </ItemList>
      {children}
    </>
  );
};

export default ConversationsLayout;
