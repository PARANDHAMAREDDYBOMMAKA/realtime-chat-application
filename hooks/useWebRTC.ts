import { useCallback, useRef, useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface MediaState {
  audio: boolean;
  video: boolean;
}

interface UseWebRTCOptions {
  onCallStateChange?: (state: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'declined') => void;
  onError?: (error: string) => void;
  onIncomingCall?: (data: { callId: Id<"calls">; initiator: any; type: 'audio' | 'video' }) => void;
}

export const useWebRTC = (options: UseWebRTCOptions = {}) => {
  const [callState, setCallState] = useState<'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'declined'>('idle');
  const [currentCallId, setCurrentCallId] = useState<Id<"calls"> | null>(null);
  const [mediaState, setMediaState] = useState<MediaState>({ audio: true, video: false });
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Refs for media streams and call tracking
  const localStream = useRef<MediaStream | null>(null);
  const remoteStreams = useRef<Map<string, MediaStream>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const lastProcessedCallId = useRef<Id<"calls"> | null>(null);
  const currentCallIdRef = useRef<Id<"calls"> | null>(null);
  const activeTimeouts = useRef<Set<NodeJS.Timeout>>(new Set());

  // Convex mutations and queries
  const initiateCall = useMutation(api.calls.initiateCall);
  const joinCall = useMutation(api.calls.joinCall);
  const leaveCall = useMutation(api.calls.leaveCall);
  const declineCall = useMutation(api.calls.declineCall);
  const updateMediaState = useMutation(api.calls.updateMediaState);

  // Listen for incoming calls - only when we don't have an active call
  const incomingCall = useQuery(api.calls.getIncomingCall,
    currentCallId || isProcessing ? "skip" : undefined
  );

  // Listen for call status changes for the current call
  const activeCall = useQuery(api.calls.getActiveCall,
    currentCallId ? { conversationId: undefined, roomId: undefined } : "skip"
  );

  const getLocalMedia = useCallback(async (constraints: MediaStreamConstraints) => {
    try {
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
      }

      localStream.current = await navigator.mediaDevices.getUserMedia(constraints);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream.current;
      }

      return localStream.current;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const deviceType = constraints.video && constraints.audio ? 'camera and microphone' :
                         constraints.video ? 'camera' : 'microphone';

      console.error(`Media access error:`, error);
      options.onError?.(`Failed to access ${deviceType}: ${errorMessage}`);
      throw error;
    }
  }, [options]);

  const cleanup = useCallback(() => {
    console.log('Cleaning up call resources');

    // Clear any active timeouts
    activeTimeouts.current.forEach(timeout => {
      clearTimeout(timeout);
    });
    activeTimeouts.current.clear();

    // Stop media streams
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }

    // Clear video refs
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    remoteVideoRefs.current.forEach(video => {
      if (video) video.srcObject = null;
    });

    // Clear state and refs
    remoteStreams.current.clear();
    setIsConnected(false);
    setIsProcessing(false);
    lastProcessedCallId.current = null;
    currentCallIdRef.current = null;
  }, []);

  const startCall = useCallback(async (
    participantIds: Id<"users">[],
    type: 'audio' | 'video',
    roomId?: Id<"rooms">,
    conversationId?: Id<"conversations">
  ) => {
    if (isProcessing || currentCallId || currentCallIdRef.current) {
      console.log('Call already in progress, ignoring new call request');
      options.onError?.('A call is already in progress');
      return;
    }

    if (!participantIds?.length) {
      options.onError?.('No participants specified for the call');
      return;
    }

    try {
      setIsProcessing(true);
      setCallState('calling');
      options.onCallStateChange?.('calling');

      // Get local media first
      await getLocalMedia({
        audio: true,
        video: type === 'video'
      });

      const callId = await initiateCall({
        roomId,
        conversationId,
        type,
        participantIds,
      });

      setCurrentCallId(callId);
      currentCallIdRef.current = callId;
      setMediaState({ audio: true, video: type === 'video' });

      // Call remains in 'calling' state until the other person answers

    } catch (error) {
      console.error('Error starting call:', error);
      cleanup();
      setCallState('ended');
      setCurrentCallId(null);
      options.onCallStateChange?.('ended');
      options.onError?.('Failed to start call');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, currentCallId, callState, initiateCall, getLocalMedia, options, cleanup]);

  const answerCall = useCallback(async (callId: Id<"calls">, isVideo: boolean = false) => {
    if (isProcessing) {
      console.log('Already processing call action');
      return;
    }

    try {
      setIsProcessing(true);
      console.log('Answering call:', callId);

      await getLocalMedia({
        audio: true,
        video: isVideo
      });

      await joinCall({
        callId,
        mediaState: { audio: true, video: isVideo },
      });

      setCurrentCallId(callId);
      currentCallIdRef.current = callId;
      setCallState('connected');
      setMediaState({ audio: true, video: isVideo });
      setIsConnected(true);
      options.onCallStateChange?.('connected');
    } catch (error) {
      console.error('Error answering call:', error);
      cleanup();
      setCallState('ended');
      options.onCallStateChange?.('ended');
      options.onError?.('Failed to answer call');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, joinCall, getLocalMedia, options, cleanup]);

  const endCall = useCallback(async () => {
    if (isProcessing) {
      console.log('Already processing call action');
      return;
    }

    if (!currentCallId) {
      console.log('No active call to end');
      cleanup();
      setCallState('idle');
      setCurrentCallId(null);
      return;
    }

    try {
      setIsProcessing(true);
      console.log('Ending call:', currentCallId);

      await leaveCall({ callId: currentCallId });

      cleanup();
      setCurrentCallId(null);
      setCallState('ended');
      options.onCallStateChange?.('ended');

      // Return to idle after showing ended state
      const idleTimeout = setTimeout(() => {
        setCallState('idle');
        options.onCallStateChange?.('idle');
        activeTimeouts.current.delete(idleTimeout);
      }, 2000);
      activeTimeouts.current.add(idleTimeout);

    } catch (error) {
      console.error('Error ending call:', error);
      cleanup();
      setCurrentCallId(null);
      setCallState('idle');
      options.onCallStateChange?.('idle');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, currentCallId, leaveCall, options, cleanup]);

  const decline = useCallback(async (callId: Id<"calls">) => {
    if (isProcessing) {
      console.log('Already processing call action');
      return;
    }

    try {
      setIsProcessing(true);
      console.log('Declining call:', callId);

      await declineCall({ callId });

      cleanup();
      setCurrentCallId(null);
      setCallState('declined');
      options.onCallStateChange?.('declined');

      // Return to idle after showing declined state
      const declineTimeout = setTimeout(() => {
        setCallState('idle');
        options.onCallStateChange?.('idle');
        activeTimeouts.current.delete(declineTimeout);
      }, 1500);
      activeTimeouts.current.add(declineTimeout);

    } catch (error) {
      console.error('Error declining call:', error);
      cleanup();
      setCurrentCallId(null);
      setCallState('idle');
      options.onCallStateChange?.('idle');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, declineCall, options, cleanup]);

  const toggleMute = useCallback(async () => {
    if (!localStream.current || !currentCallId || isProcessing) return;

    const nextMuted = !mediaState.audio;
    localStream.current.getAudioTracks().forEach(track => {
      track.enabled = nextMuted;
    });

    const newMediaState = { ...mediaState, audio: nextMuted };
    setMediaState(newMediaState);

    try {
      await updateMediaState({
        callId: currentCallId,
        mediaState: newMediaState,
      });
    } catch (error) {
      console.error('Error updating media state:', error);
    }
  }, [mediaState, currentCallId, updateMediaState, isProcessing]);

  const toggleVideo = useCallback(async () => {
    if (!localStream.current || !currentCallId || isProcessing) return;

    const nextVideoEnabled = !mediaState.video;

    if (nextVideoEnabled && localStream.current.getVideoTracks().length === 0) {
      // Need to get video stream
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });

        localStream.current = newStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = newStream;
        }
      } catch (error) {
        options.onError?.('Failed to access camera');
        return;
      }
    } else {
      localStream.current.getVideoTracks().forEach(track => {
        track.enabled = nextVideoEnabled;
      });
    }

    const newMediaState = { ...mediaState, video: nextVideoEnabled };
    setMediaState(newMediaState);

    try {
      await updateMediaState({
        callId: currentCallId,
        mediaState: newMediaState,
      });
    } catch (error) {
      console.error('Error updating media state:', error);
    }
  }, [mediaState, currentCallId, updateMediaState, options, isProcessing]);

  // Set video element refs
  const setLocalVideoRef = useCallback((ref: HTMLVideoElement | null) => {
    localVideoRef.current = ref;
    if (ref && localStream.current) {
      ref.srcObject = localStream.current;
    }
  }, []);

  const setRemoteVideoRef = useCallback((userId: string, ref: HTMLVideoElement | null) => {
    if (ref) {
      remoteVideoRefs.current.set(userId, ref);
      const stream = remoteStreams.current.get(userId);
      if (stream) {
        ref.srcObject = stream;
      }
    } else {
      remoteVideoRefs.current.delete(userId);
    }
  }, []);

  // Handle incoming calls - only process each call once
  useEffect(() => {
    if (incomingCall &&
        incomingCall._id !== lastProcessedCallId.current &&
        !currentCallId &&
        !isProcessing) {

      console.log('Processing incoming call:', incomingCall._id);
      lastProcessedCallId.current = incomingCall._id;

      setCallState('ringing');
      setCurrentCallId(incomingCall._id);
      currentCallIdRef.current = incomingCall._id;
      options.onCallStateChange?.('ringing');
      options.onIncomingCall?.({
        callId: incomingCall._id,
        initiator: incomingCall.initiator,
        type: incomingCall.type,
      });
    }
  }, [incomingCall, currentCallId, isProcessing, options]);

  // Handle active call status changes (for caller when recipient answers)
  useEffect(() => {
    if (activeCall &&
        currentCallId &&
        activeCall._id === currentCallId &&
        activeCall.status === "active" &&
        callState === 'calling') {

      console.log('Call became active, transitioning to connected');
      setCallState('connected');
      setIsConnected(true);
      options.onCallStateChange?.('connected');
    }
  }, [activeCall, currentCallId, callState, options]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    callState,
    currentCallId,
    mediaState,
    isConnected,
    isProcessing,
    startCall,
    answerCall,
    endCall,
    decline,
    toggleMute,
    toggleVideo,
    setLocalVideoRef,
    setRemoteVideoRef,
    incomingCall,
    remoteStreams: Array.from(remoteStreams.current.entries()),
  };
};