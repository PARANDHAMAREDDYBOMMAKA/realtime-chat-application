"use client";
import { useParams } from "next/navigation";
import ConversationContainer from "@/components/shared/conversation/ConversationContainer";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import Header from "./_components/Header";
import Body from "./_components/body/Body";
import ChatInput from "./_components/input/ChatInput";

type Props = {
  params: Promise<{
    conversationId: Id<"conversations">;
  }>;
};

const ConversationPage = ({ params }: Props) => {
  const [conversationId, setConversationId] =
    useState<Id<"conversations"> | null>(null);

  useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params;
      setConversationId(resolvedParams.conversationId);
    };
    fetchParams();
  }, [params]);

  useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params;
      setConversationId(resolvedParams.conversationId);
    };
    fetchParams();
  }, [params]);
  const conversation = useQuery(api.conversation.get, { id: conversationId! }); // Ensure conversationId is not null

  const [removeFriendDialog, setRemoveFriendDialog] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [deleteGroupDialog, setDeleteGroupDialog] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [leaveGroupDialog, setLeaveGroupDialog] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [callType, setCallType] = useState<"audio" | "video" | null>(null); // eslint-disable-line @typescript-eslint/no-unused-vars

  if (conversation == undefined) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />{" "}
      </div>
    );
  }

  if (conversation === null) {
    return (
      <p className="w-full h-full flex items-center justify-center">
        Conversation not found
      </p>
    );
  }

  return (
    <ConversationContainer>
      <Header
        imageUrl={
          conversation.isGroup ? undefined : conversation.otherMember.imageUrl
        }
        name={
          (conversation.isGroup
            ? conversation.name
            : conversation.otherMember.username) || ""
        }
        options={
          conversation.isGroup
            ? [
                {
                  label: "Leave Group",
                  destructive: false,
                  onClick: () => setLeaveGroupDialog(true),
                },
                {
                  label: "Delete Group",
                  destructive: false,
                  onClick: () => setDeleteGroupDialog(true),
                },
                {
                  label: "Remove Friend",
                  destructive: true,
                  onClick: () => setRemoveFriendDialog(true),
                },
              ]
            : []
        }
      />
      <Body />
      <ChatInput />
    </ConversationContainer>
  );
};

export default ConversationPage;
