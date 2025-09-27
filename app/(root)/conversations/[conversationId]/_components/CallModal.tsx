import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Mic, MicOff, Phone, PhoneOff, X } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useWebRTC } from "@/hooks/useWebRTC";
import { Id } from "@/convex/_generated/dataModel";

interface CallModalProps {
  open: boolean;
  onClose: () => void;
  conversationId: Id<"conversations">;
  roomId?: Id<"rooms">;
  isCaller: boolean;
  remoteName: string;
  remoteUserId?: Id<"users">;
  isVideoCall?: boolean;
}

export default function CallModal({
  open,
  onClose,
  conversationId,
  roomId,
  isCaller,
  remoteName,
  remoteUserId,
  isVideoCall = false,
}: CallModalProps) {
  const { user } = useUser();
  const [callDuration, setCallDuration] = useState(0);
  const callTimer = React.useRef<NodeJS.Timeout | null>(null);

  const {
    callState,
    currentCallId,
    mediaState,
    isProcessing,
    startCall,
    answerCall,
    endCall,
    decline,
    toggleMute,
    toggleVideo,
    setLocalVideoRef,
    setRemoteVideoRef,
    remoteStreams,
  } = useWebRTC({
    onCallStateChange: (state) => {
      if (state === 'connected') {
        // Start call timer
        callTimer.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
      } else if (state === 'ended' || state === 'declined') {
        // Clear timer
        if (callTimer.current) {
          clearInterval(callTimer.current);
          callTimer.current = null;
        }
        // Auto close after a delay
        const closeTimeout = setTimeout(() => {
          onClose();
        }, 2000);
        // Store timeout for cleanup if needed
        callTimer.current = closeTimeout;
      }
    },
    onError: (error) => {
      console.error('Call error:', error);
    },
    onIncomingCall: () => {
      // This is handled by the parent component
    },
  });

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start call when modal opens for caller
  useEffect(() => {
    if (open && isCaller && remoteUserId && user) {
      const participantIds = [remoteUserId];
      startCall(participantIds, isVideoCall ? 'video' : 'audio', roomId, conversationId);
    }
  }, [open, isCaller, remoteUserId, user, isVideoCall, roomId, conversationId, startCall]);

  const handleAccept = useCallback(() => {
    if (currentCallId && !isProcessing) {
      answerCall(currentCallId, isVideoCall);
    }
  }, [currentCallId, isProcessing, answerCall, isVideoCall]);

  const handleDecline = useCallback(() => {
    if (currentCallId && !isProcessing) {
      decline(currentCallId);
    }
  }, [currentCallId, isProcessing, decline]);

  const handleHangup = useCallback(() => {
    endCall();
  }, [endCall]);

  // Cleanup call timer and ensure call ends when modal closes
  useEffect(() => {
    return () => {
      if (callTimer.current) {
        clearInterval(callTimer.current);
        callTimer.current = null;
      }
      // Ensure call is ended when component unmounts
      if (callState === 'connected' || callState === 'calling' || callState === 'ringing') {
        endCall();
      }
    };
  }, [callState, endCall]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/95 via-black/90 to-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-md mx-auto">
        <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Status indicator */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-6">
              {/* Avatar or video for remote user */}
              {isVideoCall && callState === "connected" && remoteStreams.length > 0 ? (
                <div className="relative w-32 h-32 rounded-full overflow-hidden bg-slate-700">
                  <video
                    ref={(ref) => setRemoteVideoRef(remoteStreams[0][0], ref)}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                  {remoteName?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}

              {/* Call state indicator */}
              {callState === "calling" && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}

              {callState === "ringing" && (
                <>
                  <div className="absolute -inset-4 rounded-full border-4 border-green-500/60 animate-ping"></div>
                  <div className="absolute -inset-2 rounded-full border-4 border-green-500 animate-pulse"></div>
                </>
              )}
            </div>

            {/* Call info */}
            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              {remoteName}
            </h2>

            <div className="text-center">
              {callState === "calling" && (
                <p className="text-slate-300 animate-pulse">
                  {isVideoCall ? 'Video calling...' : 'Calling...'}
                </p>
              )}
              {callState === "ringing" && (
                <p className="text-green-400 font-medium">
                  Incoming {isVideoCall ? 'video' : 'voice'} call
                </p>
              )}
              {callState === "connected" && (
                <div className="text-center">
                  <p className="text-green-400 font-medium">
                    {isVideoCall ? 'Video call' : 'Voice call'} • Connected
                  </p>
                  <p className="text-slate-300 text-sm mt-1">
                    {formatDuration(callDuration)}
                  </p>
                </div>
              )}
              {callState === "ended" && (
                <p className="text-slate-400">Call ended</p>
              )}
              {callState === "declined" && (
                <p className="text-red-400">Call declined</p>
              )}
            </div>
          </div>

          {/* Video call UI */}
          {isVideoCall && (callState === "connected" || callState === "calling") && (
            <div className="mb-6">
              <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                {/* Remote video */}
                {remoteStreams.length > 0 && (
                  <video
                    ref={(ref) => setRemoteVideoRef(remoteStreams[0][0], ref)}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ backgroundColor: '#1e293b' }}
                  />
                )}

                {/* Local video (Picture-in-picture) */}
                <div className="absolute bottom-4 right-4 w-24 h-18 rounded-xl overflow-hidden border-2 border-white/40 shadow-2xl bg-slate-700">
                  <video
                    ref={setLocalVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Video call overlay controls */}
                <div className="absolute top-4 left-4 flex gap-2">
                  {!mediaState.video && (
                    <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium">
                      📷 Camera off
                    </div>
                  )}
                  {!mediaState.audio && (
                    <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium">
                      🎤 Muted
                    </div>
                  )}
                </div>

                {/* Connection overlay for when no remote video */}
                {(callState === "calling" || remoteStreams.length === 0) && (
                  <div className="absolute inset-0 bg-slate-800/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mb-4 animate-pulse">
                        {remoteName?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <p className="text-white text-sm">
                        {callState === "calling" ? "Calling..." : "Waiting for video..."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Call controls */}
          <div className="flex items-center justify-center gap-4">
            {/* Incoming call controls */}
            {callState === "ringing" && (
              <>
                <Button
                  onClick={handleDecline}
                  disabled={isProcessing}
                  size="icon"
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 disabled:bg-red-400 border-0 shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
                  aria-label="Decline call"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
                <Button
                  onClick={handleAccept}
                  disabled={isProcessing}
                  size="icon"
                  className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 disabled:bg-green-400 border-0 shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 animate-pulse"
                  aria-label="Accept call"
                >
                  <Phone className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Active call controls */}
            {callState === "connected" && (
              <>
                <Button
                  onClick={toggleMute}
                  variant={mediaState.audio ? "secondary" : "destructive"}
                  size="icon"
                  className="w-12 h-12 rounded-full border-0 shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
                >
                  {mediaState.audio ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>

                {isVideoCall && (
                  <Button
                    onClick={toggleVideo}
                    variant={mediaState.video ? "secondary" : "destructive"}
                    size="icon"
                    className="w-12 h-12 rounded-full border-0 shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
                  >
                    {mediaState.video ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
                  </Button>
                )}

                <Button
                  onClick={handleHangup}
                  disabled={isProcessing}
                  size="icon"
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 disabled:bg-red-400 border-0 shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Outgoing call controls */}
            {callState === "calling" && (
              <Button
                onClick={handleHangup}
                size="icon"
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 border-0 shadow-lg"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            )}

            {/* End state controls */}
            {(callState === "ended" || callState === "declined") && (
              <Button
                onClick={onClose}
                className="px-8 py-3 rounded-full bg-slate-700 hover:bg-slate-600 text-white border-0"
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}