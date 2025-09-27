"use client";
import ConversationContainer from "@/components/shared/conversation/ConversationContainer";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import Header from "./_components/Header";
import Body from "./_components/body/Body";
import ChatInput from "./_components/input/ChatInput";
import RemoveFriendDialog from "./_components/dialogs/RemoveFriendDialog";
import DeleteGroupDialog from "./_components/dialogs/DeleteGroupDialog";
import CallModal from "./_components/CallModal";
import { useWebRTC } from "@/hooks/useWebRTC";

type Props = {
  params: Promise<{
    conversationId: Id<"conversations">;
  }>;
};

const ConversationPage = ({ params }: Props) => {
  const [conversationId, setConversationId] =
    useState<Id<"conversations"> | null>(null);

  // Incoming call state
  const [incomingCall, setIncomingCall] = useState<{
    callId: Id<"calls">;
    initiator: any;
    type: 'audio' | 'video';
  } | null>(null);
  const [showIncomingCall, setShowIncomingCall] = useState(false);

  // WebRTC hook for handling incoming calls
  useWebRTC({
    onIncomingCall: (data) => {
      // Only show incoming calls for this conversation
      console.log('Incoming call data:', data);
      setIncomingCall({
        callId: data.callId,
        initiator: data.initiator,
        type: data.type,
      });
      setShowIncomingCall(true);
    },
  });

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
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
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
            conversationId={conversationId}
            remoteUserId={conversation.isGroup ? undefined : conversation.otherMember?._id}
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

        {/* Incoming call modal */}
        {showIncomingCall && incomingCall && (
          <CallModal
            open={showIncomingCall}
            onClose={() => {
              setShowIncomingCall(false);
              setIncomingCall(null);
              // If there's an active call, end it when modal is closed
            }}
            conversationId={conversationId}
            isCaller={false}
            remoteName={incomingCall.initiator?.username || "Unknown"}
            remoteUserId={incomingCall.initiator?._id}
            isVideoCall={incomingCall.type === 'video'}
          />
        )}
      </ConversationContainer>
    );
  } catch (error: unknown) {
    console.error("Error loading conversation:", error);
    return null;
  }
};

export default ConversationPage;
