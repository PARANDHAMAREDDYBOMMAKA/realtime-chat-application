"use client";
import ConversationContainer from "@/components/shared/conversation/ConversationContainer";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import React, { useState, useEffect } from "react";
import Header from "./_components/Header";
import Body from "./_components/body/Body";
import ChatInput from "./_components/input/ChatInput";
import RemoveFriendDialog from "./_components/dialogs/RemoveFriendDialog";
import DeleteGroupDialog from "./_components/dialogs/DeleteGroupDialog";
import EnhancedLoading from "@/components/shared/EnhancedLoading";
import VideoCall from "./_components/VideoCall";
import IncomingCallNotification from "./_components/IncomingCallNotification";
import OutgoingCallNotification from "./_components/OutgoingCallNotification";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

type Props = {
  params: Promise<{
    conversationId: Id<"conversations">;
  }>;
};

const ConversationPage = ({ params }: Props) => {
  const [conversationId, setConversationId] =
    useState<Id<"conversations"> | null>(null);
  const { user } = useUser();

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

  // Call queries and mutations
  const activeCall = useQuery(
    api.call.getActiveCall,
    conversationId ? { conversationId } : "skip"
  );
  const startCall = useMutation(api.call.start);
  const acceptCall = useMutation(api.call.accept);
  const rejectCall = useMutation(api.call.reject);
  const endCall = useMutation(api.call.end);

  const [removeFriendDialog, setRemoveFriendDialog] = useState(false);
  const [deleteGroupDialog, setDeleteGroupDialog] = useState(false);
  const [leaveGroupDialog, setLeaveGroupDialog] = useState(false);
  const [isInCall, setIsInCall] = useState(false);

  // Update isInCall based on activeCall status
  useEffect(() => {
    if (activeCall?.status === "active") {
      setIsInCall(true);
    } else if (activeCall?.status === "ended") {
      setIsInCall(false);
    }
  }, [activeCall]);

  const handleStartVideoCall = async () => {
    try {
      if (!conversationId) return;
      await startCall({ conversationId, type: "video" });
      toast.success("Calling...");
    } catch (error) {
      toast.error("Failed to start call");
      console.error("Error starting call:", error);
    }
  };

  const handleStartAudioCall = async () => {
    try {
      if (!conversationId) return;
      await startCall({ conversationId, type: "audio" });
      toast.success("Calling...");
    } catch (error) {
      toast.error("Failed to start call");
      console.error("Error starting call:", error);
    }
  };

  const handleAcceptCall = async () => {
    try {
      if (!activeCall) return;
      await acceptCall({ callId: activeCall._id });
      setIsInCall(true);
    } catch (error) {
      toast.error("Failed to accept call");
      console.error("Error accepting call:", error);
    }
  };

  const handleRejectCall = async () => {
    try {
      if (!activeCall) return;
      await rejectCall({ callId: activeCall._id });
    } catch (error) {
      toast.error("Failed to reject call");
      console.error("Error rejecting call:", error);
    }
  };

  const handleLeaveCall = async () => {
    try {
      if (!activeCall) return;
      await endCall({ callId: activeCall._id });
      setIsInCall(false);
    } catch (error) {
      toast.error("Failed to end call");
      console.error("Error ending call:", error);
    }
  };

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

        {/* Incoming Call Notification */}
        {activeCall?.status === "ringing" && !activeCall.isInitiator && conversation && (
          <IncomingCallNotification
            callerName={
              conversation.isGroup
                ? conversation.name || "Group"
                : activeCall.initiator?.username || "Unknown"
            }
            callerImage={
              conversation.isGroup
                ? undefined
                : activeCall.initiator?.imageUrl
            }
            callType={activeCall.type}
            onAccept={handleAcceptCall}
            onReject={handleRejectCall}
          />
        )}

        {/* Outgoing Call Notification */}
        {activeCall?.status === "ringing" && activeCall.isInitiator && conversation && (
          <OutgoingCallNotification
            recipientName={
              conversation.isGroup
                ? conversation.name || "Group"
                : conversation.otherMember?.username || "Unknown"
            }
            recipientImage={
              conversation.isGroup
                ? undefined
                : conversation.otherMember?.imageUrl
            }
            callType={activeCall.type}
            onCancel={handleRejectCall}
          />
        )}

        {/* Video/Audio Call Interface */}
        {isInCall && activeCall && conversation && user && (
          <VideoCall
            roomName={conversationId}
            participantName={user.username || user.firstName || "User"}
            onLeave={handleLeaveCall}
            audioOnly={activeCall.type === "audio"}
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
            onVideoCall={handleStartVideoCall}
            onAudioCall={handleStartAudioCall}
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
