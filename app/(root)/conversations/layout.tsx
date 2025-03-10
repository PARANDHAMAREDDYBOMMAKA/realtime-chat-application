"use client";

import ItemList from "@/components/shared/item-list/ItemList";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import React from "react";
import DMConversationItem from "./_components/DMConversationItem";

type Props = React.PropsWithChildren<object>;

const ConversationsLayout = ({ children }: Props) => {
  const conversations = useQuery(api.conversations.get);
  return (
    <>
      <ItemList title="Conversations">
        {conversations ? (
          conversations.length === 0 ? (
            <p className="w-full h-full flex items-center justify-center">
              No conversations found
            </p>
          ) : (
            conversations.map((conv) => {
              return conv.conversation.isGroup ? null : (
                <DMConversationItem
                  key={conv.conversation._id}
                  id={conv.conversation._id}
                  imageUrl={conv.otherMember?.imageUrl || ""}
                  username={conv.otherMember?.username || ""}
                  lstMsgContent={conv.lastMessage?.content}
                  lstMsgSender={conv.lastMessage?.sender}
                />
              );
            })
          )
        ) : (
          <Loader2 />
        )}
      </ItemList>
      {children}
    </>
  );
};

export default ConversationsLayout;
