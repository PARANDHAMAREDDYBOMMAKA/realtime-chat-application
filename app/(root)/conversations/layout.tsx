"use client";

import ItemList from "@/components/shared/item-list/ItemList";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import DMConversationItem from "./_components/DMConversationItem";
import CreateGroupDialog from "./_components/CreateGroupDialog";
import GroupConversationItem from "./_components/GroupConversationItem";

type Props = React.PropsWithChildren<object>;

const ConversationsLayout = ({ children }: Props) => {
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch by waiting until the client mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  const conversations = useQuery(api.conversations.get);

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <>
      <ItemList title="Conversations" action={<CreateGroupDialog />}>
        {conversations ? (
          conversations.length === 0 ? (
            <p className="w-full h-full flex items-center justify-center">
              No conversations found
            </p>
          ) : (
            conversations.map((conv) =>
              conv.conversation.isGroup ? (
                <GroupConversationItem
                  key={conv.conversation._id}
                  id={conv.conversation._id}
                  name={conv.conversation.name || ""}
                  lstMsgContent={conv.lastMessage?.content}
                  lstMsgSender={conv.lastMessage?.sender}
                />
              ) : (
                <DMConversationItem
                  key={conv.conversation._id}
                  id={conv.conversation._id}
                  imageUrl={conv.otherMember?.imageUrl || ""}
                  username={conv.otherMember?.username || ""}
                  lstMsgContent={conv.lastMessage?.content}
                  lstMsgSender={conv.lastMessage?.sender}
                />
              )
            )
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="animate-spin" />
          </div>
        )}
      </ItemList>
      {children}
    </>
  );
};

export default ConversationsLayout;
