"use client";
import ConversationContainer from "@/components/shared/conversation/ConversationContainer";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import React, { useState, useEffect } from "react";
import Header from "./_components/Header";
import Body from "./_components/body/Body";
import ChatInput from "./_components/input/ChatInput";
import RemoveFriendDialog from "./_components/dialogs/RemoveFriendDialog";
import DeleteGroupDialog from "./_components/dialogs/DeleteGroupDialog";
import EnhancedLoading from "@/components/shared/EnhancedLoading";

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

  const conversation = useQuery(
    api.conversation.get,
    conversationId ? { id: conversationId } : "skip"
  );

  const [removeFriendDialog, setRemoveFriendDialog] = useState(false);
  const [deleteGroupDialog, setDeleteGroupDialog] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [leaveGroupDialog, setLeaveGroupDialog] = useState(false);

  if (!conversationId || conversation === undefined) {
    return (
      <ConversationContainer>
        <EnhancedLoading
          type="conversations"
          message="Loading conversation..."
          size="lg"
        />
      </ConversationContainer>
    );
  }

  if (conversation === null) {
    return (
      <ConversationContainer>
        <div className="w-full h-full flex flex-col items-center justify-center space-y-4 text-center p-8">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Conversation not found</h3>
            <p className="text-muted-foreground max-w-md">
              This conversation might have been deleted or you don't have access to it.
            </p>
          </div>
        </div>
      </ConversationContainer>
    );
  }

  try {
    return (
      <ConversationContainer>
        {/* Render the appropriate dialog based on conversation type */}
        {!conversation.isGroup ? (
          <RemoveFriendDialog
            conversationId={conversationId}
            open={removeFriendDialog}
            setOpen={setRemoveFriendDialog}
          />
        ) : (
          <DeleteGroupDialog
            conversationId={conversationId}
            open={deleteGroupDialog}
            setOpen={setDeleteGroupDialog}
          />
        )}

        {conversation && (
          <Header
            imageUrl={
              conversation.isGroup
                ? undefined
                : conversation.otherMember?.imageUrl
            }
            name={
              conversation.isGroup
                ? conversation.name || ""
                : conversation.otherMember?.username || ""
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
                      destructive: true,
                      onClick: () => setDeleteGroupDialog(true),
                    },
                  ]
                : [
                    {
                      label: "Remove Friend",
                      destructive: true,
                      onClick: () => setRemoveFriendDialog(true),
                    },
                  ]
            }
          />
        )}

        <Body conversationId={conversationId} />
        <ChatInput conversationId={conversationId} />
      </ConversationContainer>
    );
  } catch (error: unknown) {
    console.error("Error loading conversation:", error);
    return null;
  }
};

export default ConversationPage;
