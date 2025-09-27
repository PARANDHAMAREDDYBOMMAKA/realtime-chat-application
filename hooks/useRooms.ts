import { useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

export const useRooms = () => {
  // Queries
  const rooms = useQuery(api.rooms.getRooms);
  const publicRooms = useQuery(api.rooms.getPublicRooms, { limit: 20 });

  // Mutations
  const createRoom = useMutation(api.rooms.createRoom);
  const joinRoom = useMutation(api.rooms.joinRoom);
  const leaveRoom = useMutation(api.rooms.leaveRoom);
  const updateUserStatus = useMutation(api.rooms.updateUserStatus);

  const handleCreateRoom = useCallback(async (data: {
    name: string;
    description?: string;
    isPrivate: boolean;
    maxParticipants?: number;
  }) => {
    try {
      const roomId = await createRoom(data);
      return roomId;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }, [createRoom]);

  const handleJoinRoom = useCallback(async (roomId: Id<"rooms">) => {
    try {
      const memberId = await joinRoom({ roomId });
      return memberId;
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  }, [joinRoom]);

  const handleLeaveRoom = useCallback(async (roomId: Id<"rooms">) => {
    try {
      await leaveRoom({ roomId });
    } catch (error) {
      console.error('Error leaving room:', error);
      throw error;
    }
  }, [leaveRoom]);

  const handleUpdateStatus = useCallback(async (status: 'online' | 'offline' | 'away') => {
    try {
      await updateUserStatus({ status });
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  }, [updateUserStatus]);

  return {
    rooms: rooms || [],
    publicRooms: publicRooms || [],
    createRoom: handleCreateRoom,
    joinRoom: handleJoinRoom,
    leaveRoom: handleLeaveRoom,
    updateStatus: handleUpdateStatus,
  };
};

export const useRoomDetails = (roomId: Id<"rooms"> | undefined) => {
  const roomDetails = useQuery(api.rooms.getRoomDetails, roomId ? { roomId } : "skip");

  return {
    room: roomDetails,
    isLoading: roomDetails === undefined,
  };
};