import React from 'react';
import { ConversationFallback } from '@/components/shared/conversation/ConversationFallback';

export default function RoomsPage() {
  return (
    <ConversationFallback
      title="Select a Room"
      description="Choose a room to start chatting or create a new one."
    />
  );
}